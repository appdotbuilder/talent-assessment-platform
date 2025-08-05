
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type Question } from '../schema';
import { eq } from 'drizzle-orm';

export async function getQuestions(companyId: number): Promise<Question[]> {
  try {
    const results = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.company_id, companyId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    throw error;
  }
}
