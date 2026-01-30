import { NextResponse } from 'next/server'
import { validateDemoRequest, sanitizeString } from '@/lib/validation'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateDemoRequest(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Sanitize data
    const sanitizedData = {
      name: sanitizeString(body.name),
      email: sanitizeString(body.email).toLowerCase(),
      company: sanitizeString(body.company),
      platform: sanitizeString(body.platform),
      pain: body.pain ? sanitizeString(body.pain) : '',
      submittedAt: new Date().toISOString(),
    }

    // Log the submission (in production, you'd store this or send an email)
    console.log('Demo request received:', sanitizedData)

    // If Resend API key is configured, send notification email
    if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        await resend.emails.send({
          from: 'XTAL Search <onboarding@resend.dev>',
          to: process.env.NOTIFICATION_EMAIL,
          subject: `New Demo Request: ${sanitizedData.company} (${sanitizedData.platform})`,
          html: `
            <h2>New Demo Request</h2>
            <p><strong>Name:</strong> ${sanitizedData.name}</p>
            <p><strong>Email:</strong> ${sanitizedData.email}</p>
            <p><strong>Company:</strong> ${sanitizedData.company}</p>
            <p><strong>Platform:</strong> ${sanitizedData.platform}</p>
            <p><strong>What's broken:</strong></p>
            <p>${sanitizedData.pain || 'Not provided'}</p>
            <hr />
            <p><small>Submitted at: ${sanitizedData.submittedAt}</small></p>
          `,
        })
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(
      { success: true, message: 'Demo request submitted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing demo request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
