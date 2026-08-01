import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { WingspanHomepage } from '@/components/screens/WingspanHomepage'

export default async function RootPage() {
  const session = await getSession()
  if (session) redirect('/paths')
  return <WingspanHomepage />
}
