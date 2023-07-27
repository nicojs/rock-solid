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
    const requiredPrivilege = this.reflector.getAllAndOverride<Privilege>(
      authConstants.requiredPrivilege,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPrivilege) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<express.Request>();
    if (!user) {
      return false;
    }
    return privileges[user.role].includes(requiredPrivilege);
  }
}
