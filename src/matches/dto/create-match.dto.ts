import { MatchStatus, MatchType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
} from 'class-validator';

export class CreateMatchDto {
  @IsEnum(MatchType)
  @IsOptional()
  type?: MatchType;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsOptional()
  seasonId?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsOptional()
  homeTeamId?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsOptional()
  awayTeamId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  round?: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  date?: Date;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsOptional()
  locationId?: number;

  @Type(() => Object)
  @IsObject()
  @IsOptional()
  homePlayerIds?: { [key: string]: number };

  @Type(() => Object)
  @IsObject()
  @IsOptional()
  awayPlayerIds?: { [key: string]: number };
}
