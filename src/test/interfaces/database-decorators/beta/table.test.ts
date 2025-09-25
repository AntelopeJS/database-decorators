import { expect } from 'chai';
import { Table, Index, Fixture, TableMetaSymbol, TableRefSymbol } from '@ajs.local/database-decorators/beta/table';
import { DatumStaticMetadata, getMetadata } from '@ajs.local/database-decorators/beta/common';
import { MixinSymbol } from '@ajs.local/database-decorators/beta/modifiers/common';

describe('Table - decorators', () => {
  it('creates table with primary index', async () => CreateTableWithPrimaryIndexTest());
  it('creates table with multiple indexes', async () => CreateTableWithMultipleIndexesTest());
  it('creates table with grouped indexes', async () => CreateTableWithGroupedIndexesTest());
  it('creates table with fixture data', async () => CreateTableWithFixtureDataTest());
  it('combines table with mixins', async () => CombineTableWithMixinsTest());
});

async function CreateTableWithPrimaryIndexTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    id!: string;

    @Index()
    name!: string;
  }

  const metadata = getMetadata(TestTable, DatumStaticMetadata);

  expect(metadata.primary).to.equal('id');
  expect(metadata.indexes.name).to.deep.equal(['name']);
}

async function CreateTableWithMultipleIndexesTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    id!: string;

    @Index()
    email!: string;

    @Index()
    age!: number;
  }

  const metadata = getMetadata(TestTable, DatumStaticMetadata);

  expect(metadata.primary).to.equal('id');
  expect(metadata.indexes.email).to.deep.equal(['email']);
  expect(metadata.indexes.age).to.deep.equal(['age']);
}

async function CreateTableWithGroupedIndexesTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    id!: string;

    @Index({ group: 'user_search' })
    name!: string;

    @Index({ group: 'user_search' })
    email!: string;

    @Index({ group: 'age_range' })
    age!: number;
  }

  const metadata = getMetadata(TestTable, DatumStaticMetadata);

  expect(metadata.primary).to.equal('id');
  expect(metadata.indexes.user_search).to.deep.equal(['name', 'email']);
  expect(metadata.indexes.age_range).to.deep.equal(['age']);
}

async function CreateTableWithFixtureDataTest() {
  const testData = [
    { id: '1', name: 'Test User 1' },
    { id: '2', name: 'Test User 2' },
  ];

  @Fixture(() => testData)
  class TestTable extends Table {
    @Index({ primary: true })
    id!: string;

    name!: string;
  }

  const metadata = getMetadata(TestTable, DatumStaticMetadata);

  expect(metadata.generator).to.be.a('function');
  expect(metadata.primary).to.equal('id');
}

async function CombineTableWithMixinsTest() {
  class TestMixin {
    testMethodUnunvailable() {
      return 'This method should be undefined';
    }

    [MixinSymbol] = class {
      testMethod() {
        return 'mixin method ok';
      }
    };
  }

  class TestTable extends Table.with(TestMixin) {
    @Index({ primary: true })
    id!: string;

    name!: string;
  }

  const instance = new TestTable();
  expect(instance).to.have.property('testMethod');
  expect(instance.testMethod()).to.equal('mixin method ok');
  expect(instance).to.not.have.property('testMethodUnunvailable');
  expect(instance).to.have.property('id');
  expect(instance).to.have.property('name');
  expect(instance).to.be.instanceOf(TestTable);
}
