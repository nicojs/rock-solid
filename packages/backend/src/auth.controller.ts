import { LoginResponse, loginUrl, User } from '@kei-crm/shared';
import { Controller, Request, UseGuards, Get } from '@nestjs/common';
import { Office365AuthGuard, AuthService } from './auth';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(Office365AuthGuard)
  @Get(loginUrl)
  async login(@Request() req: { user: User }): Promise<LoginResponse> {
    return {
      jwt: (await this.authService.login(req.user)).access_token,
      user: req.user,
    };
  }
}
