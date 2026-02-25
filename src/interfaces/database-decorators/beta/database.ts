import { Schema, type SchemaDefinition } from '@ajs/database/beta';
import type { IndexDefinition } from '@ajs/database/beta/schema';
import { Class } from '@ajs/core/beta/decorators';
import { Table } from './table';
import { DatumStaticMetadata, getMetadata } from './common';
import { fromPlainData, toDatabase, triggerEvent } from './modifiers/common';
import type { DatumGeneratorOutput } from './common';
import { getTablesForSchema } from './schema';
import assert from 'assert';

type TableDefinitions = Record<string, Class<Table>>;
type TableEntry = Record<string, unknown>;

const schemaStore = new Map<string, Schema<any>>();
const instanceSchemaMap = new Map<string, string>();

export function getSchemaForInstance(instanceId: string): Schema<any> | undefined {
  const schemaId = instanceSchemaMap.get(instanceId);
  if (!schemaId) return undefined;
  return schemaStore.get(schemaId);
}

function getOrCreateSchema(schemaId: string): Schema<any> {
  const existing = schemaStore.get(schemaId);
  if (existing) return existing;

  const tables = getTablesForSchema(schemaId);
  assert(tables, `No tables registered for schema '${schemaId}'`);

  const definition = buildSchemaDefinition(tables);
  const schema = new Schema(schemaId, definition);
  schemaStore.set(schemaId, schema);
  return schema;
}

export async function CreateDatabaseSchemaInstance(schemaId: string, instanceId: string): Promise<void> {
  const schema = getOrCreateSchema(schemaId);
  await schema.createInstance(instanceId);
  instanceSchemaMap.set(instanceId, schemaId);

  const tables = getTablesForSchema(schemaId);
  assert(tables, `No tables registered for schema '${schemaId}'`);
  await insertAllFixtureData(schema, instanceId, tables);
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

async function insertAllFixtureData(schema: Schema<any>, instanceId: string, tables: TableDefinitions): Promise<void> {
  await Promise.all(
    Object.entries(tables).map(([tableName, tableClass]) => {
      const metadata = getMetadata(tableClass, DatumStaticMetadata);
      return insertFixtureData(schema, instanceId, tableName, tableClass, metadata.generator);
    }),
  );
}

async function insertFixtureData(
  schema: Schema<any>,
  instanceId: string,
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
  await schema.instance(instanceId).table(tableName).insert(payload);
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
