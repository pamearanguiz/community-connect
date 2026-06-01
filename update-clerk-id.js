const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'pamea23@gmail.com';
  const newClerkId = process.argv[2];

  if (!newClerkId) {
    console.log('Usage: node update-clerk-id.js <clerkId>');
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { clerkId: newClerkId }
  });

  console.log(`✅ Updated clerkId for ${email}`);
  console.log('Refresh your browser');
}

main()
  .catch(e => console.error(e.message))
  .finally(async () => await prisma.$disconnect());
