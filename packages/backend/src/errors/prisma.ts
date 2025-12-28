import { Prisma } from '../../generated/prisma/index.js';
import { UniqueKeyFailedError } from './errors.js';
import { NotFoundException } from '@nestjs/common';

export async function handleKnownPrismaErrors<T>(
  onGoingQuery: Promise<T>,
): Promise<T> {
  try {
    const result = await onGoingQuery;
    return result;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      switch (err.code) {
        case PrismaErrorCodes.UniqueConstraintFailed:
          throw new UniqueKeyFailedError<T>(
            err.meta!['target'] as Array<keyof T & string>,
          );
        case PrismaErrorCodes.OneOrMoreRecordsRequiredButNotFound:
          throw new NotFoundException(
            'One or more records required but not found',
          );
      }
    }
    throw err; // didn't mean to catch this one 🤷‍♀️
  }
}

/**
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 */
const PrismaErrorCodes = Object.freeze({
  UniqueConstraintFailed: 'P2002',
  OneOrMoreRecordsRequiredButNotFound: 'P2025',
} as const);
