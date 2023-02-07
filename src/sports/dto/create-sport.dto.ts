import { IsString } from 'class-validator';

export class CreateSportDto {
  @IsString()
  name: string;
}
