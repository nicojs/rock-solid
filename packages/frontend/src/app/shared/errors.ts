import { Labels } from '@rock-solid/shared';
import { catchError, Observable, of } from 'rxjs';

export class UniquenessFailedError<T> extends Error {
  constructor(private fields: ReadonlyArray<keyof T & string>) {
    super(
      fields.length === 1
        ? `De waarde in veld '${fields[0]}' bestaat al in de database.`
        : `De combinatie van de velden ${fields
            .map((f) => `'${f}'`)
            .join(', ')} bestaan al in de database.`,
    );
  }

  formatMessage(labels: Labels<T> | undefined) {
    return this.fields.length === 1
      ? `De waarde in veld '${
          labels?.[this.fields[0]!] ?? this.fields[0]
        }' bestaat al in de database.`
      : `De combinatie van de velden ${this.fields
          .map((f) => `'${f}'`)
          .join(', ')} bestaan al in de database.`;
  }
}

export class InternalError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function handleUniquenessError<T>(
  reporter: (errorMessage: string) => void,
  labels: Labels<T>,
) {
  return catchError<T, Observable<never>>((err) => {
    if (err instanceof UniquenessFailedError) {
      reporter(err.formatMessage(labels));
      return of();
    } else {
      throw err;
    }
  });
}
