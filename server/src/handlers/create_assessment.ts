
import { db } from '../db';
import { assessmentsTable } from '../db/schema';
import { type CreateAssessmentInput, type Assessment } from '../schema';

export const createAssessment = async (input: CreateAssessmentInput): Promise<Assessment> => {
  try {
    // Insert assessment record
    const result = await db.insert(assessmentsTable)
      .values({
        title: input.title,
        description: input.description || null,
        company_id: input.company_id,
        created_by: input.created_by,
        time_limit_minutes: input.time_limit_minutes || null
        // status defaults to 'draft' as defined in schema
      })
      .returning()
      .execute();

    const assessment = result[0];
    return assessment;
  } catch (error) {
    console.error('Assessment creation failed:', error);
    throw error;
  }
};
