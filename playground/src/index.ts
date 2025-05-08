import { Controller, Get, Post, Put, Delete, RawBody, Parameter } from '@ajs/api/beta';
import { StaticModel } from '@ajs/database-decorators/beta';
import { UserModel } from './db/user';

export class PlaygroundController extends Controller('/playground') {
  @StaticModel(UserModel, 'database-decorators-playground')
  declare userModel: UserModel;

  @Get('/users')
  async listUsers() {
    return await this.userModel.getAll();
  }

  @Post('/users')
  async createUser(@RawBody() rawBody: Buffer) {
    const body = JSON.parse(rawBody.toString());
    const result = await this.userModel.insert(body);
    return result;
  }

  @Get('/users/:id')
  async getUser(@Parameter('id', 'param') id: string) {
    console.log(id);
    return await this.userModel.get(id);
  }

  @Put('/users/:id')
  async updateUser(@Parameter('id', 'param') id: string, @RawBody() rawBody: Buffer) {
    const body = JSON.parse(rawBody.toString());
    await this.userModel.update(id, body);
    return await this.userModel.get(id);
  }

  @Delete('/users/:id')
  async deleteUser(@Parameter('id', 'param') id: string) {
    await this.userModel.delete(id);
    return { message: 'User deleted' };
  }
}

export function construct(): void {}

export function destroy(): void {}

export async function start(): Promise<void> {}

export function stop(): void {}
