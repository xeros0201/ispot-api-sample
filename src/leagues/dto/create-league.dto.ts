import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class CreateLeagueDto {
  @Type(() => String)
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  sportId: number;
}
