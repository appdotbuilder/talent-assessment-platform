
import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  integer, 
  pgEnum,
  boolean,
  numeric
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userTypeEnum = pgEnum('user_type', ['administrator', 'company_recruiter', 'candidate']);
export const questionTypeEnum = pgEnum('question_type', ['multiple_choice', 'coding_challenge', 'free_text']);
export const assessmentStatusEnum = pgEnum('assessment_status', ['draft', 'active', 'archived']);
export const candidateAssessmentStatusEnum = pgEnum('candidate_assessment_status', ['invited', 'in_progress', 'completed', 'expired']);

// Companies table
export const companiesTable = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  domain: text('domain'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  user_type: userTypeEnum('user_type').notNull(),
  company_id: integer('company_id').references(() => companiesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Questions table
export const questionsTable = pgTable('questions', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  question_type: questionTypeEnum('question_type').notNull(),
  options: text('options'), // JSON string for multiple choice options
  correct_answer: text('correct_answer'),
  company_id: integer('company_id').references(() => companiesTable.id).notNull(),
  created_by: integer('created_by').references(() => usersTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Assessments table
export const assessmentsTable = pgTable('assessments', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  company_id: integer('company_id').references(() => companiesTable.id).notNull(),
  created_by: integer('created_by').references(() => usersTable.id).notNull(),
  status: assessmentStatusEnum('status').notNull().default('draft'),
  time_limit_minutes: integer('time_limit_minutes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Assessment Questions junction table
export const assessmentQuestionsTable = pgTable('assessment_questions', {
  id: serial('id').primaryKey(),
  assessment_id: integer('assessment_id').references(() => assessmentsTable.id).notNull(),
  question_id: integer('question_id').references(() => questionsTable.id).notNull(),
  order_index: integer('order_index').notNull(),
  points: integer('points').notNull().default(1)
});

// Candidate Assessments table
export const candidateAssessmentsTable = pgTable('candidate_assessments', {
  id: serial('id').primaryKey(),
  candidate_id: integer('candidate_id').references(() => usersTable.id).notNull(),
  assessment_id: integer('assessment_id').references(() => assessmentsTable.id).notNull(),
  status: candidateAssessmentStatusEnum('status').notNull().default('invited'),
  invited_at: timestamp('invited_at').defaultNow().notNull(),
  started_at: timestamp('started_at'),
  completed_at: timestamp('completed_at'),
  score: numeric('score', { precision: 5, scale: 2 }),
  total_points: integer('total_points')
});

// Candidate Answers table
export const candidateAnswersTable = pgTable('candidate_answers', {
  id: serial('id').primaryKey(),
  candidate_assessment_id: integer('candidate_assessment_id').references(() => candidateAssessmentsTable.id).notNull(),
  question_id: integer('question_id').references(() => questionsTable.id).notNull(),
  answer: text('answer').notNull(),
  is_correct: boolean('is_correct'),
  points_earned: numeric('points_earned', { precision: 5, scale: 2 }),
  answered_at: timestamp('answered_at').defaultNow().notNull()
});

// Relations
export const companiesRelations = relations(companiesTable, ({ many }) => ({
  users: many(usersTable),
  questions: many(questionsTable),
  assessments: many(assessmentsTable)
}));

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  company: one(companiesTable, {
    fields: [usersTable.company_id],
    references: [companiesTable.id]
  }),
  createdQuestions: many(questionsTable),
  createdAssessments: many(assessmentsTable),
  candidateAssessments: many(candidateAssessmentsTable)
}));

export const questionsRelations = relations(questionsTable, ({ one, many }) => ({
  company: one(companiesTable, {
    fields: [questionsTable.company_id],
    references: [companiesTable.id]
  }),
  createdBy: one(usersTable, {
    fields: [questionsTable.created_by],
    references: [usersTable.id]
  }),
  assessmentQuestions: many(assessmentQuestionsTable),
  candidateAnswers: many(candidateAnswersTable)
}));

export const assessmentsRelations = relations(assessmentsTable, ({ one, many }) => ({
  company: one(companiesTable, {
    fields: [assessmentsTable.company_id],
    references: [companiesTable.id]
  }),
  createdBy: one(usersTable, {
    fields: [assessmentsTable.created_by],
    references: [usersTable.id]
  }),
  assessmentQuestions: many(assessmentQuestionsTable),
  candidateAssessments: many(candidateAssessmentsTable)
}));

export const assessmentQuestionsRelations = relations(assessmentQuestionsTable, ({ one }) => ({
  assessment: one(assessmentsTable, {
    fields: [assessmentQuestionsTable.assessment_id],
    references: [assessmentsTable.id]
  }),
  question: one(questionsTable, {
    fields: [assessmentQuestionsTable.question_id],
    references: [questionsTable.id]
  })
}));

export const candidateAssessmentsRelations = relations(candidateAssessmentsTable, ({ one, many }) => ({
  candidate: one(usersTable, {
    fields: [candidateAssessmentsTable.candidate_id],
    references: [usersTable.id]
  }),
  assessment: one(assessmentsTable, {
    fields: [candidateAssessmentsTable.assessment_id],
    references: [assessmentsTable.id]
  }),
  answers: many(candidateAnswersTable)
}));

export const candidateAnswersRelations = relations(candidateAnswersTable, ({ one }) => ({
  candidateAssessment: one(candidateAssessmentsTable, {
    fields: [candidateAnswersTable.candidate_assessment_id],
    references: [candidateAssessmentsTable.id]
  }),
  question: one(questionsTable, {
    fields: [candidateAnswersTable.question_id],
    references: [questionsTable.id]
  })
}));

// Export all tables for proper query building
export const tables = {
  companies: companiesTable,
  users: usersTable,
  questions: questionsTable,
  assessments: assessmentsTable,
  assessmentQuestions: assessmentQuestionsTable,
  candidateAssessments: candidateAssessmentsTable,
  candidateAnswers: candidateAnswersTable
};
