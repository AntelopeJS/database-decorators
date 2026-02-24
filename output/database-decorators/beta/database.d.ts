import { Schema } from '@ajs/database/beta';
import { Class } from '@ajs/core/beta/decorators';
import { Table } from './table';
export type Status = 'created' | 'unchanged';
export interface InitInfo {
    databaseStatus: Status;
    tablesStatus: Record<string, Status>;
    oldTables: string[];
}
type TableDefinitions = Record<string, Class<Table>>;
export declare function getSchemaForDatabase(databaseName: string): Schema<any> | undefined;
export declare function InitializeDatabase(databaseName: string, tables: TableDefinitions): Promise<InitInfo>;
export {};
