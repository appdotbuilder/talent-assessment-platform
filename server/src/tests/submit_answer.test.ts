
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  companiesTable, 
  usersTable, 
  questionsTable, 
  assessmentsTable, 
  assessmentQuestionsTable,
  candidateAssessmentsTable,
  candidateAnswersTable
} from '../db/schema';
import { type SubmitAnswerInput } from '../schema';
import { submitAnswer } from '../handlers/submit_answer';
import { eq } from 'drizzle-orm';

describe('submitAnswer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCompanyId: number;
  let testUserId: number;
  let testCandidateId: number;
  let testQuestionId: number;
  let testAssessmentId: number;
  let testCandidateAssessmentId: number;

  beforeEach(async () => {
    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values({ name: 'Test Company' })
      .returning()
      .execute();
    testCompanyId = companyResult[0].id;

    // Create test recruiter user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'recruiter@test.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'Recruiter',
        user_type: 'company_recruiter',
        company_id: testCompanyId
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test candidate
    const candidateResult = await db.insert(usersTable)
      .values({
        email: 'candidate@test.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'Candidate',
        user_type: 'candidate'
      })
      .returning()
      .execute();
    testCandidateId = candidateResult[0].id;

    // Create test question
    const questionResult = await db.insert(questionsTable)
      .values({
        title: 'Test Question',
        description: 'What is 2 + 2?',
        question_type: 'free_text',
        correct_answer: '4',
        company_id: testCompanyId,
        created_by: testUserId
      })
      .returning()
      .execute();
    testQuestionId = questionResult[0].id;

    // Create test assessment
    const assessmentResult = await db.insert(assessmentsTable)
      .values({
        title: 'Test Assessment',
        company_id: testCompanyId,
        created_by: testUserId,
        status: 'active'
      })
      .returning()
      .execute();
    testAssessmentId = assessmentResult[0].id;

    // Link question to assessment
    await db.insert(assessmentQuestionsTable)
      .values({
        assessment_id: testAssessmentId,
        question_id: testQuestionId,
        order_index: 1,
        points: 10
      })
      .execute();

    // Create candidate assessment
    const candidateAssessmentResult = await db.insert(candidateAssessmentsTable)
      .values({
        candidate_id: testCandidateId,
        assessment_id: testAssessmentId,
        status: 'in_progress'
      })
      .returning()
      .execute();
    testCandidateAssessmentId = candidateAssessmentResult[0].id;
  });

  it('should submit correct answer and calculate points', async () => {
    const input: SubmitAnswerInput = {
      candidate_assessment_id: testCandidateAssessmentId,
      question_id: testQuestionId,
      answer: '4'
    };

    const result = await submitAnswer(input);

    expect(result.candidate_assessment_id).toEqual(testCandidateAssessmentId);
    expect(result.question_id).toEqual(testQuestionId);
    expect(result.answer).toEqual('4');
    expect(result.is_correct).toBe(true);
    expect(result.points_earned).toEqual(10);
    expect(typeof result.points_earned).toBe('number');
    expect(result.id).toBeDefined();
    expect(result.answered_at).toBeInstanceOf(Date);
  });

  it('should submit incorrect answer with zero points', async () => {
    const input: SubmitAnswerInput = {
      candidate_assessment_id: testCandidateAssessmentId,
      question_id: testQuestionId,
      answer: '5'
    };

    const result = await submitAnswer(input);

    expect(result.answer).toEqual('5');
    expect(result.is_correct).toBe(false);
    expect(result.points_earned).toEqual(0);
    expect(typeof result.points_earned).toBe('number');
  });

  it('should handle case insensitive correct answers', async () => {
    const input: SubmitAnswerInput = {
      candidate_assessment_id: testCandidateAssessmentId,
      question_id: testQuestionId,
      answer: '  4  ' // With whitespace
    };

    const result = await submitAnswer(input);

    expect(result.is_correct).toBe(true);
    expect(result.points_earned).toEqual(10);
  });

  it('should save answer to database', async () => {
    const input: SubmitAnswerInput = {
      candidate_assessment_id: testCandidateAssessmentId,
      question_id: testQuestionId,
      answer: '4'
    };

    const result = await submitAnswer(input);

    const savedAnswers = await db.select()
      .from(candidateAnswersTable)
      .where(eq(candidateAnswersTable.id, result.id))
      .execute();

    expect(savedAnswers).toHaveLength(1);
    expect(savedAnswers[0].answer).toEqual('4');
    expect(savedAnswers[0].is_correct).toBe(true);
    expect(parseFloat(savedAnswers[0].points_earned!)).toEqual(10);
  });

  it('should handle question without correct answer', async () => {
    // Create question without correct answer
    const openQuestionResult = await db.insert(questionsTable)
      .values({
        title: 'Open Question',
        description: 'Describe your experience',
        question_type: 'free_text',
        correct_answer: null,
        company_id: testCompanyId,
        created_by: testUserId
      })
      .returning()
      .execute();

    // Link to assessment
    await db.insert(assessmentQuestionsTable)
      .values({
        assessment_id: testAssessmentId,
        question_id: openQuestionResult[0].id,
        order_index: 2,
        points: 5
      })
      .execute();

    const input: SubmitAnswerInput = {
      candidate_assessment_id: testCandidateAssessmentId,
      question_id: openQuestionResult[0].id,
      answer: 'I have 5 years experience'
    };

    const result = await submitAnswer(input);

    expect(result.answer).toEqual('I have 5 years experience');
    expect(result.is_correct).toBeNull();
    expect(result.points_earned).toBeNull();
  });

  it('should throw error for invalid question id', async () => {
    const input: SubmitAnswerInput = {
      candidate_assessment_id: testCandidateAssessmentId,
      question_id: 99999,
      answer: '4'
    };

    expect(submitAnswer(input)).rejects.toThrow(/question not found/i);
  });

  it('should throw error for invalid candidate assessment id', async () => {
    const input: SubmitAnswerInput = {
      candidate_assessment_id: 99999,
      question_id: testQuestionId,
      answer: '4'
    };

    expect(submitAnswer(input)).rejects.toThrow(/question not found/i);
  });
});
