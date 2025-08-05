
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, assessmentsTable, candidateAssessmentsTable } from '../db/schema';
import { type InviteCandidateInput } from '../schema';
import { inviteCandidate } from '../handlers/invite_candidate';
import { eq, and } from 'drizzle-orm';

describe('inviteCandidate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let companyId: number;
  let recruiterId: number;
  let candidateId: number;
  let assessmentId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        domain: 'test.com'
      })
      .returning()
      .execute();
    companyId = company[0].id;

    const recruiter = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: companyId
      })
      .returning()
      .execute();
    recruiterId = recruiter[0].id;

    const candidate = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Jane',
        last_name: 'Candidate',
        user_type: 'candidate'
      })
      .returning()
      .execute();
    candidateId = candidate[0].id;

    const assessment = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        description: 'A test assessment',
        company_id: companyId,
        created_by: recruiterId,
        status: 'active'
      })
      .returning()
      .execute();
    assessmentId = assessment[0].id;
  });

  const testInput: InviteCandidateInput = {
    candidate_id: 0, // Will be set in tests
    assessment_id: 0  // Will be set in tests
  };

  it('should invite a candidate to an assessment', async () => {
    const input = {
      ...testInput,
      candidate_id: candidateId,
      assessment_id: assessmentId
    };

    const result = await inviteCandidate(input);

    expect(result.candidate_id).toEqual(candidateId);
    expect(result.assessment_id).toEqual(assessmentId);
    expect(result.status).toEqual('invited');
    expect(result.id).toBeDefined();
    expect(result.invited_at).toBeInstanceOf(Date);
    expect(result.started_at).toBeNull();
    expect(result.completed_at).toBeNull();
    expect(result.score).toBeNull();
    expect(result.total_points).toBeNull();
  });

  it('should save candidate assessment to database', async () => {
    const input = {
      ...testInput,
      candidate_id: candidateId,
      assessment_id: assessmentId
    };

    const result = await inviteCandidate(input);

    const candidateAssessments = await db.select()
      .from(candidateAssessmentsTable)
      .where(eq(candidateAssessmentsTable.id, result.id))
      .execute();

    expect(candidateAssessments).toHaveLength(1);
    expect(candidateAssessments[0].candidate_id).toEqual(candidateId);
    expect(candidateAssessments[0].assessment_id).toEqual(assessmentId);
    expect(candidateAssessments[0].status).toEqual('invited');
    expect(candidateAssessments[0].invited_at).toBeInstanceOf(Date);
  });

  it('should throw error when candidate does not exist', async () => {
    const input = {
      ...testInput,
      candidate_id: 999999, // Non-existent candidate
      assessment_id: assessmentId
    };

    await expect(inviteCandidate(input)).rejects.toThrow(/candidate not found/i);
  });

  it('should throw error when user is not a candidate', async () => {
    const input = {
      ...testInput,
      candidate_id: recruiterId, // Recruiter, not candidate
      assessment_id: assessmentId
    };

    await expect(inviteCandidate(input)).rejects.toThrow(/not a candidate/i);
  });

  it('should throw error when assessment does not exist', async () => {
    const input = {
      ...testInput,
      candidate_id: candidateId,
      assessment_id: 999999 // Non-existent assessment
    };

    await expect(inviteCandidate(input)).rejects.toThrow(/assessment not found/i);
  });

  it('should throw error when candidate is already invited to assessment', async () => {
    const input = {
      ...testInput,
      candidate_id: candidateId,
      assessment_id: assessmentId
    };

    // First invitation should succeed
    await inviteCandidate(input);

    // Second invitation should fail
    await expect(inviteCandidate(input)).rejects.toThrow(/already invited/i);
  });

  it('should allow same candidate to be invited to different assessments', async () => {
    // Create second assessment
    const secondAssessment = await db.insert(assessmentsTable)
      .values({
        title: 'Second Assessment',
        description: 'Another test assessment',
        company_id: companyId,
        created_by: recruiterId,
        status: 'active'
      })
      .returning()
      .execute();

    const firstInput = {
      ...testInput,
      candidate_id: candidateId,
      assessment_id: assessmentId
    };

    const secondInput = {
      ...testInput,
      candidate_id: candidateId,
      assessment_id: secondAssessment[0].id
    };

    // Both invitations should succeed
    const firstResult = await inviteCandidate(firstInput);
    const secondResult = await inviteCandidate(secondInput);

    expect(firstResult.assessment_id).toEqual(assessmentId);
    expect(secondResult.assessment_id).toEqual(secondAssessment[0].id);
    expect(firstResult.candidate_id).toEqual(candidateId);
    expect(secondResult.candidate_id).toEqual(candidateId);
  });
});
