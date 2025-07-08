import { RegisterTable, Index, Table, BasicDataModel } from '@ajs.local/database-decorators/beta';

@RegisterTable('test_simple')
export class BasicEntity extends Table {
  @Index({ primary: true })
  declare _id: string;

  @Index()
  declare name: string;

  declare description: string;
  declare is_active: boolean;
}

export class BasicEntityModel extends BasicDataModel(BasicEntity, 'test_simple') {}
