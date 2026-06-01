const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();

  if (!user) {
    console.log('No users found');
    process.exit(1);
  }

  const community = await prisma.community.findUnique({
    where: { slug: 'default' }
  });

  if (!community) {
    console.log('Community not found');
    process.exit(1);
  }

  const updated = await prisma.communityMember.update({
    where: {
      userId_communityId: {
        userId: user.id,
        communityId: community.id
      }
    },
    data: {
      role: 'COMMUNITY_ADMIN'
    }
  });

  console.log(`✓ Updated ${user.email} to COMMUNITY_ADMIN`);
  console.log('\nNow you can access:');
  console.log('  - /admin/dashboard (admin dashboard)');
  console.log('  - /admin/tickets (admin tickets)');
  console.log('  - /admin/announcements');
  console.log('  - /admin/documents');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
