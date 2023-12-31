import { catchError, Observable, of } from 'rxjs';

export class UniquenessFailedError extends Error {
  constructor(fields: readonly string[]) {
    super(
      fields.length === 1
        ? `De waarde in veld '${fields[0]}' bestaat al in de database.`
        : `De combinatie van de velden ${fields
            .map((f) => `'${f}'`)
            .join(', ')} bestaan al in de database.`,
    );
  }
}

export class InternalError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function handleUniquenessError<T>(
  reporter: (errorMessage: string) => void,
) {
  return catchError<T, Observable<never>>((err) => {
    if (err instanceof UniquenessFailedError) {
      reporter(err.message);
      return of();
    } else {
      throw err;
    }
  });
}
