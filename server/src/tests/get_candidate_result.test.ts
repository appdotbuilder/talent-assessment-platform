
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  companiesTable, 
  usersTable, 
  assessmentsTable, 
  candidateAssessmentsTable 
} from '../db/schema';
import { getCandidateResult } from '../handlers/get_candidate_result';

describe('getCandidateResult', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent candidate assessment', async () => {
    const result = await getCandidateResult(999);
    expect(result).toBeNull();
  });

  it('should return candidate assessment result', async () => {
    // Create company
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    // Create recruiter
    const [recruiter] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    // Create candidate
    const [candidate] = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Candidate',
        user_type: 'candidate'
      })
      .returning()
      .execute();

    // Create assessment
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

    // Create candidate assessment with score
    const [candidateAssessment] = await db.insert(candidateAssessmentsTable)
      .values({
        candidate_id: candidate.id,
        assessment_id: assessment.id,
        status: 'completed',
        score: '85.50',
        total_points: 100,
        started_at: new Date('2024-01-01T10:00:00Z'),
        completed_at: new Date('2024-01-01T11:00:00Z')
      })
      .returning()
      .execute();

    const result = await getCandidateResult(candidateAssessment.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(candidateAssessment.id);
    expect(result!.candidate_id).toEqual(candidate.id);
    expect(result!.assessment_id).toEqual(assessment.id);
    expect(result!.status).toEqual('completed');
    expect(result!.score).toEqual(85.50);
    expect(typeof result!.score).toBe('number');
    expect(result!.total_points).toEqual(100);
    expect(result!.invited_at).toBeInstanceOf(Date);
    expect(result!.started_at).toBeInstanceOf(Date);
    expect(result!.completed_at).toBeInstanceOf(Date);
  });

  it('should handle candidate assessment without score', async () => {
    // Create company
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    // Create recruiter
    const [recruiter] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    // Create candidate
    const [candidate] = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Candidate',
        user_type: 'candidate'
      })
      .returning()
      .execute();

    // Create assessment
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

    // Create candidate assessment without score (in progress)
    const [candidateAssessment] = await db.insert(candidateAssessmentsTable)
      .values({
        candidate_id: candidate.id,
        assessment_id: assessment.id,
        status: 'in_progress',
        started_at: new Date('2024-01-01T10:00:00Z')
      })
      .returning()
      .execute();

    const result = await getCandidateResult(candidateAssessment.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(candidateAssessment.id);
    expect(result!.status).toEqual('in_progress');
    expect(result!.score).toBeNull();
    expect(result!.total_points).toBeNull();
    expect(result!.completed_at).toBeNull();
    expect(result!.started_at).toBeInstanceOf(Date);
  });
});
