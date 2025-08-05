
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type CreateCompanyInput } from '../schema';
import { createCompany } from '../handlers/create_company';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCompanyInput = {
  name: 'Test Company',
  domain: 'test.com'
};

describe('createCompany', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a company with domain', async () => {
    const result = await createCompany(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Company');
    expect(result.domain).toEqual('test.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a company without domain', async () => {
    const inputWithoutDomain: CreateCompanyInput = {
      name: 'Company Without Domain'
    };

    const result = await createCompany(inputWithoutDomain);

    expect(result.name).toEqual('Company Without Domain');
    expect(result.domain).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save company to database', async () => {
    const result = await createCompany(testInput);

    // Query using proper drizzle syntax
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, result.id))
      .execute();

    expect(companies).toHaveLength(1);
    expect(companies[0].name).toEqual('Test Company');
    expect(companies[0].domain).toEqual('test.com');
    expect(companies[0].created_at).toBeInstanceOf(Date);
    expect(companies[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null domain correctly in database', async () => {
    const inputWithNullDomain: CreateCompanyInput = {
      name: 'Null Domain Company',
      domain: null
    };

    const result = await createCompany(inputWithNullDomain);

    // Verify in database
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, result.id))
      .execute();

    expect(companies[0].domain).toBeNull();
  });
});
