import { Module } from '@nestjs/common';

import { UploadToS3Service } from './uploadToS3.service';

@Module({
  controllers: [],
  providers: [UploadToS3Service],
  exports: [UploadToS3Service],
})
export class UploadToS3Module {}
