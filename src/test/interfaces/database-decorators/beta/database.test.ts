import { expect } from 'chai';
import { InitializeDatabase } from '@ajs.local/database-decorators/beta/database';
import { Table, Index, Fixture } from '@ajs.local/database-decorators/beta/table';
import { CreateDatabase, Database, ListDatabases } from '@ajs/database/beta';

describe('Database - initialization', () => {
  it('initializes new database', async () => InitializeNewDatabaseTest());
  it('handles existing database', async () => HandleExistingDatabaseTest());
  it('creates tables with primary keys', async () => CreateTablesWithPrimaryKeysTest());
  it('creates tables with indexes', async () => CreateTablesWithIndexesTest());
  it('creates tables with grouped indexes', async () => CreateTablesWithGroupedIndexesTest());
  it('creates tables with fixture data', async () => CreateTablesWithFixtureDataTest());
  it('handles multiple tables', async () => HandleMultipleTablesTest());
  it('returns correct status information', async () => ReturnCorrectStatusInformationTest());
  it('handles empty table list', async () => HandleEmptyTableListTest());
});

async function InitializeNewDatabaseTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    declare id: string;

    declare name: string;
  }

  const tables = { test_table: TestTable };
  const databaseName = 'test-new-database';

  const initInfo = await InitializeDatabase(databaseName, tables);

  expect(initInfo).to.have.property('databaseStatus');
  expect(initInfo).to.have.property('tablesStatus');
  expect(initInfo).to.have.property('oldTables');

  expect(await ListDatabases()).to.contain(databaseName);
  expect(await Database(databaseName).tableList()).to.deep.equal(Object.keys(tables));
}

async function HandleExistingDatabaseTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    declare id: string;

    declare name: string;
  }

  const tables = { test_table: TestTable };
  const databaseName = 'test-existing-database';

  await CreateDatabase(databaseName);
  await Database(databaseName).tableCreate('old_table');

  const initInfo = await InitializeDatabase(databaseName, tables);

  expect(initInfo).to.have.property('databaseStatus');
  expect(initInfo).to.have.property('tablesStatus');
  expect(initInfo).to.have.property('oldTables').that.contains('old_table');
}

async function CreateTablesWithPrimaryKeysTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    declare id: string;

    declare name: string;
  }

  const tables = { test_table: TestTable };
  const databaseName = 'test-primary-keys';

  const initInfo = await InitializeDatabase(databaseName, tables);

  expect(initInfo).to.have.property('tablesStatus');
  expect(initInfo).to.have.property('tablesStatus').that.has.property('test_table');
}

async function CreateTablesWithIndexesTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    declare id: string;

    @Index()
    declare name: string;

    @Index()
    declare email: string;
  }

  const tables = { test_table: TestTable };
  const databaseName = 'test-indexes';

  await InitializeDatabase(databaseName, tables);
  
  expect(await Database(databaseName).table('test_table').indexList()).to.include.members(['name', 'email']);
}

async function CreateTablesWithGroupedIndexesTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    declare id: string;

    @Index({ group: 'user_search' })
    declare name: string;

    @Index({ group: 'user_search' })
    declare email: string;

    @Index({ group: 'age_range' })
    declare age: number;
  }

  const tables = { test_table: TestTable };
  const databaseName = 'test-grouped-indexes';

  await InitializeDatabase(databaseName, tables);

  expect(await Database(databaseName).table('test_table').indexList()).to.include.members(['user_search', 'age_range']);
}

async function CreateTablesWithFixtureDataTest() {
  const testData = [
    { id: '1', name: 'Test User 1' },
    { id: '2', name: 'Test User 2' },
  ];

  @Fixture(() => testData)
  class TestTable extends Table {
    @Index({ primary: true })
    declare id: string;

    declare name: string;
  }

  const tables = { test_table: TestTable };
  const databaseName = 'test-fixture-data';

  await InitializeDatabase(databaseName, tables);

  const result = await Database(databaseName).table('test_table');
  result.forEach(val => delete val._id);
  expect(result).to.deep.equal(testData);
}

async function HandleMultipleTablesTest() {
  class UserTable extends Table {
    @Index({ primary: true })
    declare id: string;

    @Index()
    declare email: string;

    declare name: string;
  }

  class ProductTable extends Table {
    @Index({ primary: true })
    declare id: string;

    @Index()
    declare name: string;

    declare price: number;
  }

  const tables = {
    users: UserTable,
    products: ProductTable,
  };
  const databaseName = 'test-multiple-tables';

  const initInfo = await InitializeDatabase(databaseName, tables);

  expect(initInfo).to.have.property('tablesStatus').that.contains.keys('users', 'products');
}

async function ReturnCorrectStatusInformationTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    declare id: string;

    declare name: string;
  }

  const tables = { test_table: TestTable };
  const databaseName = 'test-status-info';

  const initInfo = await InitializeDatabase(databaseName, tables);

  expect(initInfo).to.have.property('databaseStatus').that.is.oneOf(['created', 'unchanged']);
  expect(initInfo).to.have.property('tablesStatus').that.is.an('object');
  expect(initInfo).to.have.property('oldTables').that.is.an('array');
}

async function HandleEmptyTableListTest() {
  const tables = {};
  const databaseName = 'test-empty-tables';

  const initInfo = await InitializeDatabase(databaseName, tables);

  expect(initInfo).to.have.property('databaseStatus');
  expect(initInfo).to.have.property('tablesStatus').that.deep.equals({});
  expect(initInfo).to.have.property('oldTables').that.is.an('array');
}
