
import { db } from '../db';
import { candidateAssessmentsTable } from '../db/schema';
import { type CandidateAssessment } from '../schema';
import { eq } from 'drizzle-orm';

export async function getCandidateResult(candidateAssessmentId: number): Promise<CandidateAssessment | null> {
  try {
    const results = await db.select()
      .from(candidateAssessmentsTable)
      .where(eq(candidateAssessmentsTable.id, candidateAssessmentId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const candidateAssessment = results[0];
    
    // Convert numeric fields back to numbers
    return {
      ...candidateAssessment,
      score: candidateAssessment.score ? parseFloat(candidateAssessment.score) : null
    };
  } catch (error) {
    console.error('Failed to get candidate result:', error);
    throw error;
  }
}
