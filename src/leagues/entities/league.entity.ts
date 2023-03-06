import { League } from '@prisma/client';

export class LeagueEntity implements League {
  id: number;

  name: string;

  logo: string;

  sportId: number;

  createdDate: Date;

  createdUserId: string;

  updatedDate: Date;

  updatedUserId: string;
}
