
import { type AssessmentQuestion } from '../schema';

export async function addQuestionToAssessment(
  assessmentId: number,
  questionId: number,
  orderIndex: number,
  points: number = 1
): Promise<AssessmentQuestion> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to add a question to an assessment with specific order and points
  // Used by company recruiters when building assessments
  return Promise.resolve({
    id: 0,
    assessment_id: assessmentId,
    question_id: questionId,
    order_index: orderIndex,
    points: points
  } as AssessmentQuestion);
}
