
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, companiesTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all users when no companyId is provided', async () => {
    // Create test companies
    const companyResults = await db.insert(companiesTable)
      .values([
        { name: 'Company A', domain: 'companya.com' },
        { name: 'Company B', domain: 'companyb.com' }
      ])
      .returning()
      .execute();

    const companyA = companyResults[0];
    const companyB = companyResults[1];

    // Create test users
    await db.insert(usersTable)
      .values([
        {
          email: 'admin@test.com',
          password_hash: 'hashedpassword1',
          first_name: 'Admin',
          last_name: 'User',
          user_type: 'administrator',
          company_id: null
        },
        {
          email: 'recruiter1@companya.com',
          password_hash: 'hashedpassword2',
          first_name: 'Recruiter',
          last_name: 'One',
          user_type: 'company_recruiter',
          company_id: companyA.id
        },
        {
          email: 'candidate1@test.com',
          password_hash: 'hashedpassword3',
          first_name: 'Candidate',
          last_name: 'One',
          user_type: 'candidate',
          company_id: companyB.id
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    expect(result.map(u => u.email).sort()).toEqual([
      'admin@test.com',
      'candidate1@test.com',
      'recruiter1@companya.com'
    ]);
    
    // Verify user properties
    const adminUser = result.find(u => u.email === 'admin@test.com');
    expect(adminUser).toBeDefined();
    expect(adminUser!.first_name).toEqual('Admin');
    expect(adminUser!.last_name).toEqual('User');
    expect(adminUser!.user_type).toEqual('administrator');
    expect(adminUser!.company_id).toBeNull();
    expect(adminUser!.created_at).toBeInstanceOf(Date);
    expect(adminUser!.updated_at).toBeInstanceOf(Date);
  });

  it('should return users filtered by company when companyId is provided', async () => {
    // Create test companies
    const companyResults = await db.insert(companiesTable)
      .values([
        { name: 'Company A', domain: 'companya.com' },
        { name: 'Company B', domain: 'companyb.com' }
      ])
      .returning()
      .execute();

    const companyA = companyResults[0];
    const companyB = companyResults[1];

    // Create test users
    await db.insert(usersTable)
      .values([
        {
          email: 'recruiter1@companya.com',
          password_hash: 'hashedpassword1',
          first_name: 'Recruiter',
          last_name: 'One',
          user_type: 'company_recruiter',
          company_id: companyA.id
        },
        {
          email: 'recruiter2@companya.com',
          password_hash: 'hashedpassword2',
          first_name: 'Recruiter',
          last_name: 'Two',
          user_type: 'company_recruiter',
          company_id: companyA.id
        },
        {
          email: 'candidate1@test.com',
          password_hash: 'hashedpassword3',
          first_name: 'Candidate',
          last_name: 'One',
          user_type: 'candidate',
          company_id: companyB.id
        }
      ])
      .execute();

    const result = await getUsers(companyA.id);

    expect(result).toHaveLength(2);
    expect(result.every(u => u.company_id === companyA.id)).toBe(true);
    expect(result.map(u => u.email).sort()).toEqual([
      'recruiter1@companya.com',
      'recruiter2@companya.com'
    ]);

    // Verify user properties
    const recruiterOne = result.find(u => u.email === 'recruiter1@companya.com');
    expect(recruiterOne).toBeDefined();
    expect(recruiterOne!.first_name).toEqual('Recruiter');
    expect(recruiterOne!.last_name).toEqual('One');
    expect(recruiterOne!.user_type).toEqual('company_recruiter');
  });

  it('should return empty array when filtering by non-existent company', async () => {
    // Create a user with a different company
    const companyResult = await db.insert(companiesTable)
      .values({ name: 'Company A', domain: 'companya.com' })
      .returning()
      .execute();

    await db.insert(usersTable)
      .values({
        email: 'recruiter@companya.com',
        password_hash: 'hashedpassword',
        first_name: 'Recruiter',
        last_name: 'User',
        user_type: 'company_recruiter',
        company_id: companyResult[0].id
      })
      .execute();

    const result = await getUsers(999); // Non-existent company ID

    expect(result).toHaveLength(0);
  });

  it('should handle users with null company_id when filtering', async () => {
    // Create users with null company_id
    await db.insert(usersTable)
      .values([
        {
          email: 'admin@test.com',
          password_hash: 'hashedpassword1',
          first_name: 'Admin',
          last_name: 'User',
          user_type: 'administrator',
          company_id: null
        },
        {
          email: 'candidate@test.com',
          password_hash: 'hashedpassword2',
          first_name: 'Candidate',
          last_name: 'User',
          user_type: 'candidate',
          company_id: null
        }
      ])
      .execute();

    // Filter by a specific company should not return users with null company_id
    const result = await getUsers(1);
    expect(result).toHaveLength(0);

    // Getting all users should include users with null company_id
    const allUsers = await getUsers();
    expect(allUsers).toHaveLength(2);
    expect(allUsers.every(u => u.company_id === null)).toBe(true);
  });
});
