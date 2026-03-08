import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create initial admin user
  const existing = await prisma.user.findUnique({ where: { email: 'admin@chess.school' } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('admin123!', 12);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@chess.school',
        passwordHash,
        displayName: 'Admin',
        role: 'ADMIN',
      },
    });
    console.log('Created admin user:', admin.email);
    console.log('Password: admin123!  ← Change this immediately!');
  } else {
    console.log('Admin user already exists');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
