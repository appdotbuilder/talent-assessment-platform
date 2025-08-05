
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, companiesTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input for administrator
const testAdminInput: CreateUserInput = {
  email: 'admin@test.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Admin',
  user_type: 'administrator'
};

// Test input for company recruiter
const testRecruiterInput: CreateUserInput = {
  email: 'recruiter@company.com',
  password: 'password123',
  first_name: 'Jane',
  last_name: 'Recruiter',
  user_type: 'company_recruiter',
  company_id: 1
};

// Test input for candidate
const testCandidateInput: CreateUserInput = {
  email: 'candidate@test.com',
  password: 'password123',
  first_name: 'Bob',
  last_name: 'Candidate',
  user_type: 'candidate'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an administrator user', async () => {
    const result = await createUser(testAdminInput);

    // Basic field validation
    expect(result.email).toEqual('admin@test.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Admin');
    expect(result.user_type).toEqual('administrator');
    expect(result.company_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
  });

  it('should create a candidate user', async () => {
    const result = await createUser(testCandidateInput);

    expect(result.email).toEqual('candidate@test.com');
    expect(result.first_name).toEqual('Bob');
    expect(result.last_name).toEqual('Candidate');
    expect(result.user_type).toEqual('candidate');
    expect(result.company_id).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should create a company recruiter with company_id', async () => {
    // First create a company
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Company',
        domain: 'testcompany.com'
      })
      .returning()
      .execute();

    const recruiterInput = {
      ...testRecruiterInput,
      company_id: company[0].id
    };

    const result = await createUser(recruiterInput);

    expect(result.email).toEqual('recruiter@company.com');
    expect(result.user_type).toEqual('company_recruiter');
    expect(result.company_id).toEqual(company[0].id);
  });

  it('should save user to database', async () => {
    const result = await createUser(testAdminInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('admin@test.com');
    expect(users[0].first_name).toEqual('John');
    expect(users[0].last_name).toEqual('Admin');
    expect(users[0].user_type).toEqual('administrator');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should hash the password', async () => {
    const result = await createUser(testAdminInput);

    // Password should be hashed
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash.length).toBeGreaterThan(20); // Hashed passwords are longer

    // Verify password can be verified with Bun.password
    const isValid = await Bun.password.verify('password123', result.password_hash);
    expect(isValid).toBe(true);
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await createUser(testAdminInput);

    // Try to create another user with the same email
    const duplicateInput = {
      ...testAdminInput,
      first_name: 'Different',
      last_name: 'Person'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should handle missing company_id for non-company users', async () => {
    const inputWithoutCompany: CreateUserInput = {
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User',
      user_type: 'candidate'
      // No company_id provided
    };

    const result = await createUser(inputWithoutCompany);

    expect(result.company_id).toBeNull();
    expect(result.user_type).toEqual('candidate');
  });
});
