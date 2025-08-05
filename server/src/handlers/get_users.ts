
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUsers(companyId?: number): Promise<User[]> {
  try {
    // Build query conditionally without reassigning
    const results = companyId !== undefined
      ? await db.select().from(usersTable).where(eq(usersTable.company_id, companyId)).execute()
      : await db.select().from(usersTable).execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}
