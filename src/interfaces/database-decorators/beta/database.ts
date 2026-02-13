import { CreateDatabase, Database, ListDatabases } from '@ajs/database/beta';
import { Class } from '@ajs/core/beta/decorators';
import { Table } from './table';
import { DatumGeneratorOutput, DatumStaticMetadata, getMetadata } from './common';
import { fromPlainData, toDatabase, triggerEvent } from './modifiers/common';

export type Status = 'created' | 'unchanged';

export interface InitInfo {
  databaseStatus: Status;
  tablesStatus: Record<string, Status>;
  oldTables: string[];
}

type TableDefinitions = Record<string, Class<Table>>;
type TableEntry = Record<string, unknown>;
type DatabaseInstance = ReturnType<typeof Database>;

const CreatedStatus: Status = 'created';
const UnchangedStatus: Status = 'unchanged';

interface TableInitializationContext {
  database: DatabaseInstance;
  tableName: string;
  tableClass: Class<Table>;
  tableList: string[];
  initInfo: InitInfo;
}

export async function InitializeDatabase(
  databaseName: string,
  tables: TableDefinitions,
): Promise<InitInfo> {
  const initInfo = createInitInfo();
  const database = await ensureDatabaseExists(databaseName, initInfo);
  const tableList = await database.tableList();
  await Promise.all(
    Object.entries(tables).map(([tableName, tableClass]) =>
      initializeTable({
        database,
        tableName,
        tableClass,
        tableList,
        initInfo,
      }),
    ),
  );
  initInfo.oldTables = tableList.filter((tableName) => !(tableName in tables));
  return initInfo;
}

function createInitInfo(): InitInfo {
  return { databaseStatus: CreatedStatus, tablesStatus: {}, oldTables: [] };
}

async function ensureDatabaseExists(databaseName: string, initInfo: InitInfo): Promise<DatabaseInstance> {
  const databases = await ListDatabases();
  if (!databases.includes(databaseName)) {
    await CreateDatabase(databaseName);
    return Database(databaseName);
  }
  initInfo.databaseStatus = UnchangedStatus;
  return Database(databaseName);
}

async function initializeTable(context: TableInitializationContext): Promise<void> {
  const metadata = getMetadata(context.tableClass, DatumStaticMetadata);
  await createTableIfMissing(context, metadata);
  await createMissingIndexes(context.database, context.tableName, metadata);
}

async function createTableIfMissing(context: TableInitializationContext, metadata: DatumStaticMetadata): Promise<void> {
  if (context.tableList.includes(context.tableName)) {
    context.initInfo.tablesStatus[context.tableName] = UnchangedStatus;
    return;
  }
  context.initInfo.tablesStatus[context.tableName] = CreatedStatus;
  await context.database.tableCreate(context.tableName, { primary: metadata.primary });
  await insertFixtureData(context.database, context.tableName, context.tableClass, metadata.generator);
}

async function insertFixtureData(
  database: DatabaseInstance,
  tableName: string,
  tableClass: Class<Table>,
  generator: DatumStaticMetadata['generator'],
): Promise<void> {
  if (!generator) {
    return;
  }
  const fixtureData = await generator(tableClass);
  const rows = toFixtureRows(fixtureData, tableClass);
  if (rows.length === 0) {
    return;
  }
  await database.table(tableName).insert(rows.length === 1 ? rows[0] : rows);
}

function toFixtureRows(fixtureData: DatumGeneratorOutput, tableClass: Class<Table>): TableEntry[] {
  const entries = fixtureData ? (Array.isArray(fixtureData) ? fixtureData : [fixtureData]) : [];
  return entries.filter(isTableEntry).map((entry) => {
    const instance = fromPlainData(entry, tableClass);
    triggerEvent(instance, 'insert');
    return toDatabase(instance) as TableEntry;
  });
}

function isTableEntry(value: unknown): value is TableEntry {
  return typeof value === 'object' && value !== null;
}

async function createMissingIndexes(
  database: DatabaseInstance,
  tableName: string,
  metadata: DatumStaticMetadata,
): Promise<void> {
  const indexes = await database.table(tableName).indexList();
  await Promise.all(
    Object.entries(metadata.indexes).map(([group, fields]) => {
      if (indexes.includes(group)) {
        return Promise.resolve();
      }
      return createIndex(database, tableName, group, fields);
    }),
  );
}

function createIndex(database: DatabaseInstance, tableName: string, group: string, fields: string[]): Promise<void> {
  if (fields.length === 1 && fields[0] === group) {
    return database.table(tableName).indexCreate(group);
  }
  return database.table(tableName).indexCreate(group, ...fields);
}
