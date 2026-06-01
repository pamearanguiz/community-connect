const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      communities: {
        include: { community: { select: { name: true } } }
      }
    }
  });

  console.log('\n📋 All Users:\n');
  users.forEach(u => {
    console.log(`Email: ${u.email}`);
    console.log(`Name: ${u.name}`);
    console.log(`Clerk ID: ${u.clerkId}`);
    console.log(`Communities: ${u.communities.map(m => `${m.community.name} (${m.role})`).join(', ') || 'None'}`);
    console.log('---');
  });
}

main()
  .catch(e => console.error(e.message))
  .finally(async () => await prisma.$disconnect());
