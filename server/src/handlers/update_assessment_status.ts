
import { db } from '../db';
import { assessmentsTable } from '../db/schema';
import { type UpdateAssessmentStatusInput, type Assessment } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAssessmentStatus = async (input: UpdateAssessmentStatusInput): Promise<Assessment> => {
  try {
    // Update assessment status
    const result = await db.update(assessmentsTable)
      .set({ 
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(assessmentsTable.id, input.assessment_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Assessment with id ${input.assessment_id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Assessment status update failed:', error);
    throw error;
  }
};
