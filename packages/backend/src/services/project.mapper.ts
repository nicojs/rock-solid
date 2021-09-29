import { Injectable } from '@nestjs/common';
import { DBService } from './db.service';

/**
 * A data mapper for persoon
 * @see https://martinfowler.com/eaaCatalog/dataMapper.html
 */
@Injectable()
export class ProjectMapper {
  constructor(private db: DBService) {}

  public async getAll() {
    const act = await this.db.project.findMany({
      include: { activiteiten: true },
    });
    return act;
  }
}
