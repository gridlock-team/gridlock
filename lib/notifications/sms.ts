import twilio from 'twilio'
import { env } from '@/lib/env'

const client = twilio(
  env.TWILIO_ACCOUNT_SID,
  env.TWILIO_AUTH_TOKEN
)

export interface SmsPayload {
  to: string
  body: string
}

export async function sendSms({ to, body }: SmsPayload): Promise<void> {
  await client.messages.create({
    from: env.TWILIO_FROM_NUMBER,
    to,
    body,
  })
}
