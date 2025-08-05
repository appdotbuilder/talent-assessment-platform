
import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type CreateQuestionInput, type Question } from '../schema';

export const createQuestion = async (input: CreateQuestionInput): Promise<Question> => {
  try {
    // Insert question record
    const result = await db.insert(questionsTable)
      .values({
        title: input.title,
        description: input.description,
        question_type: input.question_type,
        options: input.options ?? null,
        correct_answer: input.correct_answer ?? null,
        company_id: input.company_id,
        created_by: input.created_by
      })
      .returning()
      .execute();

    const question = result[0];
    return question;
  } catch (error) {
    console.error('Question creation failed:', error);
    throw error;
  }
};
