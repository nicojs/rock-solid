import type express from 'express';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Privilege, privileges } from '@rock-solid/shared';
import { authConstants } from './constants.js';

export const Privileges = (privilege: Privilege) =>
  SetMetadata(authConstants.requiredPrivilege, privilege);

@Injectable()
export class PrivilegesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      authConstants.public,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }
    const req = context.switchToHttp().getRequest<express.Request>();
    const requiredPrivilege =
      this.reflector.getAllAndOverride<Privilege>(
        authConstants.requiredPrivilege,
        [context.getHandler(), context.getClass()],
      ) ?? (req.method === 'GET' ? 'read' : undefined);

    if (!requiredPrivilege) {
      return true;
    }
    const { user } = req;
    if (!user) {
      return false;
    }
    return privileges[user.role].includes(requiredPrivilege);
  }
}
