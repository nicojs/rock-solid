import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-oauth2';
import { authConstants } from './constants.js';
import { User, UserRole } from '@rock-solid/shared';

interface Office365User {
  displayName: string;
  givenName: string;
  id: string;
  mail: string;
  preferredLanguage: string;
  surname: string;
  userPrincipalName: string;
}
interface MemberOfResponse {
  value: { id: string }[];
}

@Injectable()
export class Office365Strategy extends PassportStrategy(
  Strategy,
  authConstants.office365Strategy,
) {
  constructor() {
    super({
      authorizationURL: `https://login.microsoftonline.com/${authConstants.tenantId}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${authConstants.tenantId}/oauth2/v2.0/token`,
      clientID: process.env['OFFICE_365_CLIENT_ID'],
      clientSecret: process.env['OFFICE_365_CLIENT_SECRET'],
      callbackURL: `${process.env['BASE_URL']}/login`,
      scope: 'User.Read',
    });
  }

  async validate(accessToken: string): Promise<User> {
    // GET https://graph.microsoft.com/v1.0/users/{id | userPrincipalName}
    const meResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const memberOf = await fetch(
      'https://graph.microsoft.com/v1.0/me/memberOf',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (memberOf.status !== 200) {
      throw new Error(
        `Authentication failed. Response of https://graph.microsoft.com/v1.0/me/memberOf was with a ${meResponse.status}`,
      );
    }
    if (meResponse.status !== 200) {
      throw new Error(
        `Authentication failed. Response of https://graph.microsoft.com/v1.0/me was with a ${meResponse.status}`,
      );
    }
    const officeUser = (await meResponse.json()) as Office365User;
    const memberOfJson = (await memberOf.json()) as MemberOfResponse;
    const groupIds = memberOfJson.value.map(({ id }) => id);
    const role: UserRole | undefined =
      authConstants.roleOverride ??
      (groupIds.includes(authConstants.adminGroupObjectId)
        ? 'admin'
        : groupIds.includes(authConstants.projectverantwoordelijkeGroupObjectId)
          ? 'projectverantwoordelijke'
          : groupIds.includes(authConstants.financieelBeheerderGroupObjectId)
            ? 'financieelBeheerder'
            : undefined);
    if (!role) {
      throw new UnauthorizedException(
        `Not authorized, as the user does not belong to a RockSolid group.`,
      );
    }
    return {
      email: officeUser.mail,
      name: officeUser.displayName,
      role,
    };
  }
}
