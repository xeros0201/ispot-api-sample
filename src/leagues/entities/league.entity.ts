import { League } from '@prisma/client';

export class LeagueEntity implements League {
  id: number;

  name: string;

  sportId: number;
}
