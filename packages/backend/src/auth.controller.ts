import { LoginResponse, loginUrl, logoutUrl, User } from '@rock-solid/shared';
import { Controller, Request, UseGuards, Get, Redirect } from '@nestjs/common';
import { Office365AuthGuard, AuthService, Public } from './auth/index.js';
import { authConstants } from './auth/constants.js';

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

  @Public()
  @Get(logoutUrl)
  @Redirect(
    `https://login.microsoftonline.com/${authConstants.tenantId}/oauth2/v2.0/logout`,
  )
  logout(): void {}
}
