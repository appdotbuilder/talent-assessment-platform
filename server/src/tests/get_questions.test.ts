
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, questionsTable } from '../db/schema';
import { type CreateCompanyInput, type CreateUserInput, type CreateQuestionInput } from '../schema';
import { getQuestions } from '../handlers/get_questions';

// Test data
const testCompany: CreateCompanyInput = {
  name: 'Test Company',
  domain: 'test.com'
};

const testUser: CreateUserInput = {
  email: 'recruiter@test.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Recruiter',
  user_type: 'company_recruiter'
};

const testQuestion1: CreateQuestionInput = {
  title: 'JavaScript Basics',
  description: 'What is a closure in JavaScript?',
  question_type: 'free_text',
  company_id: 1,
  created_by: 1
};

const testQuestion2: CreateQuestionInput = {
  title: 'Algorithm Challenge',
  description: 'Implement a binary search function',
  question_type: 'coding_challenge',
  company_id: 1,
  created_by: 1
};

describe('getQuestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no questions exist for company', async () => {
    // Create company but no questions
    await db.insert(companiesTable)
      .values({ name: testCompany.name, domain: testCompany.domain })
      .execute();

    const result = await getQuestions(1);

    expect(result).toEqual([]);
  });

  it('should return all questions for a specific company', async () => {
    // Create company
    await db.insert(companiesTable)
      .values({ name: testCompany.name, domain: testCompany.domain })
      .execute();

    // Create user
    await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password',
        company_id: 1
      })
      .execute();

    // Create questions
    await db.insert(questionsTable)
      .values([testQuestion1, testQuestion2])
      .execute();

    const result = await getQuestions(1);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('JavaScript Basics');
    expect(result[0].description).toEqual('What is a closure in JavaScript?');
    expect(result[0].question_type).toEqual('free_text');
    expect(result[0].company_id).toEqual(1);
    expect(result[0].created_by).toEqual(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('Algorithm Challenge');
    expect(result[1].description).toEqual('Implement a binary search function');
    expect(result[1].question_type).toEqual('coding_challenge');
    expect(result[1].company_id).toEqual(1);
    expect(result[1].created_by).toEqual(1);
  });

  it('should only return questions for the specified company', async () => {
    // Create two companies
    await db.insert(companiesTable)
      .values([
        { name: 'Company A', domain: 'a.com' },
        { name: 'Company B', domain: 'b.com' }
      ])
      .execute();

    // Create users for both companies
    await db.insert(usersTable)
      .values([
        {
          ...testUser,
          password_hash: 'hashed_password',
          company_id: 1
        },
        {
          email: 'recruiter@b.com',
          password_hash: 'hashed_password',
          first_name: 'Jane',
          last_name: 'Recruiter',
          user_type: 'company_recruiter',
          company_id: 2
        }
      ])
      .execute();

    // Create questions for both companies
    await db.insert(questionsTable)
      .values([
        { ...testQuestion1, company_id: 1, created_by: 1 },
        { ...testQuestion2, company_id: 1, created_by: 1 },
        {
          title: 'Company B Question',
          description: 'A question for company B',
          question_type: 'multiple_choice',
          company_id: 2,
          created_by: 2
        }
      ])
      .execute();

    const company1Questions = await getQuestions(1);
    const company2Questions = await getQuestions(2);

    expect(company1Questions).toHaveLength(2);
    expect(company2Questions).toHaveLength(1);

    // Verify company 1 questions
    company1Questions.forEach(question => {
      expect(question.company_id).toEqual(1);
    });

    // Verify company 2 questions
    company2Questions.forEach(question => {
      expect(question.company_id).toEqual(2);
    });

    expect(company2Questions[0].title).toEqual('Company B Question');
  });

  it('should return questions with all required fields', async () => {
    // Create prerequisites
    await db.insert(companiesTable)
      .values({ name: testCompany.name, domain: testCompany.domain })
      .execute();

    await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password',
        company_id: 1
      })
      .execute();

    // Create question with optional fields
    await db.insert(questionsTable)
      .values({
        title: 'Multiple Choice Question',
        description: 'Select the correct answer',
        question_type: 'multiple_choice',
        options: JSON.stringify(['A', 'B', 'C', 'D']),
        correct_answer: 'A',
        company_id: 1,
        created_by: 1
      })
      .execute();

    const result = await getQuestions(1);

    expect(result).toHaveLength(1);
    const question = result[0];

    // Verify all required fields are present
    expect(question.id).toBeDefined();
    expect(question.title).toEqual('Multiple Choice Question');
    expect(question.description).toEqual('Select the correct answer');
    expect(question.question_type).toEqual('multiple_choice');
    expect(question.options).toEqual(JSON.stringify(['A', 'B', 'C', 'D']));
    expect(question.correct_answer).toEqual('A');
    expect(question.company_id).toEqual(1);
    expect(question.created_by).toEqual(1);
    expect(question.created_at).toBeInstanceOf(Date);
    expect(question.updated_at).toBeInstanceOf(Date);
  });
});
