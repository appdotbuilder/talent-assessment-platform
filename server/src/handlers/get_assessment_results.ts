
import { db } from '../db';
import { candidateAssessmentsTable, usersTable } from '../db/schema';
import { type CandidateAssessment } from '../schema';
import { eq } from 'drizzle-orm';

export async function getAssessmentResults(assessmentId: number): Promise<CandidateAssessment[]> {
  try {
    const results = await db.select()
      .from(candidateAssessmentsTable)
      .innerJoin(usersTable, eq(candidateAssessmentsTable.candidate_id, usersTable.id))
      .where(eq(candidateAssessmentsTable.assessment_id, assessmentId))
      .execute();

    return results.map(result => {
      const candidateAssessment = result.candidate_assessments;
      return {
        ...candidateAssessment,
        score: candidateAssessment.score ? parseFloat(candidateAssessment.score) : null,
      };
    });
  } catch (error) {
    console.error('Failed to get assessment results:', error);
    throw error;
  }
}
