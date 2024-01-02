import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  BadRequestException,
  Inject,
  Injectable,
  StreamableFile,
} from '@nestjs/common';

@Injectable()
export class BackupService {
  constructor(@Inject('DatabaseUrl') private databaseUrl: string) {}

  #databaseFile?: string;
  get databaseFile(): string {
    if (!this.#databaseFile) {
      const match = this.databaseUrl.match(/file:(.+)\?connection_limit=1$/);
      if (!match) {
        throw new Error(
          `Could not resolve database file name from database url ${this.databaseUrl}.`,
        );
      }
      this.#databaseFile = fileURLToPath(
        new URL(`../../prisma/${match[1]!}`, import.meta.url),
      );
    }
    return this.#databaseFile;
  }

  async backup(): Promise<StreamableFile> {
    // create the backup using 'better-sqlite3', since prisma doesn't expose the database driver
    const { default: sqlite3 } = await import('better-sqlite3');

    const backupPath = `${this.databaseFile}.backup.db`;
    const db = sqlite3(this.databaseFile);
    await db.backup(backupPath);
    const fileStream = fs.createReadStream(backupPath);

    fileStream.on('end', () => {
      try {
        fs.unlinkSync(backupPath);
      } catch (error) {
        throw new BadRequestException(
          'An error occurred while removing the file.',
        );
      }
    });

    return new StreamableFile(fileStream);
  }
}
