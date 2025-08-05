
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assessmentsTable, companiesTable, usersTable } from '../db/schema';
import { type CreateAssessmentInput } from '../schema';
import { createAssessment } from '../handlers/create_assessment';
import { eq } from 'drizzle-orm';

describe('createAssessment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let companyId: number;
  let userId: number;

  beforeEach(async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        domain: 'test.com'
      })
      .returning()
      .execute();
    companyId = companyResult[0].id;

    // Create prerequisite user (company recruiter)
    const userResult = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: companyId
      })
      .returning()
      .execute();
    userId = userResult[0].id;
  });

  const createTestInput = (overrides: Partial<CreateAssessmentInput> = {}): CreateAssessmentInput => ({
    title: 'JavaScript Developer Assessment',
    description: 'Assessment for JavaScript developer position',
    company_id: companyId,
    created_by: userId,
    time_limit_minutes: 60,
    ...overrides
  });

  it('should create an assessment with all fields', async () => {
    const input = createTestInput();
    const result = await createAssessment(input);

    expect(result.title).toEqual('JavaScript Developer Assessment');
    expect(result.description).toEqual('Assessment for JavaScript developer position');
    expect(result.company_id).toEqual(companyId);
    expect(result.created_by).toEqual(userId);
    expect(result.status).toEqual('draft');
    expect(result.time_limit_minutes).toEqual(60);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an assessment with minimal fields', async () => {
    const input = createTestInput({
      description: undefined,
      time_limit_minutes: undefined
    });
    const result = await createAssessment(input);

    expect(result.title).toEqual('JavaScript Developer Assessment');
    expect(result.description).toBeNull();
    expect(result.time_limit_minutes).toBeNull();
    expect(result.status).toEqual('draft');
    expect(result.id).toBeDefined();
  });

  it('should save assessment to database', async () => {
    const input = createTestInput();
    const result = await createAssessment(input);

    const assessments = await db.select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.id, result.id))
      .execute();

    expect(assessments).toHaveLength(1);
    expect(assessments[0].title).toEqual('JavaScript Developer Assessment');
    expect(assessments[0].description).toEqual('Assessment for JavaScript developer position');
    expect(assessments[0].company_id).toEqual(companyId);
    expect(assessments[0].created_by).toEqual(userId);
    expect(assessments[0].status).toEqual('draft');
    expect(assessments[0].time_limit_minutes).toEqual(60);
    expect(assessments[0].created_at).toBeInstanceOf(Date);
    expect(assessments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle foreign key constraint violations', async () => {
    const input = createTestInput({
      company_id: 99999, // Non-existent company
      created_by: 99999  // Non-existent user
    });

    await expect(createAssessment(input)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
