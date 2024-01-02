import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import { BackupController } from './backup.controller.js';
import { harness } from './test-utils.test.js';
import sqlite3 from 'better-sqlite3';
import { Persoon } from '@rock-solid/shared';

describe(BackupController.name, () => {
  beforeEach(() => {
    harness.login();
  });
  afterEach(async () => {
    await harness.clear();
  });
  describe('auth', () => {
    it('GET /backup should not be allowed for projectverantwoordelijke', async () => {
      harness.login({ role: 'projectverantwoordelijke' });
      await harness.get('/backup').expect(403);
    });
    it('GET /backup should be allowed for admin', async () => {
      harness.login({ role: 'admin' });
      await harness.get('/backup').expect(200);
    });
  });

  describe('GET /backup', () => {
    it('should return a backup file', async () => {
      await harness.createDeelnemer({
        achternaam: 'Hermsen',
        type: 'deelnemer',
      });
      const resp = await harness.get('/backup').expect(200);
      expect(resp.headers['content-type']).to.equal('application/octet-stream');
      const backupFile = path.join(
        os.tmpdir(),
        `backup-file${process.env['STRYKER_MUTATOR_WORKER']}.db`,
      );
      try {
        await fs.writeFile(backupFile, resp.body);
        const db = sqlite3(backupFile);
        const personen = db.prepare('SELECT * FROM Persoon;').all();
        expect(personen).lengthOf(1);
        expect((personen[0] as Persoon).achternaam).to.equal('Hermsen');
      } finally {
        await fs.rm(backupFile, { force: true });
      }
    });
  });
});
