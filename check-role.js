const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'admin@default.com';

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      communities: {
        include: {
          community: {
            select: { name: true }
          }
        }
      }
    }
  });

  if (!user) {
    console.log(`❌ User ${email} not found`);
    process.exit(1);
  }

  console.log(`\n👤 User: ${user.name} (${user.email})`);
  console.log('\n📍 Communities:');
  
  if (user.communities.length === 0) {
    console.log('   No communities assigned');
  } else {
    user.communities.forEach(m => {
      console.log(`   - ${m.community.name}: ${m.role}`);
    });
  }
}

main()
  .catch(e => console.error(e.message))
  .finally(async () => await prisma.$disconnect());
