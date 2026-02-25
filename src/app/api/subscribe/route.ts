import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { sanitizeString } from '@/lib/validation'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const sanitizedEmail = sanitizeString(email).toLowerCase()

    if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_AUDIENCE_ID) {
      console.warn('Mailchimp not configured, skipping subscribe')
      return NextResponse.json({ success: true })
    }

    const apiKey = process.env.MAILCHIMP_API_KEY.trim()
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID.trim()
    const dc = apiKey.split('-').pop()
    const subscriberHash = createHash('md5').update(sanitizedEmail).digest('hex')

    const res = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `apikey ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: sanitizedEmail,
          status_if_new: 'subscribed',
          tags: ['newsletter'],
        }),
      }
    )

    if (!res.ok) {
      console.error('Mailchimp subscribe failed:', await res.text())
      return NextResponse.json({ error: 'Subscribe failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
