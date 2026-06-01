import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { requireTenant } from '@/lib/tenant'
import { TicketForm } from '@/components/tickets/TicketForm'

export default async function NewTicketPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  await requireTenant()

  return (
    <div className="max-w-2xl">
      <TicketForm />
    </div>
  )
}
