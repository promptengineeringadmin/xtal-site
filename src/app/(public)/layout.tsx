import { StructuredData } from '@/components/StructuredData'
import { DemoModalProvider } from '@/contexts/DemoModalContext'
import DemoModal from '@/components/DemoModal'
import ExitIntent from '@/components/ExitIntent'
import Footer from '@/components/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DemoModalProvider>
      <StructuredData />
      {children}
      <Footer />
      <DemoModal />
      <ExitIntent />
    </DemoModalProvider>
  )
}
