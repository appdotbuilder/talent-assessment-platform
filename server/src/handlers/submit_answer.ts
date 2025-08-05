
import { db } from '../db';
import { candidateAnswersTable, questionsTable, assessmentQuestionsTable, candidateAssessmentsTable } from '../db/schema';
import { type SubmitAnswerInput, type CandidateAnswer } from '../schema';
import { eq, and } from 'drizzle-orm';

export const submitAnswer = async (input: SubmitAnswerInput): Promise<CandidateAnswer> => {
  try {
    // First, verify the candidate assessment exists and get the question details
    const questionResult = await db.select({
      question: questionsTable,
      assessmentQuestion: assessmentQuestionsTable
    })
    .from(questionsTable)
    .innerJoin(assessmentQuestionsTable, eq(questionsTable.id, assessmentQuestionsTable.question_id))
    .innerJoin(candidateAssessmentsTable, eq(assessmentQuestionsTable.assessment_id, candidateAssessmentsTable.assessment_id))
    .where(
      and(
        eq(questionsTable.id, input.question_id),
        eq(candidateAssessmentsTable.id, input.candidate_assessment_id)
      )
    )
    .execute();

    if (questionResult.length === 0) {
      throw new Error('Question not found or not part of the candidate assessment');
    }

    const { question, assessmentQuestion } = questionResult[0];

    // Calculate if answer is correct and points earned
    let isCorrect: boolean | null = null;
    let pointsEarned: number | null = null;

    if (question.correct_answer) {
      isCorrect = input.answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
      pointsEarned = isCorrect ? assessmentQuestion.points : 0;
    }

    // Insert the candidate answer
    const result = await db.insert(candidateAnswersTable)
      .values({
        candidate_assessment_id: input.candidate_assessment_id,
        question_id: input.question_id,
        answer: input.answer,
        is_correct: isCorrect,
        points_earned: pointsEarned?.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    const candidateAnswer = result[0];
    
    // Convert numeric fields back to numbers before returning
    return {
      ...candidateAnswer,
      points_earned: candidateAnswer.points_earned ? parseFloat(candidateAnswer.points_earned) : null
    };
  } catch (error) {
    console.error('Submit answer failed:', error);
    throw error;
  }
};
