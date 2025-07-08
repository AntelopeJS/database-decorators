import { RegisterTable, Index, Table, BasicDataModel } from '@ajs.local/database-decorators/beta';

@RegisterTable('test_users')
export class BasicUser extends Table {
  @Index({ primary: true })
  declare _id: string;

  @Index()
  declare email: string;

  declare firstName: string;
  declare lastName: string;
}

export class BasicUserModel extends BasicDataModel(BasicUser, 'test_users') {}
