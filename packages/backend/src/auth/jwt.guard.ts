import { ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { authConstants } from './constants.js';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

export const Public = () => SetMetadata(authConstants.public, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard(authConstants.jwtStrategy) {
  constructor(private reflector: Reflector) {
    super();
  }

  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      authConstants.public,
      [context.getHandler(), context.getClass()],
    );

    return isPublic || super.canActivate(context);
  }
}
