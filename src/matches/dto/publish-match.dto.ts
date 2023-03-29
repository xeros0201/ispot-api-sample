import { MatchType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
} from 'class-validator';

export class PublishMatchDto {
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
}
