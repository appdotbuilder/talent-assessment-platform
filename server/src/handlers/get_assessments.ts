
import { db } from '../db';
import { assessmentsTable } from '../db/schema';
import { type Assessment } from '../schema';
import { eq } from 'drizzle-orm';

export async function getAssessments(companyId: number): Promise<Assessment[]> {
  try {
    const results = await db.select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.company_id, companyId))
      .execute();

    return results;
  } catch (error) {
    console.error('Get assessments failed:', error);
    throw error;
  }
}
