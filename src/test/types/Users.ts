import { RegisterTable, Index, Table, BasicDataModel } from '@ajs.local/database-decorators/beta';

@RegisterTable('t_users', 'core')
export class Users extends Table {
  @Index({ primary: true })
  declare _id: string;

  declare created_at: Date;
  declare updated_at: Date;

  declare name: string;
  declare email: string;
  declare password: string;
  declare role: 'admin' | 'user';
  declare age: number;
  declare is_active: boolean;
}

export class UsersModel extends BasicDataModel(Users, 't_users') {
  private async createUser(new_user: Users) {
    return await this.insert(new_user);
  }

  private async updateUser(id: string, updated_user: Users) {
    return await this.update(id, updated_user);
  }

  private async deleteUser(id: string) {
    return await this.delete(id);
  }

  private async getUser(id: string) {
    return await this.get(id);
  }

  private async getUserByEmail(email: string) {
    return await this.getBy('email', email);
  }

  private async getUsers() {
    return await this.getAll();
  }

  private async getUsersByAge(age: number) {
    return await this.getBy('age', age);
  }

  private async getUsersByRole(role: 'admin' | 'user') {
    return await this.getBy('role', role);
  }

  private async updateUserAge(id: string, age: number) {
    return await this.update(id, { age });
  }
}
