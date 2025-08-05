
import { db } from '../db';
import { assessmentQuestionsTable, assessmentsTable, questionsTable } from '../db/schema';
import { type AssessmentQuestion } from '../schema';
import { eq } from 'drizzle-orm';

export async function addQuestionToAssessment(
  assessmentId: number,
  questionId: number,
  orderIndex: number,
  points: number = 1
): Promise<AssessmentQuestion> {
  try {
    // Verify assessment exists
    const assessmentExists = await db.select({ id: assessmentsTable.id })
      .from(assessmentsTable)
      .where(eq(assessmentsTable.id, assessmentId))
      .execute();

    if (assessmentExists.length === 0) {
      throw new Error(`Assessment with id ${assessmentId} not found`);
    }

    // Verify question exists
    const questionExists = await db.select({ id: questionsTable.id })
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .execute();

    if (questionExists.length === 0) {
      throw new Error(`Question with id ${questionId} not found`);
    }

    // Insert assessment question record
    const result = await db.insert(assessmentQuestionsTable)
      .values({
        assessment_id: assessmentId,
        question_id: questionId,
        order_index: orderIndex,
        points: points
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Adding question to assessment failed:', error);
    throw error;
  }
}
