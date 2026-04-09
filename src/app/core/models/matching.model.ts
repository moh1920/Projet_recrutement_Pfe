// matching.model.ts
export interface MatchResult {
  offerId: string;
  candidateId: string;
  globalScore: number;
  details: { [key: string]: any };
}
