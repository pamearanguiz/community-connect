const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const community = await prisma.community.findUnique({
    where: { slug: 'default' }
  });

  if (!community) {
    console.log('Community not found');
    process.exit(1);
  }

  // Crear un usuario admin para testing
  const user = await prisma.user.create({
    data: {
      clerkId: 'clerk_test_admin_001',
      email: 'admin@default.com',
      name: 'Admin User',
      phone: '+56912345678',
    }
  });

  // Crear membresía como COMMUNITY_ADMIN
  await prisma.communityMember.create({
    data: {
      userId: user.id,
      communityId: community.id,
      role: 'COMMUNITY_ADMIN'
    }
  });

  console.log('✓ Created admin user:');
  console.log(`  Email: ${user.email}`);
  console.log(`  Role: COMMUNITY_ADMIN`);
  console.log('');
  console.log('Now you can access:');
  console.log('  - http://localhost:3000/admin/dashboard');
  console.log('  - http://localhost:3000/admin/tickets');
  console.log('  - http://localhost:3000/admin/announcements');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
