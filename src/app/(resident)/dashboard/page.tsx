import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { requireTenant } from '@/lib/tenant'
import { getCurrentUser } from '@/lib/clerk'
import { prisma } from '@/lib/prisma'
import { ConciergeOnDutyWidget } from '@/components/resident/ConciergeOnDutyWidget'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
import { CATEGORY_EMOJIS } from '@/lib/adminTaskMappings'
import Link from 'next/link'
import { formatDistance } from 'date-fns'
import { es } from 'date-fns/locale'

const getTaskEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    MAINTENANCE: '🔧',
    NOISE: '🔊',
    WATER_LEAK: '💧',
    PARKING: '🅿️',
    PACKAGE: '📦',
    COMMON_EXPENSES: '💰',
    SECURITY: '🔒',
    ADMINISTRATIVE: '📋',
    OTHER: '📝',
  }
  return emojiMap[category] || '📋'
}

export default async function ResidentDashboard() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const user = await getCurrentUser()
  if (!user) {
    redirect('/sign-in')
  }

  const tenant = await requireTenant()

  // Get user's primary unit
  const unitResident = await prisma.unitResident.findFirst({
    where: {
      userId: user.id,
      isPrimary: true,
    },
    include: {
      unit: true,
    },
  })

  // Get announcements from the community
  const community = await prisma.community.findUnique({
    where: { slug: tenant.slug },
  })

  interface InProgressTask {
    id: string
    title: string
    category: any
    updatedAt: Date
    assignedTo: { name: string } | null
  }

  let announcements: any[] = []
  let lastTicket: any = null
  let inProgressTasks: InProgressTask[] = []

  if (community) {
    announcements = await prisma.announcement.findMany({
      where: {
        communityId: community.id,
        isPublished: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
    })

    // Get user's last ticket
    lastTicket = await prisma.ticket.findFirst({
      where: {
        communityId: community.id,
        createdByUserId: user.id,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    })

    // Get in-progress admin tasks (trabajos en curso)
    inProgressTasks = await prisma.ticket.findMany({
      where: {
        communityId: community.id,
        status: 'IN_PROGRESS',
        source: 'MANUAL',
      },
      select: {
        id: true,
        title: true,
        category: true,
        updatedAt: true,
        assignedTo: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    })
  }

  // Saludo según la hora
  const hora = new Date().getHours()
  const saludo =
    hora < 12
      ? 'Buenos días'
      : hora < 19
        ? 'Buenas tardes'
        : 'Buenas noches'

  return (
    <div className="space-y-6">
      {/* Conserje de turno */}
      <ConciergeOnDutyWidget />

      {/* Saludo personalizado */}
      <section>
        <h1 className="text-2xl font-bold text-slate-900">
          {saludo}, {user.name}
        </h1>
        <p className="text-slate-500 mt-1">
          {unitResident?.unit ? (
            <>
              Unidad {unitResident.unit.number}{' '}
              {unitResident.unit.tower && `Torre ${unitResident.unit.tower}`} — {tenant.name}
            </>
          ) : (
            tenant.name
          )}
        </p>
      </section>

      {/* Acceso rápido */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Acceso rápido
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/tickets/new', label: 'Nuevo ticket', icon: '🎫' },
            { href: '/announcements', label: 'Comunicados', icon: '📢' },
            { href: '/documents', label: 'Documentos', icon: '📄' },
            { href: '/my-unit', label: 'Mi unidad', icon: '🏠' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:border-[var(--community-primary)] hover:shadow-sm transition-all"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium text-slate-700 text-center">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Comunicados recientes */}
      {announcements.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Comunicados recientes
            </h2>
            <Link href="/announcements" className="text-xs text-blue-600 hover:text-blue-700">
              Ver todos
            </Link>
          </div>
          <div className="space-y-2">
            {announcements.map((ann) => (
              <Link
                key={ann.id}
                href="/announcements"
                className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{ann.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDistance(new Date(ann.createdAt), new Date(), {
                      locale: es,
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trabajos en curso */}
      {inProgressTasks.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Trabajos en curso
          </h2>
          <div className="space-y-2">
            {inProgressTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200"
              >
                <span className="text-xl flex-shrink-0">
                  {getTaskEmoji(task.category)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{task.title}</p>
                  {task.assignedTo && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Responsable: {task.assignedTo.name}
                    </p>
                  )}
                </div>
                <TicketStatusBadge status="IN_PROGRESS" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Último ticket */}
      {lastTicket && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Tu último ticket
            </h2>
            <Link href="/tickets" className="text-xs text-blue-600 hover:text-blue-700">
              Ver todos
            </Link>
          </div>
          <Link
            href={`/tickets/${lastTicket.id}`}
            className="flex items-start justify-between p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"
          >
            <div className="flex-1">
              <p className="font-medium text-slate-800">{lastTicket.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {lastTicket.ticketNumber} •{' '}
                {formatDistance(new Date(lastTicket.updatedAt), new Date(), {
                  locale: es,
                  addSuffix: true,
                })}
              </p>
            </div>
            <div className="flex-shrink-0">
              <TicketStatusBadge status={lastTicket.status} />
            </div>
          </Link>
        </section>
      )}
    </div>
  )
}
