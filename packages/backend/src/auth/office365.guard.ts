import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { authConstants } from './constants.js';

@Injectable()
export class Office365AuthGuard extends AuthGuard(
  authConstants.office365Strategy,
) {}
