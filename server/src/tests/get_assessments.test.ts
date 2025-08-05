
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, usersTable, assessmentsTable } from '../db/schema';
import { getAssessments } from '../handlers/get_assessments';

describe('getAssessments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all assessments for a company', async () => {
    // Create test company
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        domain: 'test.com'
      })
      .returning()
      .execute();

    // Create test user (recruiter)
    const [recruiter] = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'company_recruiter',
        company_id: company.id
      })
      .returning()
      .execute();

    // Create test assessments
    const assessment1 = await db.insert(assessmentsTable)
      .values({
        title: 'JavaScript Assessment',
        description: 'Test JS skills',
        company_id: company.id,
        created_by: recruiter.id,
        status: 'active'
      })
      .returning()
      .execute();

    const assessment2 = await db.insert(assessmentsTable)
      .values({
        title: 'Python Assessment',
        description: 'Test Python skills',
        company_id: company.id,
        created_by: recruiter.id,
        status: 'draft'
      })
      .returning()
      .execute();

    const result = await getAssessments(company.id);

    expect(result).toHaveLength(2);
    
    // Verify first assessment
    const jsAssessment = result.find(a => a.title === 'JavaScript Assessment');
    expect(jsAssessment).toBeDefined();
    expect(jsAssessment!.description).toEqual('Test JS skills');
    expect(jsAssessment!.company_id).toEqual(company.id);
    expect(jsAssessment!.created_by).toEqual(recruiter.id);
    expect(jsAssessment!.status).toEqual('active');
    expect(jsAssessment!.created_at).toBeInstanceOf(Date);
    expect(jsAssessment!.updated_at).toBeInstanceOf(Date);

    // Verify second assessment
    const pythonAssessment = result.find(a => a.title === 'Python Assessment');
    expect(pythonAssessment).toBeDefined();
    expect(pythonAssessment!.description).toEqual('Test Python skills');
    expect(pythonAssessment!.status).toEqual('draft');
  });

  it('should return empty array when company has no assessments', async () => {
    // Create test company
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Empty Company',
        domain: 'empty.com'
      })
      .returning()
      .execute();

    const result = await getAssessments(company.id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return assessments for the specified company', async () => {
    // Create two companies
    const [company1] = await db.insert(companiesTable)
      .values({
        name: 'Company 1',
        domain: 'company1.com'
      })
      .returning()
      .execute();

    const [company2] = await db.insert(companiesTable)
      .values({
        name: 'Company 2',
        domain: 'company2.com'
      })
      .returning()
      .execute();

    // Create recruiters for each company
    const [recruiter1] = await db.insert(usersTable)
      .values({
        email: 'recruiter1@test.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'company_recruiter',
        company_id: company1.id
      })
      .returning()
      .execute();

    const [recruiter2] = await db.insert(usersTable)
      .values({
        email: 'recruiter2@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Jane',
        last_name: 'Smith',
        user_type: 'company_recruiter',
        company_id: company2.id
      })
      .returning()
      .execute();

    // Create assessments for each company
    await db.insert(assessmentsTable)
      .values({
        title: 'Company 1 Assessment',
        description: 'Assessment for company 1',
        company_id: company1.id,
        created_by: recruiter1.id,
        status: 'active'
      })
      .execute();

    await db.insert(assessmentsTable)
      .values({
        title: 'Company 2 Assessment',
        description: 'Assessment for company 2',
        company_id: company2.id,
        created_by: recruiter2.id,
        status: 'active'
      })
      .execute();

    // Get assessments for company 1
    const company1Assessments = await getAssessments(company1.id);

    expect(company1Assessments).toHaveLength(1);
    expect(company1Assessments[0].title).toEqual('Company 1 Assessment');
    expect(company1Assessments[0].company_id).toEqual(company1.id);

    // Get assessments for company 2
    const company2Assessments = await getAssessments(company2.id);

    expect(company2Assessments).toHaveLength(1);
    expect(company2Assessments[0].title).toEqual('Company 2 Assessment');
    expect(company2Assessments[0].company_id).toEqual(company2.id);
  });
});
