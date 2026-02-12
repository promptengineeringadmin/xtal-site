import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Circle,
} from "@react-pdf/renderer"
import type { GraderReport, DimensionScore, Recommendation, TestQuery } from "./types"

// ─── Brand Colors ──────────────────────────────────────────

const XTAL_NAVY = "#1B2D5B"
const XTAL_DARK = "#0F1A35"
const XTAL_ICE = "#E8ECF1"
const XTAL_BLUE = "#3b82f6"
const WHITE = "#ffffff"
const SLATE_50 = "#f8fafc"
const SLATE_100 = "#f1f5f9"
const SLATE_200 = "#e2e8f0"
const SLATE_400 = "#94a3b8"
const SLATE_500 = "#64748b"
const SLATE_600 = "#475569"
const SLATE_700 = "#334155"
const SLATE_900 = "#0f172a"

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#22c55e", text: WHITE },
  B: { bg: "#3b82f6", text: WHITE },
  C: { bg: "#f59e0b", text: WHITE },
  D: { bg: "#f97316", text: WHITE },
  F: { bg: "#ef4444", text: WHITE },
}

const GRADE_DESCRIPTIONS: Record<string, string> = {
  A: "Excellent",
  B: "Strong",
  C: "Average",
  D: "Below Average",
  F: "Needs Improvement",
}

const DIMENSION_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#14b8a6",
  "#22c55e",
  "#f59e0b",
  "#f43f5e",
  "#06b6d4",
]

// ─── Styles ────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingHorizontal: 48,
    paddingVertical: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: SLATE_700,
    backgroundColor: WHITE,
  },
  coverPage: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: WHITE,
    backgroundColor: XTAL_DARK,
  },

  // Cover page
  coverContainer: {
    flex: 1,
    padding: 60,
    justifyContent: "space-between",
  },
  coverBrand: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 4,
    color: XTAL_BLUE,
    marginBottom: 8,
  },
  coverTitle: {
    fontSize: 16,
    color: SLATE_400,
    marginBottom: 60,
  },
  coverScoreSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  coverScoreNumber: {
    fontSize: 96,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    lineHeight: 1,
  },
  coverOutOf: {
    fontSize: 14,
    color: SLATE_400,
    marginTop: 4,
    marginBottom: 16,
  },
  coverGradeBadge: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  coverGradeText: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  coverStoreName: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textAlign: "center",
    marginBottom: 8,
  },
  coverStoreUrl: {
    fontSize: 12,
    color: SLATE_400,
    textAlign: "center",
    marginBottom: 4,
  },
  coverMeta: {
    fontSize: 10,
    color: SLATE_500,
    textAlign: "center",
  },
  coverFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  coverFooterLeft: {
    fontSize: 9,
    color: SLATE_500,
  },
  coverFooterRight: {
    fontSize: 9,
    color: SLATE_500,
    textAlign: "right",
  },

  // Section headers
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: XTAL_NAVY,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: SLATE_500,
    marginBottom: 20,
  },

  // Summary
  summaryBox: {
    backgroundColor: SLATE_50,
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: XTAL_BLUE,
  },
  summaryText: {
    fontSize: 12,
    color: SLATE_600,
    lineHeight: 1.6,
  },

  // Dimensions
  dimensionCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 6,
    backgroundColor: SLATE_50,
  },
  dimensionColorBar: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
  },
  dimensionInfo: {
    flex: 1,
  },
  dimensionLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
    marginBottom: 2,
  },
  dimensionExplanation: {
    fontSize: 8,
    color: SLATE_500,
    lineHeight: 1.4,
  },
  dimensionScoreBox: {
    alignItems: "center",
    width: 55,
  },
  dimensionScore: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
  },
  dimensionGrade: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  // Score bar
  scoreBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: SLATE_200,
    borderRadius: 3,
    marginHorizontal: 12,
  },
  scoreBarFill: {
    height: 6,
    borderRadius: 3,
  },

  // Recommendations
  recCard: {
    marginBottom: 14,
    borderRadius: 8,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: SLATE_200,
    overflow: "hidden",
  },
  recHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
  },
  recColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  recDimension: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: SLATE_500,
  },
  recBody: {
    padding: 14,
  },
  recProblem: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
    marginBottom: 6,
  },
  recSuggestion: {
    fontSize: 10,
    color: SLATE_600,
    lineHeight: 1.5,
    marginBottom: 10,
  },
  recXtalBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  recXtalLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: XTAL_BLUE,
    letterSpacing: 1,
    marginBottom: 4,
  },
  recXtalText: {
    fontSize: 9,
    color: SLATE_600,
    lineHeight: 1.5,
  },

  // Failures
  failureList: {
    marginTop: 8,
  },
  failureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  failureBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: SLATE_400,
    marginRight: 6,
    marginTop: 3,
  },
  failureText: {
    fontSize: 8,
    color: SLATE_600,
    flex: 1,
    lineHeight: 1.4,
  },

  // Footer
  pageFooter: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerBrand: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: SLATE_400,
    letterSpacing: 2,
  },
  footerPage: {
    fontSize: 8,
    color: SLATE_400,
  },

})

