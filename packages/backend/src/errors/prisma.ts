import { Prisma } from '@prisma/client';
import { UniqueKeyFailedError } from './unique-key-failed-error.js';

export async function handleKnownPrismaErrors<T>(
  onGoingQuery: Promise<T>,
): Promise<T> {
  try {
    const result = await onGoingQuery;
    return result;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === PrismaErrorCodes.UniqueConstraintFailed
    ) {
      throw new UniqueKeyFailedError(err.meta!['target'] as string[]);
    }
    throw err; // didn't mean to catch this one 🤷‍♀️
  }
}

const PrismaErrorCodes = Object.freeze({
  UniqueConstraintFailed: 'P2002',
} as const);
