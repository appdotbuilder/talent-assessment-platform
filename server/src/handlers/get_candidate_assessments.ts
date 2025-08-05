
import { db } from '../db';
import { candidateAssessmentsTable } from '../db/schema';
import { type CandidateAssessment } from '../schema';
import { eq } from 'drizzle-orm';

export async function getCandidateAssessments(candidateId: number): Promise<CandidateAssessment[]> {
  try {
    const results = await db.select()
      .from(candidateAssessmentsTable)
      .where(eq(candidateAssessmentsTable.candidate_id, candidateId))
      .execute();

    // Convert numeric fields back to numbers for proper typing
    return results.map(candidateAssessment => ({
      ...candidateAssessment,
      score: candidateAssessment.score ? parseFloat(candidateAssessment.score) : null
    }));
  } catch (error) {
    console.error('Failed to get candidate assessments:', error);
    throw error;
  }
}
