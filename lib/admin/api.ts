const BACKEND_URL = process.env.XTAL_BACKEND_URL

// Cognito (legacy — xtal-shopify-backend)
const COGNITO_TOKEN_URL = process.env.COGNITO_URL ?? ""
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID ?? ""
const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET ?? ""
const COGNITO_SCOPE = process.env.COGNITO_SCOPE ?? ""

// Authentik (new — xtal-search-app)
const AUTHENTIK_TOKEN_URL = process.env.AUTHENTIK_TOKEN_URL ?? ""
const AUTHENTIK_CLIENT_ID = process.env.AUTHENTIK_CLIENT_ID ?? ""
const AUTHENTIK_CLIENT_SECRET = process.env.AUTHENTIK_CLIENT_SECRET ?? ""

let cachedToken: string | null = null
let tokenExpiresAt = 0
let cachedProvider: "cognito" | "authentik" | null = null

export function getAuthProvider(): "cognito" | "authentik" {
  if (AUTHENTIK_TOKEN_URL && AUTHENTIK_CLIENT_ID && AUTHENTIK_CLIENT_SECRET) {
    return "authentik"
  }
  if (COGNITO_TOKEN_URL && COGNITO_CLIENT_ID && COGNITO_CLIENT_SECRET) {
    return "cognito"
  }
  throw new Error("No auth provider configured. Set AUTHENTIK_* or COGNITO_* env vars.")
}

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
    signal: AbortSignal.timeout(5_000),
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

async function getAuthentikToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && now < tokenExpiresAt - 30) {
    return cachedToken
  }

  const resp = await fetch(AUTHENTIK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: AUTHENTIK_CLIENT_ID,
      client_secret: AUTHENTIK_CLIENT_SECRET,
    }).toString(),
    signal: AbortSignal.timeout(5_000),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Authentik auth ${resp.status}: ${text}`)
  }

  const data = await resp.json()
  cachedToken = data.access_token
  tokenExpiresAt = now + Number(data.expires_in ?? 300)
  return cachedToken!
}

async function getAuthToken(): Promise<string> {
  const provider = getAuthProvider()
  if (cachedProvider && cachedProvider !== provider) {
    cachedToken = null
    tokenExpiresAt = 0
  }
  cachedProvider = provider
  return provider === "authentik" ? getAuthentikToken() : getCognitoToken()
}

export async function adminFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  if (!BACKEND_URL) {
    throw new Error("XTAL_BACKEND_URL not configured")
  }

  const token = await getAuthToken()

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
    signal: init.signal ?? AbortSignal.timeout(10_000),
  })
}
