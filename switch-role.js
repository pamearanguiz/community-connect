const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
const prisma = new PrismaClient();

const roles = ['RESIDENT', 'COMMUNITY_ADMIN', 'COMMITTEE_MEMBER', 'CONCIERGE', 'SUPER_ADMIN'];

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise(resolve => rl.question(query, resolve));

  try {
    // Listar usuarios
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });

    if (users.length === 0) {
      console.log('No users found');
      process.exit(1);
    }

    console.log('\n📧 Available users:');
    users.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.email} (${u.name})`);
    });

    const userIdx = await question('\nSelect user (number): ');
    const user = users[parseInt(userIdx) - 1];

    if (!user) {
      console.log('Invalid user');
      process.exit(1);
    }

    // Mostrar rol actual
    const member = await prisma.communityMember.findFirst({
      where: { userId: user.id }
    });

    console.log(`\nCurrent role: ${member?.role || 'NONE'}`);

    console.log('\n🔑 Available roles:');
    roles.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r}`);
    });

    const roleIdx = await question('\nSelect new role (number): ');
    const newRole = roles[parseInt(roleIdx) - 1];

    if (!newRole) {
      console.log('Invalid role');
      process.exit(1);
    }

    // Actualizar rol
    if (member) {
      await prisma.communityMember.update({
        where: { id: member.id },
        data: { role: newRole }
      });
    }

    console.log(`\n✅ ${user.email} switched to ${newRole}`);
    console.log('\nRefresh your browser to see changes');
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
