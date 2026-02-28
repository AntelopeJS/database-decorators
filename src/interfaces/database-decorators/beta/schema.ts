import { MakeClassDecorator, ClassDecorator, Class } from '@ajs/core/beta/decorators';
import { Table } from './table';
import { DatumStaticMetadata, getMetadata } from './common';

const schemaTableRegistry: Record<string, Record<string, Class<Table>>> = {};

export const RegisterTable: (tableName: string, schemaName: string) => ClassDecorator<typeof Table> =
  MakeClassDecorator((target, tableName: string, schemaName: string) => {
    const metadata = getMetadata(target, DatumStaticMetadata);
    metadata.tableName = tableName;
    metadata.schemaName = schemaName;

    if (!(schemaName in schemaTableRegistry)) {
      schemaTableRegistry[schemaName] = {};
    }
    schemaTableRegistry[schemaName][tableName] = target as unknown as Class<Table>;
  });

export function getTablesForSchema(schemaName: string): Record<string, Class<Table>> | undefined {
  return schemaTableRegistry[schemaName];
}
