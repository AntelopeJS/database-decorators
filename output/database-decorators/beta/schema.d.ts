import { ClassDecorator, Class } from '@ajs/core/beta/decorators';
import { Table } from './table';
export declare const RegisterTable: (tableName: string, schemaName: string) => ClassDecorator<typeof Table>;
export declare function getTablesForSchema(schemaName: string): Record<string, Class<Table>> | undefined;
