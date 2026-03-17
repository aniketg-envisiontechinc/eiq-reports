import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initDataLoader } from './common/data-loader';

async function bootstrap() {
  // Load report data (from MinIO URL if REPORT_URL is set, otherwise local files)
  await initDataLoader();

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3004'];
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  const port = process.env.PORT ?? 3005;
  await app.listen(port);
  console.log(`EngageIQ Reports API running on http://localhost:${port}`);
}
bootstrap();
