const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'pamea23@gmail.com';

  // Obtener la comunidad default
  const community = await prisma.community.findUnique({
    where: { slug: 'default' }
  });

  if (!community) {
    console.log('Community not found');
    process.exit(1);
  }

  // Crear o actualizar usuario
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: 'github_pamea23',
        email,
        name: 'Pamela Aranguiz',
        phone: '',
      }
    });
    console.log(`✅ Created user: ${email}`);
  } else {
    console.log(`✅ User already exists: ${email}`);
  }

  // Crear o actualizar membresía como COMMUNITY_ADMIN
  const existing = await prisma.communityMember.findFirst({
    where: { userId: user.id, communityId: community.id }
  });

  if (existing) {
    await prisma.communityMember.update({
      where: { id: existing.id },
      data: { role: 'COMMUNITY_ADMIN' }
    });
    console.log(`✅ Updated role to COMMUNITY_ADMIN`);
  } else {
    await prisma.communityMember.create({
      data: {
        userId: user.id,
        communityId: community.id,
        role: 'COMMUNITY_ADMIN'
      }
    });
    console.log(`✅ Added to Comunidad Default as COMMUNITY_ADMIN`);
  }

  console.log('\n✨ Ready to access: http://localhost:3000/admin/dashboard');
  console.log('⚠️  Refresh your browser to see changes');
}

main()
  .catch(e => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
