import {
  BasicDataModel,
  Index,
  RegisterTable,
  Table,
} from "@antelopejs/interface-database-decorators";

@RegisterTable("users", "app")
class User extends Table {
  @Index()
  declare email: string;

  declare firstName: string;
  declare lastName: string;
}

export class UserModel extends BasicDataModel(
  User,
  "database-decorators-playground",
) {}
