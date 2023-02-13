import { IsNumber, IsString } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsString()
  logo?: string;

  @IsNumber()
  seasonId: number;
}
