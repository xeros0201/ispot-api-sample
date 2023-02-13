import { Team } from '@prisma/client';

export class TeamEntity implements Team {
  id: number;

  name: string;

  logo: string;

  seasonId: number;
}
