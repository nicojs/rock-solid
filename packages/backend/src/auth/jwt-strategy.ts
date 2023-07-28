import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { authConstants } from './constants.js';
import { User } from '@rock-solid/shared';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  authConstants.jwtStrategy,
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConstants.jwtSecret,
    });
  }

  validate({ email, name, role }: User): User {
    return { email, name, role };
  }
}
