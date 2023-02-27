import { Season } from '@prisma/client';

export class SeasonEntity implements Season {
  id: number;

  name: string;

  leagueId: number;

  createdDate: Date;

  createdUserId: string;

  updatedDate: Date;

  updatedUserId: string;
}
