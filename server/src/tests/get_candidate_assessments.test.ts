
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, assessmentsTable, candidateAssessmentsTable } from '../db/schema';
import { getCandidateAssessments } from '../handlers/get_candidate_assessments';

describe('getCandidateAssessments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all assessments for a candidate', async () => {
    // Create test company
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        domain: 'test.com'
      })
      .returning()
      .execute();

    // Create test users (candidate and recruiter)
    const [candidate] = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'candidate',
        company_id: null
      })
      .returning()
      .execute();

    const [recruiter] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Smith',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    // Create test assessment
    const [assessment] = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        description: 'A test assessment',
        company_id: company.id,
        created_by: recruiter.id,
        status: 'active'
      })
      .returning()
      .execute();

    // Create candidate assessment
    await db.insert(candidateAssessmentsTable)
      .values({
        candidate_id: candidate.id,
        assessment_id: assessment.id,
        status: 'invited',
        score: '85.50',
        total_points: 100
      })
      .execute();

    const result = await getCandidateAssessments(candidate.id);

    expect(result).toHaveLength(1);
    expect(result[0].candidate_id).toEqual(candidate.id);
    expect(result[0].assessment_id).toEqual(assessment.id);
    expect(result[0].status).toEqual('invited');
    expect(result[0].score).toEqual(85.5);
    expect(typeof result[0].score).toEqual('number');
    expect(result[0].total_points).toEqual(100);
    expect(result[0].invited_at).toBeInstanceOf(Date);
  });

  it('should return multiple assessments for a candidate', async () => {
    // Create test company
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        domain: 'test.com'
      })
      .returning()
      .execute();

    // Create test users
    const [candidate] = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'candidate',
        company_id: null
      })
      .returning()
      .execute();

    const [recruiter] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Smith',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    // Create multiple assessments
    const [assessment1] = await db.insert(assessmentsTable)
      .values({
        title: 'Assessment 1',
        description: 'First assessment',
        company_id: company.id,
        created_by: recruiter.id,
        status: 'active'
      })
      .returning()
      .execute();

    const [assessment2] = await db.insert(assessmentsTable)
      .values({
        title: 'Assessment 2',
        description: 'Second assessment',
        company_id: company.id,
        created_by: recruiter.id,
        status: 'draft'
      })
      .returning()
      .execute();

    // Create candidate assessments
    await db.insert(candidateAssessmentsTable)
      .values([
        {
          candidate_id: candidate.id,
          assessment_id: assessment1.id,
          status: 'completed',
          score: '92.75',
          total_points: 120
        },
        {
          candidate_id: candidate.id,
          assessment_id: assessment2.id,
          status: 'in_progress',
          score: null,
          total_points: null
        }
      ])
      .execute();

    const result = await getCandidateAssessments(candidate.id);

    expect(result).toHaveLength(2);
    
    // Find assessments by assessment_id to avoid order dependency
    const completedAssessment = result.find(ca => ca.assessment_id === assessment1.id);
    const inProgressAssessment = result.find(ca => ca.assessment_id === assessment2.id);

    expect(completedAssessment).toBeDefined();
    expect(completedAssessment!.status).toEqual('completed');
    expect(completedAssessment!.score).toEqual(92.75);
    expect(typeof completedAssessment!.score).toEqual('number');

    expect(inProgressAssessment).toBeDefined();
    expect(inProgressAssessment!.status).toEqual('in_progress');
    expect(inProgressAssessment!.score).toBeNull();
    expect(inProgressAssessment!.total_points).toBeNull();
  });

  it('should return empty array when candidate has no assessments', async () => {
    // Create test candidate without any assessments
    const [candidate] = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'candidate',
        company_id: null
      })
      .returning()
      .execute();

    const result = await getCandidateAssessments(candidate.id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return assessments for the specified candidate', async () => {
    // Create test company
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        domain: 'test.com'
      })
      .returning()
      .execute();

    // Create test users (two candidates and one recruiter)
    const [candidate1] = await db.insert(usersTable)
      .values({
        email: 'candidate1@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'candidate',
        company_id: null
      })
      .returning()
      .execute();

    const [candidate2] = await db.insert(usersTable)
      .values({
        email: 'candidate2@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Smith',
        user_type: 'candidate',
        company_id: null
      })
      .returning()
      .execute();

    const [recruiter] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashed_password',
        first_name: 'Bob',
        last_name: 'Wilson',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    // Create test assessment
    const [assessment] = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        description: 'A test assessment',
        company_id: company.id,
        created_by: recruiter.id,
        status: 'active'
      })
      .returning()
      .execute();

    // Create candidate assessments for both candidates
    await db.insert(candidateAssessmentsTable)
      .values([
        {
          candidate_id: candidate1.id,
          assessment_id: assessment.id,
          status: 'invited'
        },
        {
          candidate_id: candidate2.id,
          assessment_id: assessment.id,
          status: 'completed'
        }
      ])
      .execute();

    const result = await getCandidateAssessments(candidate1.id);

    expect(result).toHaveLength(1);
    expect(result[0].candidate_id).toEqual(candidate1.id);
    expect(result[0].status).toEqual('invited');
  });
});
