import { Injectable } from '@nestjs/common';
import { readFileSync, unlinkSync } from 'fs';
import * as _ from 'lodash';
import { PrismaService } from 'nestjs-prisma';
import { InjectS3, S3 } from 'nestjs-s3';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UploadToS3Service {
  constructor(
    @InjectS3() private readonly s3: S3,
    private readonly prismaService: PrismaService,
  ) {}

  public async uploadImageToS3(
    bucket: string,
    filePath: string,
    extension = 'png',
    oldKey?: string,
  ): Promise<string> {
    if (!_.isNil(oldKey)) {
      await this.s3.deleteObject({ Bucket: bucket, Key: oldKey }).promise();
    }

    const buffer = readFileSync(filePath);

    const data = await this.s3
      .upload({
        Bucket: bucket,
        Key: `${uuid()}.${extension}`,
        Body: buffer,
      })
      .promise();

    unlinkSync(filePath);

    return data.Key;
  }
}
