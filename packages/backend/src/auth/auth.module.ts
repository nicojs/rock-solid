import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { authConstants } from './constants';
import { JwtAuthGuard } from './jwt-guard';
import { JwtStrategy } from './jwt-strategy';
import { Office365Strategy } from './office365-strategy';

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
