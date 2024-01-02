import { Controller, Get, StreamableFile } from '@nestjs/common';
import { BackupService } from './services/backup.service.js';
import { Privileges } from './auth/privileges.guard.js';

@Controller({ path: 'backup' })
export class BackupController {
  constructor(private backupService: BackupService) {}

  @Get()
  @Privileges('read:backup')
  async backup(): Promise<StreamableFile> {
    return this.backupService.backup();
  }
}
