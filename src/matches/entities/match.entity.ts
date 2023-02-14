import { Match } from '@prisma/client';

export type MatchUploadedFiles = {
  homeTeamCsv: Express.Multer.File[];
  awayTeamCsv: Express.Multer.File[];
};

export class MatchEntity implements Match {
  id: number;

  seasonId: number;

  homeTeamId: number;

  homeTeamCsv: string;

  awayTeamId: number;

  awayTeamCsv: string;

  round: number;

  date: Date;

  teamId: number;

  locationId: number;
}
