import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './config/config';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { middleware as expressCtx } from 'express-ctx';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

const CONFIG = AppConfig();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
    {
      rawBody: true,
      bodyParser: true,
      bufferLogs: true,
    },
  );

  app.disable('x-powered-by');

  // Enable CORS - Allow all origins
  app.enableCors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers',
    ],
    exposedHeaders: [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers',
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.use(cookieParser());

  app.useBodyParser('json', { limit: '101mb' });
  app.useBodyParser('text', { limit: '10mb' });
  app.useBodyParser('urlencoded', { limit: '101mb', extended: true });

  app.use(expressCtx);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Hera API')
    .setDescription('APIs for interacting with Hera.')
    .setVersion('1.0')
    .addTag('hera')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Write JSON file
  fs.writeFileSync(
    './openapi.json',
    JSON.stringify(documentFactory(), null, 2),
  );

  // Write YAML file
  fs.writeFileSync(
    './openapi.yaml',
    yaml.dump(documentFactory(), { indent: 2 }),
  );

  const logger = new Logger();

  await app.listen(CONFIG.PORT, CONFIG.HOST).then(() => {
    logger.log(`Server running on port ${CONFIG.PORT}`);
  });

  return app;
}
bootstrap();
