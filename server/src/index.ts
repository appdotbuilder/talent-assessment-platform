
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  createCompanyInputSchema,
  createQuestionInputSchema,
  createAssessmentInputSchema,
  inviteCandidateInputSchema,
  submitAnswerInputSchema,
  updateAssessmentStatusInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createCompany } from './handlers/create_company';
import { createQuestion } from './handlers/create_question';
import { getQuestions } from './handlers/get_questions';
import { createAssessment } from './handlers/create_assessment';
import { getAssessments } from './handlers/get_assessments';
import { addQuestionToAssessment } from './handlers/add_question_to_assessment';
import { inviteCandidate } from './handlers/invite_candidate';
import { getCandidateAssessments } from './handlers/get_candidate_assessments';
import { startAssessment } from './handlers/start_assessment';
import { submitAnswer } from './handlers/submit_answer';
import { completeAssessment } from './handlers/complete_assessment';
import { getAssessmentResults } from './handlers/get_assessment_results';
import { getCandidateResult } from './handlers/get_candidate_result';
import { updateAssessmentStatus } from './handlers/update_assessment_status';
import { getUsers } from './handlers/get_users';
import { z } from 'zod';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  getUsers: publicProcedure
    .input(z.object({ companyId: z.number().optional() }))
    .query(({ input }) => getUsers(input.companyId)),

  // Company management
  createCompany: publicProcedure
    .input(createCompanyInputSchema)
    .mutation(({ input }) => createCompany(input)),

  // Question management
  createQuestion: publicProcedure
    .input(createQuestionInputSchema)
    .mutation(({ input }) => createQuestion(input)),

  getQuestions: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(({ input }) => getQuestions(input.companyId)),

  // Assessment management
  createAssessment: publicProcedure
    .input(createAssessmentInputSchema)
    .mutation(({ input }) => createAssessment(input)),

  getAssessments: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(({ input }) => getAssessments(input.companyId)),

  addQuestionToAssessment: publicProcedure
    .input(z.object({
      assessmentId: z.number(),
      questionId: z.number(),
      orderIndex: z.number(),
      points: z.number().default(1)
    }))
    .mutation(({ input }) => addQuestionToAssessment(
      input.assessmentId,
      input.questionId,
      input.orderIndex,
      input.points
    )),

  updateAssessmentStatus: publicProcedure
    .input(updateAssessmentStatusInputSchema)
    .mutation(({ input }) => updateAssessmentStatus(input)),

  // Candidate management
  inviteCandidate: publicProcedure
    .input(inviteCandidateInputSchema)
    .mutation(({ input }) => inviteCandidate(input)),

  getCandidateAssessments: publicProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(({ input }) => getCandidateAssessments(input.candidateId)),

  // Assessment taking
  startAssessment: publicProcedure
    .input(z.object({ candidateAssessmentId: z.number() }))
    .mutation(({ input }) => startAssessment(input.candidateAssessmentId)),

  submitAnswer: publicProcedure
    .input(submitAnswerInputSchema)
    .mutation(({ input }) => submitAnswer(input)),

  completeAssessment: publicProcedure
    .input(z.object({ candidateAssessmentId: z.number() }))
    .mutation(({ input }) => completeAssessment(input.candidateAssessmentId)),

  // Results and analytics
  getAssessmentResults: publicProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(({ input }) => getAssessmentResults(input.assessmentId)),

  getCandidateResult: publicProcedure
    .input(z.object({ candidateAssessmentId: z.number() }))
    .query(({ input }) => getCandidateResult(input.candidateAssessmentId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
