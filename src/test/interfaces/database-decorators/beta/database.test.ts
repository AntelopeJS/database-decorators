import { expect } from 'chai';
import { CreateDatabaseSchemaInstance } from '@ajs.local/database-decorators/beta/database';
import { Schema } from '@ajs/database/beta';
import { RegisterTable } from '@ajs.local/database-decorators/beta/schema';
import { Table, Index, Fixture } from '@ajs.local/database-decorators/beta/table';

describe('Database - initialization', () => {
  it('creates a schema instance', async () => CreateSchemaInstanceTest());
  it('creates tables with default primary key', async () => CreateTablesWithDefaultPrimaryKeyTest());
  it('creates tables with indexes', async () => CreateTablesWithIndexesTest());
  it('creates tables with grouped indexes', async () => CreateTablesWithGroupedIndexesTest());
  it('creates tables with fixture data', async () => CreateTablesWithFixtureDataTest());
  it('handles multiple tables', async () => HandleMultipleTablesTest());
  it('creates multiple instances for same schema', async () => CreateMultipleInstancesTest());
  it('inserts fixtures for each instance', async () => InsertFixturesForEachInstanceTest());
});

async function CreateSchemaInstanceTest() {
  @RegisterTable('test_table', 'test-new-schema')
  class _TestTable extends Table {
    declare name: string;
  }

  await CreateDatabaseSchemaInstance('test-new-schema', 'test-new-instance');

  const schema = Schema.get('test-new-schema');
  expect(schema).to.not.equal(undefined);
}

async function CreateTablesWithDefaultPrimaryKeyTest() {
  @RegisterTable('pk_table', 'test-pk-schema')
  class _TestTable extends Table {
    declare name: string;
  }

  await CreateDatabaseSchemaInstance('test-pk-schema', 'test-pk-instance');

  const schema = Schema.get('test-pk-schema');
  expect(schema).to.not.equal(undefined);
}

async function CreateTablesWithIndexesTest() {
  @RegisterTable('idx_table', 'test-idx-schema')
  class _TestTable extends Table {
    @Index()
    declare name: string;

    @Index()
    declare email: string;
  }

  await CreateDatabaseSchemaInstance('test-idx-schema', 'test-idx-instance');

  const schema = Schema.get('test-idx-schema');
  expect(schema).to.not.equal(undefined);
}

async function CreateTablesWithGroupedIndexesTest() {
  @RegisterTable('grp_table', 'test-grp-schema')
  class _TestTable extends Table {
    @Index({ group: 'user_search' })
    declare name: string;

    @Index({ group: 'user_search' })
    declare email: string;

    @Index({ group: 'age_range' })
    declare age: number;
  }

  await CreateDatabaseSchemaInstance('test-grp-schema', 'test-grp-instance');

  const schema = Schema.get('test-grp-schema');
  expect(schema).to.not.equal(undefined);
}

async function CreateTablesWithFixtureDataTest() {
  const testData = [
    { id: '1', name: 'Test User 1' },
    { id: '2', name: 'Test User 2' },
  ];

  @Fixture(() => testData)
  @RegisterTable('fixture_table', 'test-fixture-schema')
  class _TestTable extends Table {
    declare name: string;
  }

  await CreateDatabaseSchemaInstance('test-fixture-schema', 'test-fixture-instance');

  const schema = Schema.get('test-fixture-schema')!;
  const result = await schema.instance('test-fixture-instance').table('fixture_table');
  result.forEach((val: any) => delete val._id);
  const sortById = (a: any, b: any) => a.id.localeCompare(b.id);
  expect(result.sort(sortById)).to.deep.equal(testData.sort(sortById));
}

async function HandleMultipleTablesTest() {
  @RegisterTable('users', 'test-multi-table-schema')
  class _UserTable extends Table {
    @Index()
    declare email: string;

    declare name: string;
  }

  @RegisterTable('products', 'test-multi-table-schema')
  class _ProductTable extends Table {
    @Index()
    declare name: string;

    declare price: number;
  }

  await CreateDatabaseSchemaInstance('test-multi-table-schema', 'test-multi-table-instance');

  const schema = Schema.get('test-multi-table-schema');
  expect(schema).to.not.equal(undefined);
}

async function CreateMultipleInstancesTest() {
  @RegisterTable('tenant_table', 'test-multi-instance-schema')
  class _TenantTable extends Table {
    declare name: string;
  }

  await CreateDatabaseSchemaInstance('test-multi-instance-schema', 'tenant-1');
  await CreateDatabaseSchemaInstance('test-multi-instance-schema', 'tenant-2');

  const schema1 = Schema.get('test-multi-instance-schema');
  const schema2 = Schema.get('test-multi-instance-schema');
  expect(schema1).to.not.equal(undefined);
  expect(schema2).to.not.equal(undefined);
  expect(schema1).to.equal(schema2);

  const instance1 = schema1!.instance('tenant-1');
  const instance2 = schema2!.instance('tenant-2');
  expect(instance1).to.not.equal(undefined);
  expect(instance2).to.not.equal(undefined);
}

async function InsertFixturesForEachInstanceTest() {
  const testData = [
    { id: '1', name: 'Fixture 1' },
    { id: '2', name: 'Fixture 2' },
  ];

  @Fixture(() => testData)
  @RegisterTable('fixture_multi', 'test-fixture-multi-schema')
  class _FixtureTable extends Table {
    declare name: string;
  }

  await CreateDatabaseSchemaInstance('test-fixture-multi-schema', 'fixture-inst-1');
  await CreateDatabaseSchemaInstance('test-fixture-multi-schema', 'fixture-inst-2');

  const schema = Schema.get('test-fixture-multi-schema')!;
  const sortById = (a: any, b: any) => a.id.localeCompare(b.id);

  const result1 = await schema.instance('fixture-inst-1').table('fixture_multi');
  result1.forEach((val: any) => delete val._id);
  expect(result1.sort(sortById)).to.deep.equal(testData.sort(sortById));

  const result2 = await schema.instance('fixture-inst-2').table('fixture_multi');
  result2.forEach((val: any) => delete val._id);
  expect(result2.sort(sortById)).to.deep.equal(testData.sort(sortById));
}
