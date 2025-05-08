import { CreateDatabase, Database, ListDatabases } from '@ajs/database/beta';
import { Table } from './table';
import { DatumStaticMetadata, getMetadata } from './common';

export type Status = 'created' | 'unchanged';

export interface InitInfo {
  /** Database creation status. */
  databaseStatus: Status;
  /** Tables creation status. */
  tablesStatus: Record<string, Status>;
  /** Pre-existing tables that are no longer used. */
  oldTables: string[];
}

/**
 * Initializes a database with the given name and tables.
 *
 * @param databaseName Database name
 * @param tables Table class list
 * @returns Initialization result
 */
export async function InitializeDatabase(databaseName: string, tables: Record<string, Table>): Promise<InitInfo> {
  const initInfo: InitInfo = { databaseStatus: 'created', tablesStatus: {}, oldTables: [] };

  const databases = await ListDatabases();

  if (databases.includes(databaseName)) {
    initInfo.databaseStatus = 'unchanged';
  } else {
    await CreateDatabase(databaseName);
  }

  const database = Database(databaseName);
  const tableList = await database.tableList();

  await Promise.all(
    Object.entries(tables).map(async ([tableName, table]) => {
      const metadata = getMetadata(table, DatumStaticMetadata);

      if (tableList.includes(tableName)) {
        initInfo.tablesStatus[tableName] = 'unchanged';
      } else {
        initInfo.tablesStatus[tableName] = 'created';
        await database.tableCreate(tableName, { primary: metadata.primary });
        if (metadata.generator) {
          const toInsert = await metadata.generator(table);
          if (toInsert) {
            await database.table(tableName).insert(toInsert);
          }
        }
      }

      const indexes = await database.table(tableName).indexList();

      await Promise.all(
        Object.entries(metadata.indexes).map(async ([group, fields]) => {
          if (indexes.includes(group)) return;
          if (fields.length === 1 && fields[0] === group) {
            await database.table(tableName).indexCreate(group);
          } else {
            await database.table(tableName).indexCreate(group, ...fields);
          }
        }),
      );
    }),
  );

  initInfo.oldTables = tableList.filter((tableName) => !(tableName in tables));

  return initInfo;
}
