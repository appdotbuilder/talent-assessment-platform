
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, questionsTable, assessmentsTable, assessmentQuestionsTable } from '../db/schema';
import { addQuestionToAssessment } from '../handlers/add_question_to_assessment';
import { eq } from 'drizzle-orm';

describe('addQuestionToAssessment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add a question to an assessment', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    const [question] = await db.insert(questionsTable)
      .values({
        title: 'Test Question',
        description: 'A test question',
        question_type: 'multiple_choice',
        company_id: company.id,
        created_by: user.id
      })
      .returning()
      .execute();

    const [assessment] = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        company_id: company.id,
        created_by: user.id
      })
      .returning()
      .execute();

    // Test adding question to assessment
    const result = await addQuestionToAssessment(assessment.id, question.id, 1, 10);

    expect(result.assessment_id).toEqual(assessment.id);
    expect(result.question_id).toEqual(question.id);
    expect(result.order_index).toEqual(1);
    expect(result.points).toEqual(10);
    expect(result.id).toBeDefined();
  });

  it('should save assessment question to database', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    const [question] = await db.insert(questionsTable)
      .values({
        title: 'Test Question',
        description: 'A test question',
        question_type: 'free_text',
        company_id: company.id,
        created_by: user.id
      })
      .returning()
      .execute();

    const [assessment] = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        company_id: company.id,
        created_by: user.id
      })
      .returning()
      .execute();

    const result = await addQuestionToAssessment(assessment.id, question.id, 2, 5);

    // Verify record was saved to database
    const savedRecord = await db.select()
      .from(assessmentQuestionsTable)
      .where(eq(assessmentQuestionsTable.id, result.id))
      .execute();

    expect(savedRecord).toHaveLength(1);
    expect(savedRecord[0].assessment_id).toEqual(assessment.id);
    expect(savedRecord[0].question_id).toEqual(question.id);
    expect(savedRecord[0].order_index).toEqual(2);
    expect(savedRecord[0].points).toEqual(5);
  });

  it('should use default points value of 1', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    const [question] = await db.insert(questionsTable)
      .values({
        title: 'Test Question',
        description: 'A test question',
        question_type: 'coding_challenge',
        company_id: company.id,
        created_by: user.id
      })
      .returning()
      .execute();

    const [assessment] = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        company_id: company.id,
        created_by: user.id
      })
      .returning()
      .execute();

    // Test without providing points parameter
    const result = await addQuestionToAssessment(assessment.id, question.id, 0);

    expect(result.points).toEqual(1);
  });

  it('should throw error when assessment does not exist', async () => {
    // Create prerequisite data (question only)
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    const [question] = await db.insert(questionsTable)
      .values({
        title: 'Test Question',
        description: 'A test question',
        question_type: 'multiple_choice',
        company_id: company.id,
        created_by: user.id
      })
      .returning()
      .execute();

    await expect(addQuestionToAssessment(999, question.id, 1, 5))
      .rejects.toThrow(/assessment with id 999 not found/i);
  });

  it('should throw error when question does not exist', async () => {
    // Create prerequisite data (assessment only)
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    const [assessment] = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        company_id: company.id,
        created_by: user.id
      })
      .returning()
      .execute();

    await expect(addQuestionToAssessment(assessment.id, 999, 1, 5))
      .rejects.toThrow(/question with id 999 not found/i);
  });
});
