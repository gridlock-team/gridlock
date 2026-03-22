# Sports Squares Pool App — Design Spec
**Date:** 2026-03-22
**Status:** Approved

---

## Overview

A Progressive Web App (PWA) for running 10×10 sports squares pools. Any sport is supported. Pool organizers create pools and share a join link; participants claim squares on the grid. When all 100 squares are claimed, the app randomly assigns digits 0–9 to each row and column. During the game, scores are tracked in real time and the winning square is highlighted and announced. No money is handled in the app — organizers manage payouts offline.

Built as a family collaboration project (three contributors).

---

## Platform

- **Type:** Progressive Web App (PWA) — installable on iOS and Android, fully functional in desktop browsers
- **Hosting:** Vercel (free tier)
- **No app store required**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js (React) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (email, Google, Apple, anonymous) |
| Real-time | Supabase Realtime subscriptions |
| SMS | Twilio |
| Email | SendGrid |
| Score APIs | ESPN (NFL/NCAA), API-Football (FIFA) — manual fallback for all others |
| Hosting | Vercel |

---

## User Roles

| Role | Capabilities |
|---|---|
| **Platform Admin** | Manage organizers, view all pools, global settings |
| **Pool Organizer** | Create and manage pools, set payout periods, enter/override scores, share join links |
| **Participant** | Join via link, claim squares, receive notifications, optionally create an account |

---

## Pool Lifecycle

```
draft → open → locked → live → completed
```

| Status | Description |
|---|---|
| `draft` | Organizer is configuring the pool, not yet open |
| `open` | Join link is active, participants can claim squares |
| `locked` | All 100 squares claimed; row/col numbers auto-generated randomly |
| `live` | Game in progress, scores updating, winning squares resolved per period |
| `completed` | Game over, all payouts resolved — triggered automatically when the final payout period's score snapshot is recorded, or manually by the organizer |

---

## The Grid

- 10×10 = 100 squares
- One axis = home team's score last digit; other axis = away team's score last digit
- When pool locks (100/100 squares claimed):
  - Two independent Fisher-Yates shuffles of [0–9] are generated — one for rows, one for columns
  - Numbers animate onto the board live (all connected browsers see it simultaneously)
  - Grid is now immutable
- **Winning square logic:** `home_score % 10` → look up matching column number → find column position; `away_score % 10` → look up matching row number → find row position; winning square = square at (row_position, col_position)

---

## Joining a Pool

- **Guest (no account):** Tap join link → enter name + email or phone → claim squares immediately
- **Registered user:** Sign in with email, Google, or Apple → join pool → squares tracked in account history
- Participants can claim multiple squares in one pool
- Organizer can set a max squares-per-person limit (optional)
- **Guest returning access (v1):** Guests cannot return to manage their squares from a different device or browser session. If they lose the session, the organizer can look up their squares by name. Full cross-device history requires creating an account.

---

## Sports & Scoring

- Any sport is supported — organizer enters team names
- Organizer defines payout periods at pool creation (e.g., Q1 / Half / Q3 / Final for NFL; Half / Full Time for soccer)
- **Automatic score fetching** for supported leagues:
  - NFL & NCAA: ESPN API (same endpoint used in the existing March Madness monitor)
  - FIFA / international soccer: API-Football
  - Poll interval: every 60 seconds during live game window
- **Manual fallback:** Organizer can enter or override any score at any time
- Score update triggers winning square resolution for that period
- **Linking to an external game:** When creating a pool, the organizer can optionally search for the game by team name / date using the relevant API. If found, the `external_game_id` is saved and score polling begins automatically when `game_date` is reached. If not found or not a supported league, the field stays null and the organizer enters scores manually.

---

## Real-Time Updates

- Supabase Realtime subscriptions push live changes to all connected browsers
- Events pushed in real time:
  - Square claimed (grid updates for everyone watching)
  - Numbers revealed (animated onto board when pool locks)
  - Score change (live score banner updates)
  - Winning square highlighted (green glow + winner name)

