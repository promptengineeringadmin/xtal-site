"use client"

import { use } from "react"
import GraderRunDetail from "@/components/admin/grader/GraderRunDetail"

export default function AdminGraderRunPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Run Detail</h1>
      <GraderRunDetail id={id} />
    </div>
  )
}
