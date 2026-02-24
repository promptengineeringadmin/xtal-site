import { StructuredData } from '@/components/StructuredData'
import { DemoModalProvider } from '@/contexts/DemoModalContext'
import DemoModal from '@/components/DemoModal'
import ExitIntent from '@/components/ExitIntent'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DemoModalProvider>
      <StructuredData />
      <Navbar />
      {children}
      <Footer />
      <DemoModal />
      <ExitIntent />
    </DemoModalProvider>
  )
}
