"use client"

import GraderPromptEditor from "@/components/admin/grader/GraderPromptEditor"

export default function AdminGraderPromptsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Grader Prompts</h1>
      <GraderPromptEditor />
    </div>
  )
}