// ─── Text sanitizer (Helvetica doesn't support many unicode chars) ──

function sanitize(text: string): string {
  return text
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/↔/g, "<->")
    .replace(/—/g, " - ")
    .replace(/–/g, "-")
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/↑/g, "^")
    .replace(/↓/g, "v")
}

// ─── Helper Components ─────────────────────────────────────

function PageFooter() {
  return (
    <View style={s.pageFooter} fixed>
      <Text style={s.footerBrand}>XTAL SEARCH</Text>
      <Text
        style={s.footerPage}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  )
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const gradeColor = GRADE_COLORS[grade] || GRADE_COLORS.F
  const r = 42
  const circumference = 2 * Math.PI * r
  const filled = (score / 100) * circumference

  return (
    <View style={{ width: 100, height: 100, position: "relative" }}>
      <Svg width={100} height={100} viewBox="0 0 100 100">
        <Circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={SLATE_200}
          strokeWidth={6}
        />
        <Circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={gradeColor.bg}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          transform="rotate(-90 50 50)"
        />
      </Svg>
    </View>
  )
}

function DimensionRow({
  dim,
  index,
}: {
  dim: DimensionScore
  index: number
}) {
  const gradeColor = GRADE_COLORS[dim.grade] || GRADE_COLORS.F
  const barColor = DIMENSION_COLORS[index % DIMENSION_COLORS.length]

  return (
    <View style={s.dimensionCard} wrap={false}>
      <View style={[s.dimensionColorBar, { backgroundColor: barColor }]} />
      <View style={s.dimensionInfo}>
        <Text style={s.dimensionLabel}>{dim.label}</Text>
        <Text style={s.dimensionExplanation}>
          {(() => {
            const t = sanitize(dim.explanation)
            return t.length > 120 ? t.slice(0, 120) + "..." : t
          })()}
        </Text>
      </View>
      <View style={s.scoreBarContainer}>
        <View
          style={[
            s.scoreBarFill,
            {
              width: `${dim.score}%`,
              backgroundColor: gradeColor.bg,
            },
          ]}
        />
      </View>
      <View style={s.dimensionScoreBox}>
        <Text style={[s.dimensionScore, { color: gradeColor.bg }]}>
          {dim.score}
        </Text>
        <View
          style={[
            s.dimensionGrade,
            { backgroundColor: gradeColor.bg },
          ]}
        >
          <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: WHITE }}>
            {dim.grade}
          </Text>
        </View>
      </View>
    </View>
  )
}

