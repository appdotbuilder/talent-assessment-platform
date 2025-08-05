
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, companiesTable, usersTable } from '../db/schema';
import { type CreateQuestionInput } from '../schema';
import { createQuestion } from '../handlers/create_question';
import { eq } from 'drizzle-orm';

describe('createQuestion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let companyId: number;
  let userId: number;

  beforeEach(async () => {
    // Create company first
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        domain: 'test.com'
      })
      .returning()
      .execute();
    companyId = companyResult[0].id;

    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: companyId
      })
      .returning()
      .execute();
    userId = userResult[0].id;
  });

  it('should create a multiple choice question', async () => {
    const testInput: CreateQuestionInput = {
      title: 'What is JavaScript?',
      description: 'Choose the best description of JavaScript',
      question_type: 'multiple_choice',
      options: JSON.stringify(['A programming language', 'A markup language', 'A database', 'An operating system']),
      correct_answer: 'A programming language',
      company_id: companyId,
      created_by: userId
    };

    const result = await createQuestion(testInput);

    expect(result.title).toEqual('What is JavaScript?');
    expect(result.description).toEqual(testInput.description);
    expect(result.question_type).toEqual('multiple_choice');
    expect(result.options).toEqual(JSON.stringify(['A programming language', 'A markup language', 'A database', 'An operating system']));
    expect(result.correct_answer).toEqual('A programming language');
    expect(result.company_id).toEqual(companyId);
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a coding challenge question', async () => {
    const testInput: CreateQuestionInput = {
      title: 'Implement FizzBuzz',
      description: 'Write a function that prints numbers 1-100, replacing multiples of 3 with "Fizz", multiples of 5 with "Buzz", and multiples of both with "FizzBuzz"',
      question_type: 'coding_challenge',
      company_id: companyId,
      created_by: userId
    };

    const result = await createQuestion(testInput);

    expect(result.title).toEqual('Implement FizzBuzz');
    expect(result.description).toEqual(testInput.description);
    expect(result.question_type).toEqual('coding_challenge');
    expect(result.options).toBeNull();
    expect(result.correct_answer).toBeNull();
    expect(result.company_id).toEqual(companyId);
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
  });

  it('should create a free text question', async () => {
    const testInput: CreateQuestionInput = {
      title: 'Describe your experience',
      description: 'Tell us about your experience with React and Node.js',
      question_type: 'free_text',
      company_id: companyId,
      created_by: userId
    };

    const result = await createQuestion(testInput);

    expect(result.title).toEqual('Describe your experience');
    expect(result.question_type).toEqual('free_text');
    expect(result.options).toBeNull();
    expect(result.correct_answer).toBeNull();
  });

  it('should save question to database', async () => {
    const testInput: CreateQuestionInput = {
      title: 'Test Question',
      description: 'A question for testing',
      question_type: 'multiple_choice',
      options: JSON.stringify(['Option A', 'Option B']),
      correct_answer: 'Option A',
      company_id: companyId,
      created_by: userId
    };

    const result = await createQuestion(testInput);

    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, result.id))
      .execute();

    expect(questions).toHaveLength(1);
    expect(questions[0].title).toEqual('Test Question');
    expect(questions[0].description).toEqual(testInput.description);
    expect(questions[0].question_type).toEqual('multiple_choice');
    expect(questions[0].options).toEqual(JSON.stringify(['Option A', 'Option B']));
    expect(questions[0].correct_answer).toEqual('Option A');
    expect(questions[0].company_id).toEqual(companyId);
    expect(questions[0].created_by).toEqual(userId);
    expect(questions[0].created_at).toBeInstanceOf(Date);
    expect(questions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle optional fields correctly', async () => {
    const testInput: CreateQuestionInput = {
      title: 'Simple Question',
      description: 'A question without options or correct answer',
      question_type: 'free_text',
      company_id: companyId,
      created_by: userId
    };

    const result = await createQuestion(testInput);

    expect(result.options).toBeNull();
    expect(result.correct_answer).toBeNull();
  });
});
