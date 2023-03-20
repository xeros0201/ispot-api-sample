import { MatchType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsObject } from 'class-validator';

export class CreateMatchDto {
  @IsEnum(MatchType)
  type: MatchType;

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

  @Type(() => Object)
  @IsObject()
  homePlayerIds: { [key: string]: number };

  @Type(() => Object)
  @IsObject()
  awayPlayerIds: { [key: string]: number };
}
