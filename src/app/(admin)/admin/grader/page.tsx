"use client"

import GraderRunsTable from "@/components/admin/grader/GraderRunsTable"
import BatchGraderForm from "@/components/admin/grader/BatchGraderForm"

export default function AdminGraderPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Grader</h1>

      <div className="space-y-8">
        <GraderRunsTable />
        <BatchGraderForm />
      </div>
    </div>
  )
}
