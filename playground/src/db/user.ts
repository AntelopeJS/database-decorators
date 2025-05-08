import { BasicDataModel, Index, Table, RegisterTable } from '@ajs/database-decorators/beta';

@RegisterTable('users')
class User extends Table {
  @Index({ primary: true })
  declare _id: string;

  @Index()
  declare email: string;

  declare firstName: string;
  declare lastName: string;
}

export class UserModel extends BasicDataModel(User, 'database-decorators-playground') {}