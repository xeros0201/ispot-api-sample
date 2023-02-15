import { Type } from 'class-transformer';
import { IsDate, IsNumber } from 'class-validator';

export class CreateMatchDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  seasonId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  homeTeamId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  awayTeamId: number;

  @Type(() => Number)
  @IsNumber()
  round: number;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  locationId: number;
}
