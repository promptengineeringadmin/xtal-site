import { NextResponse } from 'next/server'
import { validateDemoRequest, sanitizeString } from '@/lib/validation'
import { appendLeadToSheet } from '@/lib/google-sheets'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Honeypot check - if filled, silently succeed (likely bot)
    if (body.honeyPot) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Normalize pain field (accept both 'pain' and 'message' for compatibility)
    const normalizedBody = {
      ...body,
      pain: body.pain || body.message || '',
    }

    // Validate input
    const validation = validateDemoRequest(normalizedBody)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Sanitize data
    const sanitizedData = {
      name: sanitizeString(normalizedBody.name),
      email: sanitizeString(normalizedBody.email).toLowerCase(),
      company: sanitizeString(normalizedBody.company),
      pain: normalizedBody.pain ? sanitizeString(normalizedBody.pain) : '',
      source: sanitizeString(normalizedBody.source || 'website'),
      plan: normalizedBody.plan ? sanitizeString(normalizedBody.plan) : '',
      page: normalizedBody.page ? sanitizeString(normalizedBody.page) : '',
      timestamp: new Date().toISOString(),
    }

    // Store lead in Google Sheets (non-blocking - don't fail request if this fails)
    try {
      await appendLeadToSheet({
        name: sanitizedData.name,
        email: sanitizedData.email,
        company: sanitizedData.company,
        pain: sanitizedData.pain,
        source: `${sanitizedData.source}${sanitizedData.plan ? ` (${sanitizedData.plan})` : ''}`,
        page: sanitizedData.page,
        timestamp: sanitizedData.timestamp,
      })
    } catch (sheetError) {
      console.error('Failed to store lead in Google Sheets:', sheetError)
    }

    // Log the submission
    console.log('Demo request received:', sanitizedData)

    // Send notification email if configured
    if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        await resend.emails.send({
          from: 'XTAL Search <onboarding@resend.dev>',
          to: process.env.NOTIFICATION_EMAIL,
          subject: `New Demo Request: ${sanitizedData.company}`,
          html: `
            <h2>New Demo Request</h2>
            <p><strong>Name:</strong> ${sanitizedData.name}</p>
            <p><strong>Email:</strong> ${sanitizedData.email}</p>
            <p><strong>Company:</strong> ${sanitizedData.company}</p>
            <p><strong>Source:</strong> ${sanitizedData.source}</p>
            ${sanitizedData.plan ? `<p><strong>Plan Interest:</strong> ${sanitizedData.plan}</p>` : ''}
            ${sanitizedData.page ? `<p><strong>Page:</strong> ${sanitizedData.page}</p>` : ''}
            <p><strong>What's broken:</strong></p>
            <p>${sanitizedData.pain || 'Not provided'}</p>
            <hr />
            <p><small>Submitted at: ${sanitizedData.timestamp}</small></p>
          `,
        })
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Demo request submitted successfully',
        bookingUrl: process.env.DEMO_BOOKING_URL || null,
      },
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
