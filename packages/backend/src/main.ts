import { NestFactory } from '@nestjs/core';
import { loginUrl, logoutUrl, rockReviver } from '@rock-solid/shared';
import { AppModule } from './app.module.js';
import bodyParser from 'body-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    bodyParser: false,
  });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          scriptSrc: ["'self'", 'http://localhost:35729'],
          connectSrc: ["'self'", 'ws://localhost:35729'],
        },
      },
    }),
  );
  app.use(
    bodyParser.json({
      reviver: rockReviver,
    }),
  );
  app.setGlobalPrefix('api', {
    exclude: [loginUrl, '/auth/callback', logoutUrl],
  });
  await app.listen(process.env['PORT'] ?? 3000);
  console.log(
    `Application is running on: ${await app.getUrl()}, using timezone ${
      process.env.TZ
    }`,
  );
}
bootstrap();
