
import { db } from '../db';
import { candidateAssessmentsTable, usersTable, assessmentsTable } from '../db/schema';
import { type InviteCandidateInput, type CandidateAssessment } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function inviteCandidate(input: InviteCandidateInput): Promise<CandidateAssessment> {
  try {
    // Verify that candidate exists and is of type 'candidate'
    const candidate = await db.select()
      .from(usersTable)
      .where(and(
        eq(usersTable.id, input.candidate_id),
        eq(usersTable.user_type, 'candidate')
      ))
      .execute();

    if (candidate.length === 0) {
      throw new Error('Candidate not found or user is not a candidate');
    }

    // Verify that assessment exists
    const assessment = await db.select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.id, input.assessment_id))
      .execute();

    if (assessment.length === 0) {
      throw new Error('Assessment not found');
    }

    // Check if candidate is already invited to this assessment
    const existingInvitation = await db.select()
      .from(candidateAssessmentsTable)
      .where(and(
        eq(candidateAssessmentsTable.candidate_id, input.candidate_id),
        eq(candidateAssessmentsTable.assessment_id, input.assessment_id)
      ))
      .execute();

    if (existingInvitation.length > 0) {
      throw new Error('Candidate is already invited to this assessment');
    }

    // Create the candidate assessment record
    const result = await db.insert(candidateAssessmentsTable)
      .values({
        candidate_id: input.candidate_id,
        assessment_id: input.assessment_id,
        status: 'invited'
        // invited_at is set by default in schema
        // other fields are nullable and will be null by default
      })
      .returning()
      .execute();

    const candidateAssessment = result[0];

    // Convert numeric fields to numbers before returning
    return {
      ...candidateAssessment,
      score: candidateAssessment.score ? parseFloat(candidateAssessment.score) : null
    };
  } catch (error) {
    console.error('Candidate invitation failed:', error);
    throw error;
  }
}
