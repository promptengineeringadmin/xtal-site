import { google } from 'googleapis'

interface LeadData {
  name: string
  email: string
  company: string
  pain: string
  source: string
  timestamp: string
}

export async function appendLeadToSheet(data: LeadData): Promise<void> {
  // Return early if credentials not configured (for local dev)
  if (
    !process.env.GOOGLE_SHEETS_PRIVATE_KEY ||
    !process.env.GOOGLE_SHEETS_CLIENT_EMAIL ||
    !process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  ) {
    console.warn('Google Sheets credentials not configured, skipping lead storage')
    return
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const sheets = google.sheets({ version: 'v4', auth })

  const row = [
    data.timestamp,
    data.name,
    data.email,
    data.company,
    data.pain || '',
    data.source || 'website',
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: 'Sheet1!A:F',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row],
    },
  })
}
