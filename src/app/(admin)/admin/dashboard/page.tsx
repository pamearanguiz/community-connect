import { requireTenant } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export default async function AdminDashboard() {
  const tenant = await requireTenant()

  const community = await prisma.community.findUnique({
    where: { slug: tenant.slug },
  })

  if (!community) {
    return <div>Comunidad no encontrada</div>
  }

  // Get real metrics
  const [activeTickets, totalResidents, totalUnits, occupiedUnits, announcements] =
    await Promise.all([
      prisma.ticket.count({
        where: {
          communityId: community.id,
          status: { not: 'CLOSED' },
        },
      }),
      prisma.unitResident.count({
        where: {
          unit: { communityId: community.id },
          isPrimary: true,
        },
      }),
      prisma.unit.count({
        where: { communityId: community.id },
      }),
      prisma.unit.count({
        where: { communityId: community.id, isOccupied: true },
      }),
      prisma.announcement.count({
        where: {
          communityId: community.id,
          isPublished: true,
        },
      }),
    ])

  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

  const metrics = [
    { label: 'Tickets activos', value: activeTickets.toString(), change: 'Sin cerrar' },
    { label: 'Residentes', value: totalResidents.toString(), change: 'Activos' },
    { label: 'Unidades ocupadas', value: `${occupancyRate}%`, change: `${occupiedUnits}/${totalUnits}` },
    { label: 'Comunicados', value: announcements.toString(), change: 'Publicados' },
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">{tenant.name}</p>
      </section>

      {/* Métricas */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-white rounded-lg border border-slate-200 p-6"
            >
              <p className="text-sm font-medium text-slate-600">{metric.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{metric.value}</p>
              <p className="text-xs text-slate-500 mt-2">{metric.change}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tickets recientes */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Tickets Recientes</h2>
        <p className="text-slate-600">Próximamente: lista de tickets en tiempo real</p>
      </section>

      {/* Actividad reciente */}
      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Actividad Reciente</h2>
        <p className="text-slate-600">Próximamente: feed de actividades</p>
      </section>
    </div>
  )
}
