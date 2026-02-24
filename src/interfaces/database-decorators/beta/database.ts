import { Schema, type SchemaDefinition } from '@ajs/database/beta';
import type { IndexDefinition } from '@ajs/database/beta/schema';
import { Class } from '@ajs/core/beta/decorators';
import { Table } from './table';
import { DatumStaticMetadata, getMetadata } from './common';
import { fromPlainData, toDatabase, triggerEvent } from './modifiers/common';
import type { DatumGeneratorOutput } from './common';

export type Status = 'created' | 'unchanged';

export interface InitInfo {
  databaseStatus: Status;
  tablesStatus: Record<string, Status>;
  oldTables: string[];
}

type TableDefinitions = Record<string, Class<Table>>;
type TableEntry = Record<string, unknown>;

const CreatedStatus: Status = 'created';

const schemaStore = new Map<string, Schema<any>>();

export function getSchemaForDatabase(databaseName: string): Schema<any> | undefined {
  return schemaStore.get(databaseName);
}

export async function InitializeDatabase(databaseName: string, tables: TableDefinitions): Promise<InitInfo> {
  const definition = buildSchemaDefinition(tables);
  const schema = new Schema(databaseName, definition);
  schemaStore.set(databaseName, schema);
  await schema.createInstance(databaseName);
  await insertAllFixtureData(schema, databaseName, tables);
  return buildInitInfo(tables);
}

function buildSchemaDefinition(tables: TableDefinitions): SchemaDefinition {
  const definition: SchemaDefinition = {};
  for (const [tableName, tableClass] of Object.entries(tables)) {
    const metadata = getMetadata(tableClass, DatumStaticMetadata);
    const indexes: Record<string, IndexDefinition> = {};
    for (const [group, fields] of Object.entries(metadata.indexes)) {
      indexes[group] = {
        fields: fields.length === 1 && fields[0] === group ? undefined : fields,
      };
    }
    definition[tableName] = { fields: {}, indexes };
  }
  return definition;
}

async function insertAllFixtureData(
  schema: Schema<any>,
  databaseName: string,
  tables: TableDefinitions,
): Promise<void> {
  await Promise.all(
    Object.entries(tables).map(([tableName, tableClass]) => {
      const metadata = getMetadata(tableClass, DatumStaticMetadata);
      return insertFixtureData(schema, databaseName, tableName, tableClass, metadata.generator);
    }),
  );
}

async function insertFixtureData(
  schema: Schema<any>,
  databaseName: string,
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
  const payload: any = rows.length === 1 ? rows[0] : rows;
  await schema.instance(databaseName).table(tableName).insert(payload);
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

function buildInitInfo(tables: TableDefinitions): InitInfo {
  const tablesStatus: Record<string, Status> = {};
  for (const tableName of Object.keys(tables)) {
    tablesStatus[tableName] = CreatedStatus;
  }
  return { databaseStatus: CreatedStatus, tablesStatus, oldTables: [] };
}