function RecommendationCard({
  rec,
  index,
}: {
  rec: Recommendation
  index: number
}) {
  const color = DIMENSION_COLORS[index % DIMENSION_COLORS.length]

  return (
    <View style={s.recCard} wrap={false}>
      <View style={s.recHeader}>
        <View style={[s.recColorDot, { backgroundColor: color }]} />
        <Text style={s.recDimension}>{rec.dimensionLabel}</Text>
      </View>
      <View style={s.recBody}>
        <Text style={s.recProblem}>{sanitize(rec.problem)}</Text>
        <Text style={s.recSuggestion}>{sanitize(rec.suggestion)}</Text>
        <View style={s.recXtalBox}>
          <Text style={s.recXtalLabel}>XTAL ADVANTAGE</Text>
          <Text style={s.recXtalText}>{sanitize(rec.xtalAdvantage)}</Text>
        </View>
      </View>
    </View>
  )
}

// ─── Main Document ─────────────────────────────────────────

export function GraderPdfDocument({ report }: { report: GraderReport }) {
  const gradeColor = GRADE_COLORS[report.overallGrade] || GRADE_COLORS.F
  const gradeDesc = GRADE_DESCRIPTIONS[report.overallGrade] || "Unknown"
  const dateStr = new Date(report.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Document
      title={`${report.storeName} - Search Health Report`}
      author="XTAL Search"
      subject={`Search audit scoring ${report.overallScore}/100`}
    >
      {/* ── Page 1: Cover ──────────────────────────────────── */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverContainer}>
          {/* Brand header */}
          <View>
            <Text style={s.coverBrand}>XTAL SEARCH</Text>
            <Text style={s.coverTitle}>Site Search Health Report</Text>
          </View>

          {/* Score section */}
          <View style={s.coverScoreSection}>
            <Text style={s.coverScoreNumber}>{report.overallScore}</Text>
            <Text style={s.coverOutOf}>out of 100</Text>
            <View
              style={[
                s.coverGradeBadge,
                { backgroundColor: gradeColor.bg },
              ]}
            >
              <Text style={s.coverGradeText}>
                Grade {report.overallGrade} — {gradeDesc}
              </Text>
            </View>
          </View>

          {/* Store info */}
          <View>
            <Text style={s.coverStoreName}>{report.storeName}</Text>
            <Text style={s.coverStoreUrl}>{report.storeUrl}</Text>
            <Text style={s.coverMeta}>
              {report.platform.charAt(0).toUpperCase() + report.platform.slice(1)} · {report.vertical}
            </Text>
          </View>

          {/* Footer */}
          <View style={s.coverFooter}>
            <View>
              <Text style={s.coverFooterLeft}>Generated {dateStr}</Text>
              <Text style={s.coverFooterLeft}>xtalsearch.com/grade</Text>
            </View>
            <View>
              <Text style={s.coverFooterRight}>Confidential</Text>
              <Text style={s.coverFooterRight}>xtalsearch.com/try</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* ── Page 2: Executive Summary + Dimensions ─────── */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Executive Summary</Text>
        <View style={s.summaryBox}>
          <Text style={s.summaryText}>{sanitize(report.summary)}</Text>
        </View>

        {/* Score overview with ring */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
            padding: 16,
            backgroundColor: SLATE_50,
            borderRadius: 8,
          }}
        >
          <ScoreRing score={report.overallScore} grade={report.overallGrade} />
          <View style={{ marginLeft: 20, flex: 1 }}>
            <Text
              style={{
                fontSize: 28,
                fontFamily: "Helvetica-Bold",
                color: XTAL_NAVY,
              }}
            >
              {report.overallScore}/100
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: SLATE_500,
                marginTop: 4,
              }}
            >
              Overall Search Health Score
            </Text>
          </View>
          {report.revenueImpact.monthlyLostRevenue > 0 && (
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Helvetica-Bold",
                  color: "#dc2626",
                }}
              >
                ~${report.revenueImpact.monthlyLostRevenue.toLocaleString()}/mo
              </Text>
              <Text style={{ fontSize: 9, color: SLATE_500, marginTop: 2 }}>
                estimated lost revenue
              </Text>
              <Text style={{ fontSize: 8, color: SLATE_400, marginTop: 1 }}>
                (~${report.revenueImpact.annualLostRevenue.toLocaleString()}/yr)
              </Text>
            </View>
          )}
        </View>

        <Text style={s.sectionTitle}>Search Health Breakdown</Text>
        <Text style={s.sectionSubtitle}>
          8 dimensions scored 0-100 with weighted contribution to overall grade
        </Text>

        {report.dimensions.map((dim, i) => (
          <DimensionRow key={dim.key} dim={dim} index={i} />
        ))}

        <PageFooter />
      </Page>

      {/* ── Queries Tested ─────────────────────────────── */}
      {report.queriesTested && report.queriesTested.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionTitle}>Queries We Tested</Text>
          <Text style={s.sectionSubtitle}>
            We ran {report.queriesTested.length} search queries designed to reflect how real shoppers search for products at {report.storeName}. Each query tests a different aspect of the search experience.
          </Text>

          {report.queriesTested.map((q, i) => {
            const catLabels: Record<string, string> = {
              typo: "Typo Test",
              synonym: "Synonym Test",
              natural_language: "Natural Language",
              long_tail: "Specific Search",
              category: "Category Browse",
              null_test: "Out-of-Stock Test",
            }
            const catColors: Record<string, string> = {
              typo: "#ef4444",
              synonym: "#6366f1",
              natural_language: "#14b8a6",
              long_tail: "#f59e0b",
              category: "#3b82f6",
              null_test: "#94a3b8",
            }
            const label = catLabels[q.category] || q.category
            const color = catColors[q.category] || SLATE_400

            return (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  marginBottom: 4,
                  backgroundColor: i % 2 === 0 ? SLATE_50 : WHITE,
                  borderRadius: 4,
                }}
                wrap={false}
              >
                <View
                  style={{
                    width: 90,
                    flexShrink: 0,
                    marginRight: 10,
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      backgroundColor: color + "18",
                      borderRadius: 3,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 7,
                        fontFamily: "Helvetica-Bold",
                        color: color,
                        letterSpacing: 0.5,
                      }}
                    >
                      {label.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: "Helvetica-Bold",
                      color: SLATE_900,
                      marginBottom: 2,
                    }}
                  >
                    {`"${q.text}"`}
                  </Text>
                  <Text
                    style={{
                      fontSize: 8,
                      color: SLATE_500,
                      lineHeight: 1.4,
                    }}
                  >
                    {q.expectedBehavior}
                  </Text>
                </View>
              </View>
            )
          })}

          <PageFooter />
        </Page>
      )}

      {/* ── Detailed Findings + Revenue Impact ──────────── */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Detailed Findings</Text>
        <Text style={s.sectionSubtitle}>
          Observations from search testing across each dimension
        </Text>

        {report.dimensions
          .filter((d) => d.failures.length > 0)
          .map((dim, i) => (
            <View
              key={dim.key}
              style={{
                marginBottom: 14,
                padding: 12,
                backgroundColor: SLATE_50,
                borderRadius: 6,
                borderLeftWidth: 3,
                borderLeftColor:
                  DIMENSION_COLORS[
                    report.dimensions.indexOf(dim) % DIMENSION_COLORS.length
                  ],
              }}
              wrap={false}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "Helvetica-Bold",
                    color: SLATE_900,
                  }}
                >
                  {dim.label}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "Helvetica-Bold",
                    color: (GRADE_COLORS[dim.grade] || GRADE_COLORS.F).bg,
                  }}
                >
                  {dim.score}/100 ({dim.grade})
                </Text>
              </View>
              <View style={s.failureList}>
                {dim.failures.map((f, fi) => (
                  <View key={fi} style={s.failureItem}>
                    <View style={s.failureBullet} />
                    <Text style={s.failureText}>{sanitize(f)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

        <PageFooter />
      </Page>

      {/* ── Page 4: Recommendations ────────────────────── */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>Recommendations</Text>
        <Text style={s.sectionSubtitle}>
          How XTAL Search would fix each issue and improve your store{"'"}s search experience
        </Text>

        {report.recommendations.map((rec, i) => (
          <RecommendationCard key={i} rec={rec} index={i} />
        ))}

        <PageFooter />
      </Page>
    </Document>
  )
}
