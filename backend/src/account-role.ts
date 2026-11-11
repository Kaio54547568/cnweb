import 'dotenv/config';
import { AccountRole, PrismaClient } from '@prisma/client';

async function main(): Promise<void> {
  const [id, role] = process.argv.slice(2);
  if (!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(id ?? '') ||
      (role !== AccountRole.EDITOR && role !== AccountRole.LEARNER)) {
    throw new Error('Usage: npm run account:role -- <account-id> <EDITOR|LEARNER>');
  }

  const db = new PrismaClient();
  try {
    const updated = await db.account.updateMany({
      where: { id, disabledAt: null }, data: { role },
    });
    if (!updated.count) throw new Error('Active account not found');
    console.log('Updated account role:', id, role);
  } finally {
    await db.$disconnect();
  }
}

void main().catch((error: Error) => {
  console.error(error.message.startsWith('Usage:') || error.message === 'Active account not found'
    ? error.message : 'Unable to update account role');
  process.exitCode = 1;
});
