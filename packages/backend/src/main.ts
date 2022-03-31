import { NestFactory } from '@nestjs/core';
import { keiReviver } from '@kei-crm/shared';
import { AppModule } from './app.module';
import { json } from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    bodyParser: false,
  });
  app.use(
    json({
      reviver: keiReviver,
    }),
  );
  app.setGlobalPrefix('api', { exclude: ['/auth/login', '/auth/callback'] });
  await app.listen(3000, 'localhost');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
