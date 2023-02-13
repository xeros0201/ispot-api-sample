import { Player } from '@prisma/client';

export class PlayerEntity implements Player {
  id: number;

  teamId: number;

  name: string;

  playerNumber: number;
}
