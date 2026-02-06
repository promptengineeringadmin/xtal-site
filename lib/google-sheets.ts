interface LeadData {
  name: string
  email: string
  company: string
  pain: string
  source: string
  page: string
  referrer: string
  utm: string
  timestamp: string
}

const SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL

export async function appendLeadToSheet(data: LeadData): Promise<void> {
  if (!SHEETS_WEBHOOK_URL) {
    console.warn('Google Sheets webhook URL not configured, skipping lead storage')
    return
  }

  const res = await fetch(SHEETS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error(`Google Sheets webhook returned ${res.status}`)
  }
}
