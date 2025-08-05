
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, assessmentsTable, candidateAssessmentsTable } from '../db/schema';
import { startAssessment } from '../handlers/start_assessment';
import { eq } from 'drizzle-orm';

describe('startAssessment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should start an assessment by updating status and started_at', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const [recruiter] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    const [candidate] = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Jane',
        last_name: 'Candidate',
        user_type: 'candidate'
      })
      .returning()
      .execute();

    const [assessment] = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        company_id: company.id,
        created_by: recruiter.id,
        status: 'active'
      })
      .returning()
      .execute();

    const [candidateAssessment] = await db.insert(candidateAssessmentsTable)
      .values({
        candidate_id: candidate.id,
        assessment_id: assessment.id,
        status: 'invited'
      })
      .returning()
      .execute();

    const beforeUpdate = new Date();

    // Start the assessment
    const result = await startAssessment(candidateAssessment.id);

    // Verify the returned result
    expect(result.id).toEqual(candidateAssessment.id);
    expect(result.candidate_id).toEqual(candidate.id);
    expect(result.assessment_id).toEqual(assessment.id);
    expect(result.status).toEqual('in_progress');
    expect(result.started_at).toBeInstanceOf(Date);
    expect(result.started_at!.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    expect(result.invited_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeNull();
    expect(result.score).toBeNull();
    expect(result.total_points).toBeNull();
  });

  it('should update the record in the database', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const [recruiter] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    const [candidate] = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Jane',
        last_name: 'Candidate',
        user_type: 'candidate'
      })
      .returning()
      .execute();

    const [assessment] = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        company_id: company.id,
        created_by: recruiter.id,
        status: 'active'
      })
      .returning()
      .execute();

    const [candidateAssessment] = await db.insert(candidateAssessmentsTable)
      .values({
        candidate_id: candidate.id,
        assessment_id: assessment.id,
        status: 'invited'
      })
      .returning()
      .execute();

    // Start the assessment
    await startAssessment(candidateAssessment.id);

    // Query the database to verify the update
    const updatedRecords = await db.select()
      .from(candidateAssessmentsTable)
      .where(eq(candidateAssessmentsTable.id, candidateAssessment.id))
      .execute();

    expect(updatedRecords).toHaveLength(1);
    const updatedRecord = updatedRecords[0];
    expect(updatedRecord.status).toEqual('in_progress');
    expect(updatedRecord.started_at).toBeInstanceOf(Date);
    expect(updatedRecord.started_at).not.toBeNull();
  });

  it('should throw error for non-existent candidate assessment', async () => {
    const nonExistentId = 999;

    await expect(startAssessment(nonExistentId)).rejects.toThrow(/not found/i);
  });

  it('should handle numeric score field correctly when present', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const [recruiter] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    const [candidate] = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Jane',
        last_name: 'Candidate',
        user_type: 'candidate'
      })
      .returning()
      .execute();

    const [assessment] = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        company_id: company.id,
        created_by: recruiter.id,
        status: 'active'
      })
      .returning()
      .execute();

    const [candidateAssessment] = await db.insert(candidateAssessmentsTable)
      .values({
        candidate_id: candidate.id,
        assessment_id: assessment.id,
        status: 'invited',
        score: '85.50' // Pre-existing score as string
      })
      .returning()
      .execute();

    // Start the assessment
    const result = await startAssessment(candidateAssessment.id);

    // Verify numeric conversion
    expect(result.score).toEqual(85.50);
    expect(typeof result.score).toBe('number');
  });
});
