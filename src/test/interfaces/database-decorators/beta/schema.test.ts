import { expect } from 'chai';
import {
  RegisterTable,
  GetTablesFromSchema,
  InitializeDatabaseFromSchema,
  DEFAULT_SCHEMA,
} from '@ajs.local/database-decorators/beta/schema';
import { Table, Index } from '@ajs.local/database-decorators/beta/table';

describe('Schema - database schemas', () => {
  it('registers table in default schema', async () => RegisterTableInDefaultSchemaTest());
  it('registers table in custom schema', async () => RegisterTableInCustomSchemaTest());
  it('registers multiple tables in schema', async () => RegisterMultipleTablesInSchemaTest());
  it('gets tables from default schema', async () => GetTablesFromDefaultSchemaTest());
  it('gets tables from custom schema', async () => GetTablesFromCustomSchemaTest());
  it('returns undefined for non-existent schema', async () => ReturnUndefinedForNonExistentSchemaTest());
  it('initializes database from default schema', async () => InitializeDatabaseFromDefaultSchemaTest());
  it('initializes database from custom schema', async () => InitializeDatabaseFromCustomSchemaTest());
  it('handles empty schema', async () => HandleEmptySchemaTest());
  it('create database with undefined schema', async () => HandleSchemaWithNoTablesTest());
});

async function RegisterTableInDefaultSchemaTest() {
  @RegisterTable('test_table')
  class TestTable extends Table {
    @Index({ primary: true })
    id!: string;

    name!: string;
  }

  const tables = GetTablesFromSchema(String(DEFAULT_SCHEMA));

  expect(tables).to.have.property('test_table');
  expect(tables?.test_table).to.equal(TestTable);
}

async function RegisterTableInCustomSchemaTest() {
  @RegisterTable('test_table', 'custom_schema')
  class TestTable extends Table {
    @Index({ primary: true })
    id!: string;

    name!: string;
  }

  const tables = GetTablesFromSchema('custom_schema');

  expect(tables).to.have.property('test_table');
  expect(tables?.test_table).to.equal(TestTable);
}

async function RegisterMultipleTablesInSchemaTest() {
  @RegisterTable('user_table', 'multi_schema')
  class UserTable extends Table {
    @Index({ primary: true })
    id!: string;

    @Index()
    email!: string;

    name!: string;
  }

  @RegisterTable('product_table', 'multi_schema')
  class ProductTable extends Table {
    @Index({ primary: true })
    id!: string;

    @Index()
    name!: string;

    price!: number;
  }

  const tables = GetTablesFromSchema('multi_schema');

  expect(tables).to.have.property('user_table');
  expect(tables).to.have.property('product_table');
  expect(tables?.user_table).to.equal(UserTable);
  expect(tables?.product_table).to.equal(ProductTable);
}

async function GetTablesFromDefaultSchemaTest() {
  @RegisterTable('default_table')
  class DefaultTable extends Table {
    @Index({ primary: true })
    id!: string;

    name!: string;
  }

  const tables = GetTablesFromSchema(String(DEFAULT_SCHEMA));

  expect(tables).to.have.property('default_table');
  expect(tables?.default_table).to.equal(DefaultTable);
}

async function GetTablesFromCustomSchemaTest() {
  @RegisterTable('custom_table', 'test_schema')
  class CustomTable extends Table {
    @Index({ primary: true })
    id!: string;

    name!: string;
  }

  const tables = GetTablesFromSchema('test_schema');

  expect(tables).to.have.property('custom_table');
  expect(tables?.custom_table).to.equal(CustomTable);
}

async function ReturnUndefinedForNonExistentSchemaTest() {
  const tables = GetTablesFromSchema('non_existent_schema');

  expect(tables).to.equal(undefined);
}

async function InitializeDatabaseFromDefaultSchemaTest() {
  @RegisterTable('schema_table')
  class _SchemaTable extends Table {
    @Index({ primary: true })
    id!: string;

    name!: string;
  }

  const databaseName = 'test-schema-db';
  const initInfo = await InitializeDatabaseFromSchema(databaseName);

  expect(initInfo).to.have.property('databaseStatus');
  expect(initInfo).to.have.property('tablesStatus');
  expect(initInfo).to.have.property('oldTables');
}

async function InitializeDatabaseFromCustomSchemaTest() {
  @RegisterTable('custom_schema_table', 'custom_schema')
  class _CustomSchemaTable extends Table {
    @Index({ primary: true })
    id!: string;

    name!: string;
  }

  const databaseName = 'test-custom-schema-db';
  const schemaName = 'custom_schema';
  const initInfo = await InitializeDatabaseFromSchema(databaseName, schemaName);

  expect(initInfo).to.have.property('databaseStatus');
  expect(initInfo).to.have.property('tablesStatus');
  expect(initInfo).to.have.property('oldTables');
}

async function HandleEmptySchemaTest() {
  const databaseName = 'test-empty-schema-db';
  const schemaName = 'empty_schema';

  try {
    const initInfo = await InitializeDatabaseFromSchema(databaseName, schemaName);
    expect(initInfo).to.have.property('databaseStatus');
    expect(initInfo).to.have.property('tablesStatus').that.deep.equals({});
    expect(initInfo).to.have.property('oldTables').that.is.an('array');
  } catch (error) {
    expect(error).to.be.instanceOf(Error);
  }
}

async function HandleSchemaWithNoTablesTest() {
  const databaseName = 'test-no-tables-schema-db';
  const schemaName = 'no_tables_schema';

  const initInfo = await InitializeDatabaseFromSchema(databaseName, schemaName);

  expect(initInfo).to.have.property('databaseStatus');
  expect(initInfo).to.have.property('tablesStatus').that.deep.equals({});
  expect(initInfo).to.have.property('oldTables').that.is.an('array');

  expect(initInfo.databaseStatus).to.equal('created');
  expect(initInfo.tablesStatus).to.deep.equal({});
  expect(initInfo.oldTables).to.deep.equal([]);
}
