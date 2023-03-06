import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class CreateSeasonDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  leagueId: number;
}
