
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, assessmentsTable } from '../db/schema';
import { type UpdateAssessmentStatusInput } from '../schema';
import { updateAssessmentStatus } from '../handlers/update_assessment_status';
import { eq } from 'drizzle-orm';

describe('updateAssessmentStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update assessment status', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company[0].id
      })
      .returning()
      .execute();

    const assessment = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        description: 'A test assessment',
        company_id: company[0].id,
        created_by: user[0].id,
        status: 'draft'
      })
      .returning()
      .execute();

    const input: UpdateAssessmentStatusInput = {
      assessment_id: assessment[0].id,
      status: 'active'
    };

    const result = await updateAssessmentStatus(input);

    expect(result.id).toEqual(assessment[0].id);
    expect(result.status).toEqual('active');
    expect(result.title).toEqual('Test Assessment');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated status to database', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company[0].id
      })
      .returning()
      .execute();

    const assessment = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        company_id: company[0].id,
        created_by: user[0].id,
        status: 'draft'
      })
      .returning()
      .execute();

    const input: UpdateAssessmentStatusInput = {
      assessment_id: assessment[0].id,
      status: 'archived'
    };

    await updateAssessmentStatus(input);

    // Verify in database
    const updatedAssessment = await db.select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.id, assessment[0].id))
      .execute();

    expect(updatedAssessment).toHaveLength(1);
    expect(updatedAssessment[0].status).toEqual('archived');
    expect(updatedAssessment[0].updated_at).toBeInstanceOf(Date);
    expect(updatedAssessment[0].updated_at > assessment[0].updated_at).toBe(true);
  });

  it('should throw error for non-existent assessment', async () => {
    const input: UpdateAssessmentStatusInput = {
      assessment_id: 99999,
      status: 'active'
    };

    await expect(updateAssessmentStatus(input)).rejects.toThrow(/not found/i);
  });

  it('should handle all valid status transitions', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: company[0].id
      })
      .returning()
      .execute();

    const assessment = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        company_id: company[0].id,
        created_by: user[0].id,
        status: 'draft'
      })
      .returning()
      .execute();

    const statusTransitions = ['active', 'archived', 'draft'] as const;

    for (const status of statusTransitions) {
      const input: UpdateAssessmentStatusInput = {
        assessment_id: assessment[0].id,
        status
      };

      const result = await updateAssessmentStatus(input);
      expect(result.status).toEqual(status);

      // Verify persistence
      const dbAssessment = await db.select()
        .from(assessmentsTable)
        .where(eq(assessmentsTable.id, assessment[0].id))
        .execute();

      expect(dbAssessment[0].status).toEqual(status);
    }
  });
});
