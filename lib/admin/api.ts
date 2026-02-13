const BACKEND_URL = process.env.XTAL_BACKEND_URL
const COGNITO_TOKEN_URL = process.env.COGNITO_URL ?? ""
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID ?? ""
const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET ?? ""
const COGNITO_SCOPE = process.env.COGNITO_SCOPE ?? ""

let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getCognitoToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && now < tokenExpiresAt - 30) {
    return cachedToken
  }

  const basicAuth = Buffer.from(`${COGNITO_CLIENT_ID}:${COGNITO_CLIENT_SECRET}`).toString("base64")

  const resp = await fetch(COGNITO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body:
      `grant_type=client_credentials` +
      `&scope=${encodeURIComponent(COGNITO_SCOPE)}`,
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Cognito auth ${resp.status}: ${text}`)
  }

  const data = await resp.json()
  cachedToken = data.access_token
  tokenExpiresAt = now + Number(data.expires_in ?? 300)
  return cachedToken!
}

export async function adminFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  if (!BACKEND_URL) {
    throw new Error("XTAL_BACKEND_URL not configured")
  }

  const token = await getCognitoToken()

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init.headers as Record<string, string> | undefined),
  }

  // Only set Content-Type for non-FormData bodies.
  // FormData sets its own Content-Type with multipart boundary.
  if (!(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
  })
}
