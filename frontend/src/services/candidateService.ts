import { Candidate, MatchResult } from '../types';

export const candidateService = {
  getCandidates: async (): Promise<{ data: Candidate[] }> => {
    return { data: [] };
  },

  addCandidate: async (_candidate: Candidate): Promise<{ data: Candidate }> => {
    throw new Error('Candidate storage is unavailable without a backend.');
  },

  getCandidateById: async (id: number): Promise<{ data: Candidate }> => {
    throw new Error(`Candidate ${id} is unavailable without a backend.`);
  },

  updateCandidateStatus: async (id: number, _status: string): Promise<{ data: Candidate }> => {
    throw new Error(`Candidate ${id} is unavailable without a backend.`);
  },

  getCandidateMatch: async (id: number): Promise<{ data: MatchResult }> => {
    throw new Error(`Candidate ${id} is unavailable without a backend.`);
  }
};
