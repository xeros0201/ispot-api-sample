import { IsNumber, IsString } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  name: string;

  @IsNumber()
  playerNumber: number;

  @IsNumber({ maxDecimalPlaces: 0 })
  teamId: number;
}
