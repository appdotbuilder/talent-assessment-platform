
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, assessmentsTable, candidateAssessmentsTable } from '../db/schema';
import { getAssessmentResults } from '../handlers/get_assessment_results';

describe('getAssessmentResults', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no candidates for assessment', async () => {
    // Create company
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    // Create recruiter
    const [recruiter] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    // Create assessment
    const [assessment] = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        company_id: company.id,
        created_by: recruiter.id,
        status: 'active'
      })
      .returning()
      .execute();

    const results = await getAssessmentResults(assessment.id);

    expect(results).toEqual([]);
  });

  it('should return candidate assessment results', async () => {
    // Create company
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    // Create recruiter
    const [recruiter] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    // Create candidate
    const [candidate] = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hash123',
        first_name: 'Jane',
        last_name: 'Smith',
        user_type: 'candidate'
      })
      .returning()
      .execute();

    // Create assessment
    const [assessment] = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        company_id: company.id,
        created_by: recruiter.id,
        status: 'active'
      })
      .returning()
      .execute();

    // Create candidate assessment
    const [candidateAssessment] = await db.insert(candidateAssessmentsTable)
      .values({
        candidate_id: candidate.id,
        assessment_id: assessment.id,
        status: 'completed',
        score: '85.50',
        total_points: 100
      })
      .returning()
      .execute();

    const results = await getAssessmentResults(assessment.id);

    expect(results).toHaveLength(1);
    expect(results[0].id).toEqual(candidateAssessment.id);
    expect(results[0].candidate_id).toEqual(candidate.id);
    expect(results[0].assessment_id).toEqual(assessment.id);
    expect(results[0].status).toEqual('completed');
    expect(results[0].score).toEqual(85.50);
    expect(typeof results[0].score).toEqual('number');
    expect(results[0].total_points).toEqual(100);
    expect(results[0].invited_at).toBeInstanceOf(Date);
  });

  it('should return multiple candidate results for same assessment', async () => {
    // Create company
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    // Create recruiter
    const [recruiter] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    // Create candidates
    const [candidate1] = await db.insert(usersTable)
      .values({
        email: 'candidate1@test.com',
        password_hash: 'hash123',
        first_name: 'Jane',
        last_name: 'Smith',
        user_type: 'candidate'
      })
      .returning()
      .execute();

    const [candidate2] = await db.insert(usersTable)
      .values({
        email: 'candidate2@test.com',
        password_hash: 'hash123',
        first_name: 'Bob',
        last_name: 'Johnson',
        user_type: 'candidate'
      })
      .returning()
      .execute();

    // Create assessment
    const [assessment] = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        company_id: company.id,
        created_by: recruiter.id,
        status: 'active'
      })
      .returning()
      .execute();

    // Create candidate assessments
    await db.insert(candidateAssessmentsTable)
      .values([
        {
          candidate_id: candidate1.id,
          assessment_id: assessment.id,
          status: 'completed',
          score: '85.50',
          total_points: 100
        },
        {
          candidate_id: candidate2.id,
          assessment_id: assessment.id,
          status: 'in_progress',
          score: null,
          total_points: null
        }
      ])
      .execute();

    const results = await getAssessmentResults(assessment.id);

    expect(results).toHaveLength(2);
    
    const completedResult = results.find(r => r.candidate_id === candidate1.id);
    expect(completedResult?.status).toEqual('completed');
    expect(completedResult?.score).toEqual(85.50);
    expect(typeof completedResult?.score).toEqual('number');

    const inProgressResult = results.find(r => r.candidate_id === candidate2.id);
    expect(inProgressResult?.status).toEqual('in_progress');
    expect(inProgressResult?.score).toBeNull();
  });

  it('should handle null scores correctly', async () => {
    // Create company
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    // Create recruiter
    const [recruiter] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hash123',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    // Create candidate
    const [candidate] = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hash123',
        first_name: 'Jane',
        last_name: 'Smith',
        user_type: 'candidate'
      })
      .returning()
      .execute();

    // Create assessment
    const [assessment] = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        company_id: company.id,
        created_by: recruiter.id,
        status: 'active'
      })
      .returning()
      .execute();

    // Create candidate assessment with null score
    await db.insert(candidateAssessmentsTable)
      .values({
        candidate_id: candidate.id,
        assessment_id: assessment.id,
        status: 'invited',
        score: null,
        total_points: null
      })
      .execute();

    const results = await getAssessmentResults(assessment.id);

    expect(results).toHaveLength(1);
    expect(results[0].score).toBeNull();
    expect(results[0].total_points).toBeNull();
  });
});
