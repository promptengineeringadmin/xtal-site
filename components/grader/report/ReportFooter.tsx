interface ReportFooterProps {
  storeName: string
  createdAt: string
}

export default function ReportFooter({ storeName, createdAt }: ReportFooterProps) {
  return (
    <footer className="border-t border-slate-200 pt-8 text-center">
      <p className="text-xs uppercase tracking-widest text-slate-400">
        © 2026 XTAL Search
      </p>
      <p className="text-[10px] text-slate-300">
        Confidential Audit generated for {storeName}
      </p>
    </footer>
  )
}
