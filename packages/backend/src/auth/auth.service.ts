import { User } from '@kei-crm/shared';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(user: User) {
    return {
      access_token: this.jwtService.sign(user),
    };
  }
}
