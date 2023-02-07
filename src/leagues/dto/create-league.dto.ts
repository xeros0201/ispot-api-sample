import { IsString, IsNumber } from 'class-validator';

export class CreateLeagueDto {
  @IsString()
  name: string;

  @IsNumber({ maxDecimalPlaces: 0 })
  sportId: number;
}
