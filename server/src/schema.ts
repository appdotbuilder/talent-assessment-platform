
import { z } from 'zod';

// User types enum
export const userTypeSchema = z.enum(['administrator', 'company_recruiter', 'candidate']);
export type UserType = z.infer<typeof userTypeSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  user_type: userTypeSchema,
  company_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Company schema
export const companySchema = z.object({
  id: z.number(),
  name: z.string(),
  domain: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Company = z.infer<typeof companySchema>;

// Question types enum
export const questionTypeSchema = z.enum(['multiple_choice', 'coding_challenge', 'free_text']);
export type QuestionType = z.infer<typeof questionTypeSchema>;

// Question schema
export const questionSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  question_type: questionTypeSchema,
  options: z.string().nullable(), // JSON string for multiple choice options
  correct_answer: z.string().nullable(),
  company_id: z.number(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Question = z.infer<typeof questionSchema>;

// Assessment status enum
export const assessmentStatusSchema = z.enum(['draft', 'active', 'archived']);
export type AssessmentStatus = z.infer<typeof assessmentStatusSchema>;

// Assessment schema
export const assessmentSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  company_id: z.number(),
  created_by: z.number(),
  status: assessmentStatusSchema,
  time_limit_minutes: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Assessment = z.infer<typeof assessmentSchema>;

// Assessment Question (junction table)
export const assessmentQuestionSchema = z.object({
  id: z.number(),
  assessment_id: z.number(),
  question_id: z.number(),
  order_index: z.number(),
  points: z.number()
});

export type AssessmentQuestion = z.infer<typeof assessmentQuestionSchema>;

// Candidate Assessment status enum
export const candidateAssessmentStatusSchema = z.enum(['invited', 'in_progress', 'completed', 'expired']);
export type CandidateAssessmentStatus = z.infer<typeof candidateAssessmentStatusSchema>;

// Candidate Assessment schema
export const candidateAssessmentSchema = z.object({
  id: z.number(),
  candidate_id: z.number(),
  assessment_id: z.number(),
  status: candidateAssessmentStatusSchema,
  invited_at: z.coerce.date(),
  started_at: z.coerce.date().nullable(),
  completed_at: z.coerce.date().nullable(),
  score: z.number().nullable(),
  total_points: z.number().nullable()
});

export type CandidateAssessment = z.infer<typeof candidateAssessmentSchema>;

// Candidate Answer schema
export const candidateAnswerSchema = z.object({
  id: z.number(),
  candidate_assessment_id: z.number(),
  question_id: z.number(),
  answer: z.string(),
  is_correct: z.boolean().nullable(),
  points_earned: z.number().nullable(),
  answered_at: z.coerce.date()
});

export type CandidateAnswer = z.infer<typeof candidateAnswerSchema>;

// Input schemas for creating records
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  user_type: userTypeSchema,
  company_id: z.number().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createCompanyInputSchema = z.object({
  name: z.string().min(1),
  domain: z.string().nullable().optional()
});

export type CreateCompanyInput = z.infer<typeof createCompanyInputSchema>;

export const createQuestionInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  question_type: questionTypeSchema,
  options: z.string().nullable().optional(),
  correct_answer: z.string().nullable().optional(),
  company_id: z.number(),
  created_by: z.number()
});

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>;

export const createAssessmentInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  company_id: z.number(),
  created_by: z.number(),
  time_limit_minutes: z.number().positive().optional()
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentInputSchema>;

export const inviteCandidateInputSchema = z.object({
  candidate_id: z.number(),
  assessment_id: z.number()
});

export type InviteCandidateInput = z.infer<typeof inviteCandidateInputSchema>;

export const submitAnswerInputSchema = z.object({
  candidate_assessment_id: z.number(),
  question_id: z.number(),
  answer: z.string()
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerInputSchema>;

// Update schemas
export const updateAssessmentStatusInputSchema = z.object({
  assessment_id: z.number(),
  status: assessmentStatusSchema
});

export type UpdateAssessmentStatusInput = z.infer<typeof updateAssessmentStatusInputSchema>;
