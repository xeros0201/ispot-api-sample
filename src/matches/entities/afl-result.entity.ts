import { AFLResult } from '@prisma/client';

export class AFLResultEntity implements AFLResult {
  id: number;

  matchId: number;

  teamId: number;

  scorePrimary: number;

  scoreSecondary: number;
}
