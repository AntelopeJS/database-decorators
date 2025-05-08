import { MakeClassDecorator, ClassDecorator } from '@ajs/core/beta/decorators';
import { Table } from './table';
import { InitializeDatabase } from './database';

export const DEFAULT_SCHEMA = Symbol('default');
export type DatabaseSchema = Record<string, Table>;

const databasesSchema: Record<string | symbol, DatabaseSchema> = {};

export const RegisterTable: (tableName: string, schemaName?: string) => ClassDecorator<typeof Table> =
  MakeClassDecorator((target, tableName: string, schemaName?: string) => {
    const database = schemaName || String(DEFAULT_SCHEMA);
    databasesSchema[database] = databasesSchema[database] || {};
    databasesSchema[database][tableName] = target;
  });

export const GetTablesFromSchema = (schemaName: string) => {
  return databasesSchema[schemaName];
};

export function InitializeDatabaseFromSchema(databaseName: string, schemaName?: string) {
  return InitializeDatabase(databaseName, GetTablesFromSchema(schemaName || String(DEFAULT_SCHEMA)));
}
