import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'XTAL Search - AI-Native Product Discovery for E-Commerce'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0F1A35 0%, #1a2a5e 50%, #0F1A35 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#60a5fa',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            XTAL Search
          </div>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.2,
              maxWidth: '900px',
            }}
          >
            AI-Native Product Discovery for E-Commerce
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#94a3b8',
              textAlign: 'center',
              maxWidth: '700px',
              lineHeight: 1.5,
            }}
          >
            Natural language search that understands intent, not just keywords.
          </div>
          <div
            style={{
              marginTop: '20px',
              padding: '14px 40px',
              background: 'white',
              color: '#0F1A35',
              fontSize: '20px',
              fontWeight: 700,
              borderRadius: '12px',
            }}
          >
            Request a Demo
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