---

## Notifications

Participants choose SMS, email, or both at join time.

| Trigger | Message |
|---|---|
| Numbers revealed | "The numbers are in! Your square is [Team A] **X** / [Team B] **Y**. Game starts [date]." |
| Period winner (to winner only) | "🏆 [Period] Result: [Team A] score – [Team B] score. YOU WIN! Your square matched." |
| Period result (to all participants) | "[Period] Result: [Team A] score – [Team B] score. Winner: [Name]. Better luck next period!" |
| Final winner | Same as period winner, marked as final payout |
| Organizer reminder (manual) | Custom message sent to all pool participants |

> **Note:** All participants receive a result notification for every period — the winner gets a "YOU WIN" version, everyone else gets the result with the winner's name. Organizer can disable all-participant notifications per pool if desired.

- SMS via Twilio (existing account credentials reusable)
- Email via SendGrid
- Notifications triggered server-side from Next.js API route when a `score_snapshot` is inserted with a resolved `winning_square_id`

---

## Data Model

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| display_name | text | |
| email | text | |
| phone | text | |
| role | enum | admin \| organizer \| participant |
| auth_id | uuid | Supabase Auth reference |
| created_at | timestamptz | |

### `pools`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| sport | text | |
| team_home | text | |
| team_away | text | |
| status | enum | draft \| open \| locked \| live \| completed |
| organizer_id | uuid FK | → users |
| join_token | text UNIQUE | URL slug for join link |
| payout_periods | jsonb | Array of period names e.g. ["Q1","Half","Q3","Final"] |
| game_date | timestamptz | |
| external_game_id | text | For API score fetching (nullable) |
| created_at | timestamptz | |

### `squares`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| pool_id | uuid FK | → pools |
| row | int | 0–9 |
| col | int | 0–9 |
| owner_id | uuid FK | → users (nullable for guests) |
| guest_name | text | |
| guest_email | text | |
| guest_phone | text | |
| claimed_at | timestamptz | |

### `pool_numbers`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| pool_id | uuid FK | → pools |
| axis | enum | row \| col |
| position | int | 0–9 (grid position) |
| number | int | 0–9 (randomly assigned digit) |

Generated via Fisher-Yates shuffle when pool transitions to `locked`. Two sets per pool (one for rows, one for cols).

### `score_snapshots`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| pool_id | uuid FK | → pools |
| period_name | text | e.g. "Q1", "Half", "Final" |
| home_score | int | |
| away_score | int | |
| winning_square_id | uuid FK | → squares (resolved on insert) |
| recorded_at | timestamptz | |

---

## Key User Flows

### Organizer Creates a Pool
1. Log in → "Create Pool"
2. Enter: sport, team names, game date, payout periods, optional max-squares-per-person
3. Pool opens — unique join link generated (e.g. `squaresapp.com/join/abc123`)
4. Share link via text or email to participants
5. Watch grid fill in real time
6. When 100/100 → numbers auto-generate and animate live
7. During game: scores update automatically (or manually) → winners auto-detected and notified

### Participant Joins
1. Tap join link → enter name + email or phone (no password required)
2. Grid appears — tap open squares to claim (multiple allowed)
3. Optionally create account for cross-pool history
4. Watch their square(s) in real time during the game
5. Win → immediate SMS/email notification

### Numbers Reveal
1. 100th square is claimed
2. Server generates two Fisher-Yates shuffles
3. Supabase Realtime broadcasts `pool_numbers` to all connected clients
4. Numbers animate onto column and row headers simultaneously
5. Pool status transitions to `locked` → grid is immutable

---

## Out of Scope (v1)

- In-app payments or prize tracking
- Chat or comments
- Push notifications (PWA service worker notifications — use SMS/email instead for v1)
- Public pool discovery / marketplace
- Mobile native app (iOS/Android)
