const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.community.findUnique({
    where: { slug: 'default' }
  });

  if (!existing) {
    console.log('Creating default community...');
    const community = await prisma.community.create({
      data: {
        slug: 'default',
        name: 'Comunidad Default',
        address: 'Calle Principal 123',
        city: 'Santiago',
        region: 'Metropolitana',
        adminEmail: 'admin@default.com',
        plan: 'FREE',
      }
    });
    console.log('✓ Created default community:', community.id);
  } else {
    console.log('✓ Default community already exists');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
