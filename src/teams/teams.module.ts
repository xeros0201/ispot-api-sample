import { Module } from '@nestjs/common';

import { AWSS3Service } from '../aws-s3/aws-s3.service';
import { PlayersService } from '../players/players.service';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  providers: [TeamsService, PlayersService, AWSS3Service],
  exports: [TeamsService],
  controllers: [TeamsController],
})
export class TeamsModule {}
