const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const role = process.argv[3];

  if (!email || !role) {
    console.log('Usage: node set-role.js <email> <role>');
    console.log('Roles: RESIDENT, COMMUNITY_ADMIN, COMMITTEE_MEMBER, CONCIERGE, SUPER_ADMIN');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log(`User ${email} not found`);
    process.exit(1);
  }

  const member = await prisma.communityMember.findFirst({
    where: { userId: user.id }
  });

  if (!member) {
    console.log(`User ${email} not in any community`);
    process.exit(1);
  }

  await prisma.communityMember.update({
    where: { id: member.id },
    data: { role }
  });

  console.log(`✅ Updated ${email} to ${role}`);
  console.log('Refresh your browser to see changes');
}

main()
  .catch(e => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
