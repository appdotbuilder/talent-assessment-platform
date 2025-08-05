
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, assessmentsTable, candidateAssessmentsTable, candidateAnswersTable, questionsTable } from '../db/schema';
import { completeAssessment } from '../handlers/complete_assessment';
import { eq } from 'drizzle-orm';

describe('completeAssessment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should complete an assessment and calculate score', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        domain: 'test.com'
      })
      .returning()
      .execute();

    const recruiter = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company[0].id
      })
      .returning()
      .execute();

    const candidate = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Candidate',
        user_type: 'candidate'
      })
      .returning()
      .execute();

    const assessment = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        description: 'A test assessment',
        company_id: company[0].id,
        created_by: recruiter[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const question = await db.insert(questionsTable)
      .values({
        title: 'Test Question',
        description: 'A test question',
        question_type: 'multiple_choice',
        correct_answer: 'A',
        company_id: company[0].id,
        created_by: recruiter[0].id
      })
      .returning()
      .execute();

    const candidateAssessment = await db.insert(candidateAssessmentsTable)
      .values({
        candidate_id: candidate[0].id,
        assessment_id: assessment[0].id,
        status: 'in_progress',
        total_points: 100
      })
      .returning()
      .execute();

    // Add some answers with scores
    await db.insert(candidateAnswersTable)
      .values([
        {
          candidate_assessment_id: candidateAssessment[0].id,
          question_id: question[0].id,
          answer: 'A',
          is_correct: true,
          points_earned: '85.5' // String for numeric column
        }
      ])
      .execute();

    const result = await completeAssessment(candidateAssessment[0].id);

    // Verify the result
    expect(result.id).toEqual(candidateAssessment[0].id);
    expect(result.status).toEqual('completed');
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.score).toEqual(85.5);
    expect(typeof result.score).toBe('number');
    expect(result.total_points).toEqual(100);
  });

  it('should save completed assessment to database', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        domain: 'test.com'
      })
      .returning()
      .execute();

    const recruiter = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company[0].id
      })
      .returning()
      .execute();

    const candidate = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Candidate',
        user_type: 'candidate'
      })
      .returning()
      .execute();

    const assessment = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        description: 'A test assessment',
        company_id: company[0].id,
        created_by: recruiter[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const candidateAssessment = await db.insert(candidateAssessmentsTable)
      .values({
        candidate_id: candidate[0].id,
        assessment_id: assessment[0].id,
        status: 'in_progress',
        total_points: 50
      })
      .returning()
      .execute();

    const result = await completeAssessment(candidateAssessment[0].id);

    // Verify database was updated
    const updatedAssessment = await db.select()
      .from(candidateAssessmentsTable)
      .where(eq(candidateAssessmentsTable.id, result.id))
      .execute();

    expect(updatedAssessment).toHaveLength(1);
    expect(updatedAssessment[0].status).toEqual('completed');
    expect(updatedAssessment[0].completed_at).toBeInstanceOf(Date);
    expect(parseFloat(updatedAssessment[0].score || '0')).toEqual(0); // No answers = 0 score
    expect(updatedAssessment[0].total_points).toEqual(50);
  });

  it('should throw error for non-existent assessment', async () => {
    await expect(completeAssessment(999)).rejects.toThrow(/not found/i);
  });

  it('should throw error for already completed assessment', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        domain: 'test.com'
      })
      .returning()
      .execute();

    const recruiter = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company[0].id
      })
      .returning()
      .execute();

    const candidate = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Candidate',
        user_type: 'candidate'
      })
      .returning()
      .execute();

    const assessment = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        description: 'A test assessment',
        company_id: company[0].id,
        created_by: recruiter[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const candidateAssessment = await db.insert(candidateAssessmentsTable)
      .values({
        candidate_id: candidate[0].id,
        assessment_id: assessment[0].id,
        status: 'completed', // Already completed
        completed_at: new Date(),
        total_points: 100
      })
      .returning()
      .execute();

    await expect(completeAssessment(candidateAssessment[0].id)).rejects.toThrow(/already completed/i);
  });

  it('should handle zero score correctly', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        domain: 'test.com'
      })
      .returning()
      .execute();

    const recruiter = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company[0].id
      })
      .returning()
      .execute();

    const candidate = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Candidate',
        user_type: 'candidate'
      })
      .returning()
      .execute();

    const assessment = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        description: 'A test assessment',
        company_id: company[0].id,
        created_by: recruiter[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const candidateAssessment = await db.insert(candidateAssessmentsTable)
      .values({
        candidate_id: candidate[0].id,
        assessment_id: assessment[0].id,
        status: 'in_progress',
        total_points: 100
      })
      .returning()
      .execute();

    const result = await completeAssessment(candidateAssessment[0].id);

    expect(result.score).toEqual(0);
    expect(typeof result.score).toBe('number');
    expect(result.status).toEqual('completed');
  });
});
