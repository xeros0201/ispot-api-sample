import { Sport } from '@prisma/client';

import { LeagueEntity } from '../../leagues/entities/league.entity';

export class SportEntity implements Sport {
  id: number;

  name: string;

  leagues?: LeagueEntity[];
}
