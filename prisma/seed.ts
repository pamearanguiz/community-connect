import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ========================================================================
  // 1. Create Community
  // ========================================================================
  const community = await prisma.community.create({
    data: {
      slug: "condominio-demo",
      name: "Condominio Demo",
      address: "Av. Providencia 1234",
      city: "Santiago",
      region: "Metropolitana",
      adminEmail: "admin@condominio-demo.cl",
      whatsappNumber: "+56912345678",
      logoUrl: "https://via.placeholder.com/200",
      primaryColor: "#2563EB",
      plan: "STARTER",
      isActive: true,
    },
  });

  console.log("✅ Community created:", community.id);

  // ========================================================================
  // 2. Create Units (10 units across 2 towers)
  // ========================================================================
  const units = await Promise.all([
    // Torre A - 5 unidades
    prisma.unit.create({
      data: {
        communityId: community.id,
        number: "1204",
        floor: 12,
        tower: "A",
        type: "APARTMENT",
        isOccupied: true,
      },
    }),
    prisma.unit.create({
      data: {
        communityId: community.id,
        number: "1205",
        floor: 12,
        tower: "A",
        type: "APARTMENT",
        isOccupied: true,
      },
    }),
    prisma.unit.create({
      data: {
        communityId: community.id,
        number: "1001",
        floor: 10,
        tower: "A",
        type: "APARTMENT",
        isOccupied: true,
      },
    }),
    prisma.unit.create({
      data: {
        communityId: community.id,
        number: "101",
        floor: 1,
        tower: "A",
        type: "APARTMENT",
        isOccupied: false,
      },
    }),
    prisma.unit.create({
      data: {
        communityId: community.id,
        number: "G-01",
        floor: 0,
        tower: "A",
        type: "PARKING",
        isOccupied: true,
      },
    }),
    // Torre B - 5 unidades
    prisma.unit.create({
      data: {
        communityId: community.id,
        number: "2301",
        floor: 23,
        tower: "B",
        type: "APARTMENT",
        isOccupied: true,
      },
    }),
    prisma.unit.create({
      data: {
        communityId: community.id,
        number: "2302",
        floor: 23,
        tower: "B",
        type: "APARTMENT",
        isOccupied: true,
      },
    }),
    prisma.unit.create({
      data: {
        communityId: community.id,
        number: "1501",
        floor: 15,
        tower: "B",
        type: "APARTMENT",
        isOccupied: true,
      },
    }),
    prisma.unit.create({
      data: {
        communityId: community.id,
        number: "201",
        floor: 2,
        tower: "B",
        type: "APARTMENT",
        isOccupied: false,
      },
    }),
    prisma.unit.create({
      data: {
        communityId: community.id,
        number: "G-02",
        floor: 0,
        tower: "B",
        type: "STORAGE",
        isOccupied: true,
      },
    }),
  ]);

  console.log("✅ 10 Units created");

  // ========================================================================
  // 3. Create Users (Admin, Resident, Concierge)
  // ========================================================================
  const adminUser = await prisma.user.create({
    data: {
      clerkId: "user_admin_demo_12345",
      email: "admin@condominio-demo.cl",
      name: "Administrador Demo",
      phone: "+56912345678",
      isActive: true,
    },
  });

  const residentUser = await prisma.user.create({
    data: {
      clerkId: "user_resident_demo_12345",
      email: "residente@example.cl",
      name: "Juan Pérez García",
      phone: "+56987654321",
      isActive: true,
    },
  });

  const conciergeUser = await prisma.user.create({
    data: {
      clerkId: "user_concierge_demo_12345",
      email: "conserje@condominio-demo.cl",
      name: "Carlos López Rodríguez",
      phone: "+56911223344",
      isActive: true,
    },
  });

  console.log("✅ 3 Users created");

  // ========================================================================
  // 4. Associate Users with Community (CommunityMember)
  // ========================================================================
  await Promise.all([
    prisma.communityMember.create({
      data: {
        userId: adminUser.id,
        communityId: community.id,
        role: "COMMUNITY_ADMIN",
        isActive: true,
      },
    }),
    prisma.communityMember.create({
      data: {
        userId: residentUser.id,
        communityId: community.id,
        role: "RESIDENT",
        isActive: true,
      },
    }),
    prisma.communityMember.create({
      data: {
        userId: conciergeUser.id,
        communityId: community.id,
        role: "CONCIERGE",
        isActive: true,
      },
    }),
  ]);

  console.log("✅ Users associated with community");

  // ========================================================================
  // 5. Assign Residents to Units
  // ========================================================================
  await Promise.all([
    prisma.unitResident.create({
      data: {
        userId: residentUser.id,
        unitId: units[0].id, // 1204 Torre A
        relationshipType: "OWNER",
        isPrimary: true,
        moveInDate: new Date("2023-01-15"),
      },
    }),
    prisma.unitResident.create({
      data: {
        userId: adminUser.id,
        unitId: units[1].id, // 1205 Torre A
        relationshipType: "OWNER",
        isPrimary: true,
        moveInDate: new Date("2022-06-01"),
      },
    }),
  ]);

  console.log("✅ Residents assigned to units");

  // ========================================================================
  // 6. Create Sample Tickets
  // ========================================================================
  const ticket1 = await prisma.ticket.create({
    data: {
      communityId: community.id,
      ticketNumber: "TK-2024-0001",
      title: "Fuga de agua en baño",
      description:
        "Hay una fuga de agua en la cañería del baño de la unidad 1204. Se necesita reparación urgente.",
      category: "WATER_LEAK",
      priority: "HIGH",
      status: "IN_PROGRESS",
      source: "WHATSAPP",
      unitId: units[0].id, // Unidad 1204
      createdByUserId: residentUser.id,
      assignedToUserId: conciergeUser.id,
      aiClassified: false,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      communityId: community.id,
      ticketNumber: "TK-2024-0002",
      title: "Ruido en horas nocturnas",
      description:
        "Ruido excesivo proveniente de la unidad 2301 en horarios después de las 23:00 horas.",
      category: "NOISE",
      priority: "MEDIUM",
      status: "NEW",
      source: "WEB",
      unitId: units[5].id, // Unidad 2301 Torre B
      createdByUserId: residentUser.id,
      aiClassified: false,
    },
  });

  console.log("✅ 2 Sample tickets created");

  // ========================================================================
  // 7. Add Messages to Tickets
  // ========================================================================
  await Promise.all([
    prisma.ticketMessage.create({
      data: {
        ticketId: ticket1.id,
        senderId: residentUser.id,
        senderType: "RESIDENT",
        content:
          "El problema comenzó esta mañana alrededor de las 8:00 AM. El agua cae constantemente.",
        isInternal: false,
        attachments: [],
      },
    }),
    prisma.ticketMessage.create({
      data: {
        ticketId: ticket1.id,
        senderId: conciergeUser.id,
        senderType: "ADMIN",
        content:
          "He revisado el área. Necesitamos llamar al plomero. Será reparado mañana a las 9:00 AM.",
        isInternal: false,
        attachments: [],
      },
    }),
    prisma.ticketMessage.create({
      data: {
        ticketId: ticket2.id,
        senderId: null,
        senderType: "SYSTEM",
        content: "Ticket creado automáticamente desde el formulario web.",
        isInternal: true,
        attachments: [],
      },
    }),
  ]);

  console.log("✅ Ticket messages created");

  // ========================================================================
  // 8. Create Sample Announcement
  // ========================================================================
  await prisma.announcement.create({
    data: {
      communityId: community.id,
      title: "Mantenimiento de áreas comunes",
      content: {
        blocks: [
          {
            type: "paragraph",
            text: "Se realizará mantenimiento de las áreas comunes este fin de semana.",
          },
        ],
      },
      type: "MAINTENANCE",
      isPinned: true,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      targetAudience: "ALL",
      createdByUserId: adminUser.id,
      attachments: [],
    },
  });

  console.log("✅ Sample announcement created");

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
