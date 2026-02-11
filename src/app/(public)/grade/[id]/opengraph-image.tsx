import { ImageResponse } from "next/og"
import { getReport } from "@/lib/grader/logger"

export const runtime = "edge"
export const alt = "XTAL Search Health Report"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#22c55e", text: "#ffffff" },
  B: { bg: "#3b82f6", text: "#ffffff" },
  C: { bg: "#f59e0b", text: "#ffffff" },
  D: { bg: "#f97316", text: "#ffffff" },
  F: { bg: "#ef4444", text: "#ffffff" },
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let storeName = "Store"
  let score = 0
  let grade = "F"
  let summary = ""
  let platform = ""

  try {
    const report = await getReport(id)
    if (report) {
      storeName = report.storeName
      score = report.overallScore
      grade = report.overallGrade
      summary = report.summary
      platform = report.platform
    }
  } catch {
    // Use defaults
  }

  const gradeColor = GRADE_COLORS[grade] || GRADE_COLORS.F

  // Score arc: full circle = 283 circumference at r=45
  const circumference = 283
  const filled = (score / 100) * circumference
  const dashArray = `${filled} ${circumference - filled}`

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0F1A35 0%, #1a2a5e 40%, #0F1A35 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Glow effects */}
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: "160px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: `${gradeColor.bg}15`,
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "200px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "#3b82f620",
            filter: "blur(60px)",
          }}
        />

        {/* Left column: Score */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "400px",
            flexShrink: 0,
          }}
        >
          {/* Score circle */}
          <div
            style={{
              position: "relative",
              width: "240px",
              height: "240px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="240"
              height="240"
              viewBox="0 0 120 120"
              style={{ position: "absolute", top: 0, left: 0 }}
            >
              {/* Background ring */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              {/* Score ring */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke={gradeColor.bg}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={dashArray}
                strokeDashoffset="0"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: "72px",
                  fontWeight: 800,
                  color: "white",
                  lineHeight: 1,
                }}
              >
                {score}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  color: "rgba(255,255,255,0.5)",
                  marginTop: "4px",
                }}
              >
                out of 100
              </div>
            </div>
          </div>

          {/* Grade badge */}
          <div
            style={{
              marginTop: "20px",
              padding: "8px 32px",
              background: gradeColor.bg,
              color: gradeColor.text,
              fontSize: "28px",
              fontWeight: 800,
              borderRadius: "12px",
              letterSpacing: "0.05em",
            }}
          >
            Grade: {grade}
          </div>
        </div>

        {/* Right column: Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            paddingLeft: "40px",
            gap: "20px",
          }}
        >
          {/* XTAL brand */}
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#60a5fa",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}
          >
            Search Health Report
          </div>

          {/* Store name */}
          <div
            style={{
              fontSize: "44px",
              fontWeight: 800,
              color: "white",
              lineHeight: 1.15,
              maxWidth: "600px",
            }}
          >
            {storeName.length > 30 ? storeName.slice(0, 30) + "..." : storeName}
          </div>

          {/* Platform tag */}
          {platform && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  padding: "4px 12px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.6)",
                  textTransform: "capitalize",
                }}
              >
                {platform}
              </div>
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div
              style={{
                fontSize: "18px",
                color: "#94a3b8",
                lineHeight: 1.5,
                maxWidth: "580px",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                overflow: "hidden",
              }}
            >
              {summary.length > 160 ? summary.slice(0, 160) + "..." : summary}
            </div>
          )}

          {/* XTAL branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.15em",
              }}
            >
              POWERED BY XTAL SEARCH
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
