import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { authConstants } from './constants.js';
import { JwtAuthGuard } from './jwt.guard.js';
import { JwtStrategy } from './jwt-strategy.js';
import { Office365Strategy } from './office365-strategy.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: authConstants.jwtSecret,
      signOptions: { expiresIn: '10h' },
    }),
  ],
  providers: [Office365Strategy, JwtStrategy, AuthService, JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
