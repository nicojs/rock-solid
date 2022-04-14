import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-oauth2';
import fetch from 'node-fetch';
import { authConstants } from './constants.js';
import { User } from '@rock-solid/shared';

interface Office365User {
  displayName: string;
  givenName: string;
  id: string;
  mail: string;
  preferredLanguage: string;
  surname: string;
  userPrincipalName: string;
}

@Injectable()
export class Office365Strategy extends PassportStrategy(
  Strategy,
  authConstants.office365Strategy,
) {
  constructor() {
    const tenantId = process.env['OFFICE_365_TENANT_ID']!;
    super({
      authorizationURL: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      clientID: process.env['OFFICE_365_CLIENT_ID'],
      clientSecret: process.env['OFFICE_365_CLIENT_SECRET'],
      callbackURL: `${process.env['BASE_URL']}/login`,
      scope: 'User.Read',
    });
  }

  async validate(accessToken: string): Promise<User> {
    // GET https://graph.microsoft.com/v1.0/users/{id | userPrincipalName}
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (response.status !== 200) {
      throw new Error(
        `Authentication failed. Response of https://graph.microsoft.com/v1.0/me was with a ${response.status}`,
      );
    }
    const officeUser = (await response.json()) as Office365User;
    return {
      email: officeUser.mail,
      name: officeUser.displayName,
    };
  }
}
