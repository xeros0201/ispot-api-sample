import { Prisma, TeamReport } from '@prisma/client';

export class TeamReportEntity implements TeamReport {
  id: number;

  matchId: number;

  teamId: number;

  score: number;

  meta: Prisma.JsonValue & {
    RUSHED?: number;
    BEHIND?: number;
  };
}
