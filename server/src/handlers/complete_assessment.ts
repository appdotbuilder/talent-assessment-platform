
import { db } from '../db';
import { candidateAssessmentsTable, candidateAnswersTable } from '../db/schema';
import { type CandidateAssessment } from '../schema';
import { eq, sum } from 'drizzle-orm';

export async function completeAssessment(candidateAssessmentId: number): Promise<CandidateAssessment> {
  try {
    // First, get the current candidate assessment
    const existingAssessment = await db.select()
      .from(candidateAssessmentsTable)
      .where(eq(candidateAssessmentsTable.id, candidateAssessmentId))
      .execute();

    if (existingAssessment.length === 0) {
      throw new Error('Candidate assessment not found');
    }

    if (existingAssessment[0].status === 'completed') {
      throw new Error('Assessment already completed');
    }

    // Calculate total score from candidate answers
    const scoreResult = await db.select({
      totalScore: sum(candidateAnswersTable.points_earned)
    })
      .from(candidateAnswersTable)
      .where(eq(candidateAnswersTable.candidate_assessment_id, candidateAssessmentId))
      .execute();

    const totalScore = scoreResult[0]?.totalScore ? parseFloat(scoreResult[0].totalScore) : 0;

    // Update the candidate assessment
    const result = await db.update(candidateAssessmentsTable)
      .set({
        status: 'completed',
        completed_at: new Date(),
        score: totalScore.toString(), // Convert to string for numeric column
        total_points: existingAssessment[0].total_points // Keep existing total_points
      })
      .where(eq(candidateAssessmentsTable.id, candidateAssessmentId))
      .returning()
      .execute();

    // Convert numeric fields back to numbers
    const updatedAssessment = result[0];
    return {
      ...updatedAssessment,
      score: updatedAssessment.score ? parseFloat(updatedAssessment.score) : null
    };
  } catch (error) {
    console.error('Assessment completion failed:', error);
    throw error;
  }
}
