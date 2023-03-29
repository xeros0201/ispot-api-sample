import { Module } from '@nestjs/common';
import { UploadToS3Service } from 'src/common/uploadToS3/uploadToS3.service';

import { PlayersService } from '../players/players.service';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  providers: [TeamsService, PlayersService, UploadToS3Service],
  exports: [TeamsService],
  controllers: [TeamsController],
})
export class TeamsModule {}
