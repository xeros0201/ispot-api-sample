import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import * as _ from 'lodash';

export class GetStatsDto {
  @Transform(({ value }) => _.toNumber(value))
  @IsNumber()
  seasonId: number;

  @Transform(({ value }) => _.toNumber(value))
  @IsNumber()
  @IsOptional()
  round: number;
}
