import { LoginResponse, loginUrl, User } from '@rock-solid/shared';
import { Controller, Request, UseGuards, Get } from '@nestjs/common';
import { Office365AuthGuard, AuthService, Public } from './auth/index.js';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(Office365AuthGuard)
  @Get(loginUrl)
  async login(@Request() req: { user: User }): Promise<LoginResponse> {
    return {
      jwt: (await this.authService.login(req.user)).access_token,
      user: req.user,
    };
  }
}
