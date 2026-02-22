import type { GraderReport } from "@/lib/grader/types"

export default function PrintFooter({ report }: { report: GraderReport }) {
  const date = new Date(report.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="mt-12 pt-4 border-t border-slate-200 text-center">
      <p className="text-[10px] text-slate-400">
        Confidential — generated for {report.storeName} on {date}
      </p>
      <p className="text-[10px] text-slate-400">
        XTAL Search &middot; xtalsearch.com
      </p>
    </div>
  )
}
