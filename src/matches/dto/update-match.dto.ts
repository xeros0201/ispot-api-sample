import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsObject } from 'class-validator';

import { CreateMatchDto } from './create-match.dto';

export class UpdateMatchDto extends PartialType(CreateMatchDto) {
  @Type(() => Object)
  @IsObject()
  homePlayerIds: { [key: string]: number };

  @Type(() => Object)
  @IsObject()
  awayPlayerIds: { [key: string]: number };
}
