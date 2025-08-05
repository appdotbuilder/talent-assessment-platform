
import { db } from '../db';
import { candidateAssessmentsTable } from '../db/schema';
import { type CandidateAssessment } from '../schema';
import { eq } from 'drizzle-orm';

export const startAssessment = async (candidateAssessmentId: number): Promise<CandidateAssessment> => {
  try {
    // Update the candidate assessment status and set started_at timestamp
    const result = await db.update(candidateAssessmentsTable)
      .set({
        status: 'in_progress',
        started_at: new Date()
      })
      .where(eq(candidateAssessmentsTable.id, candidateAssessmentId))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Candidate assessment with id ${candidateAssessmentId} not found`);
    }

    const candidateAssessment = result[0];
    
    // Convert numeric fields back to numbers
    return {
      ...candidateAssessment,
      score: candidateAssessment.score ? parseFloat(candidateAssessment.score) : null,
    };
  } catch (error) {
    console.error('Start assessment failed:', error);
    throw error;
  }
};
