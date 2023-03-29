import { Player } from '@prisma/client';

export class PlayerEntity implements Player {
  id: number;

  teamId: number;

  name: string;

  playerNumber: number;

  createdDate: Date;

  createdUserId: string;

  updatedDate: Date;

  updatedUserId: string;
}
