import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import helmet from 'helmet';
import { PrismaClientExceptionFilter, PrismaService } from 'nestjs-prisma';
import * as passport from 'passport';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));
  app.useGlobalPipes(
    new ValidationPipe({
      enableDebugMessages: true,
      transform: true,
      skipNullProperties: true,
    }),
  );

  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.APP_SECRET,
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(helmet());
  app.enableCors({ origin: ['http://localhost:3000'] });
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
