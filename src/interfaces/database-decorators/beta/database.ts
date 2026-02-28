import { Schema, type SchemaDefinition, type SchemaOptions } from '@ajs/database/beta';
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

export async function CreateDatabaseSchemaInstance(
  schemaId: string,
  instanceId?: string,
  options?: SchemaOptions,
): Promise<void> {
  const tables = getTablesForSchema(schemaId);
  assert(tables, `No tables registered for schema '${schemaId}'`);

  const definition = buildSchemaDefinition(tables);
  const schema = new Schema(schemaId, definition, options);
  await schema.createInstance(instanceId);

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

async function insertAllFixtureData(
  schema: Schema<any>,
  instanceId: string | undefined,
  tables: TableDefinitions,
): Promise<void> {
  await Promise.all(
    Object.entries(tables).map(([tableName, tableClass]) => {
      const metadata = getMetadata(tableClass, DatumStaticMetadata);
      return insertFixtureData(schema, instanceId, tableName, tableClass, metadata.generator);
    }),
  );
}

async function insertFixtureData(
  schema: Schema<any>,
  instanceId: string | undefined,
  tableName: string,
  tableClass: Class<Table>,
  generator: DatumStaticMetadata['generator'],
): Promise<void> {
  if (!generator) {
    return;
  }
  const count = await schema.instance(instanceId).table(tableName).count();
  if (count > 0) {
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
