import { expect } from 'chai';
import { BasicDataModel, GetModel, Model } from '@ajs.local/database-decorators/beta/model';
import { Table } from '@ajs.local/database-decorators/beta/table';
import { RegisterTable } from '@ajs.local/database-decorators/beta/schema';
import { CreateDatabaseSchemaInstance } from '@ajs.local/database-decorators/beta/database';
import { Controller, Get, RequestContext } from '@ajs/api/beta';

describe('Model - data operations', () => {
  it('creates basic data model', async () => CreateBasicDataModelTest());
  it('creates basic data model from metadata', async () => CreateBasicDataModelFromMetadataTest());
  it('converts plain data to table instance', async () => ConvertPlainDataToTableTest());
  it('converts database data to table instance', async () => ConvertDatabaseDataToTableTest());
  it('converts table instance to database data', async () => ConvertTableToDatabaseDataTest());
  it('handles null database data', async () => HandleNullDatabaseDataTest());
  it('gets model from cache', async () => GetModelFromCacheTest());
  it('creates new model when not cached', async () => CreateNewModelWhenNotCachedTest());
  it('handles model with string instance id', async () => HandleModelWithStringInstanceIdTest());
  it('handles model with callback instance id', async () => HandleModelWithCallbackInstanceIdTest());
});

async function CreateBasicDataModelTest() {
  class TestTable extends Table {
    name!: string;
    age!: number;
  }

  const TestModel = BasicDataModel(TestTable, 'test_table');

  expect(TestModel).to.be.a('function');
  expect(TestModel.name).to.equal('Model');
}

async function CreateBasicDataModelFromMetadataTest() {
  @RegisterTable('meta_table', 'model-meta-schema')
  class TestTable extends Table {
    name!: string;
  }

  const TestModel = BasicDataModel(TestTable);

  expect(TestModel).to.be.a('function');
  expect(TestModel.name).to.equal('Model');
}

async function ConvertPlainDataToTableTest() {
  class TestTable extends Table {
    name!: string;
    age!: number;
  }

  const TestModel = BasicDataModel(TestTable, 'test_table');
  const plainData = { _id: '1', name: 'John', age: 30 };
  const instance = TestModel.fromPlainData(plainData);

  expect(instance).to.be.instanceOf(TestTable);
  expect(instance._id).to.equal('1');
  expect(instance.name).to.equal('John');
  expect(instance.age).to.equal(30);
}

async function ConvertDatabaseDataToTableTest() {
  class TestTable extends Table {
    name!: string;
    age!: number;
  }

  const TestModel = BasicDataModel(TestTable, 'test_table');
  const dbData = { _id: '123', name: 'John', age: 30 };
  const instance = TestModel.fromDatabase(dbData);

  expect(instance).to.be.instanceOf(TestTable);
  expect(instance?.name).to.equal('John');
  expect(instance?.age).to.equal(30);
}

async function ConvertTableToDatabaseDataTest() {
  class TestTable extends Table {
    name!: string;
    age!: number;
  }

  const TestModel = BasicDataModel(TestTable, 'test_table');
  const instance = new TestTable();
  instance._id = '1';
  instance.name = 'John';
  instance.age = 30;

  const dbData = TestModel.toDatabase(instance);

  expect(dbData._id).to.equal('1');
  expect(dbData.name).to.equal('John');
  expect(dbData.age).to.equal(30);
}

async function HandleNullDatabaseDataTest() {
  class TestTable extends Table {
    name!: string;
  }

  const TestModel = BasicDataModel(TestTable, 'test_table');
  const instance = TestModel.fromDatabase(null);

  expect(instance).to.equal(undefined);
}

async function GetModelFromCacheTest() {
  @RegisterTable('cache_table', 'model-cache-schema')
  class TestTable extends Table {
    name!: string;
  }

  const TestModel = BasicDataModel(TestTable, 'cache_table');

  await CreateDatabaseSchemaInstance('model-cache-schema', 'test-model-cache-db');

  const model1 = GetModel(TestModel, 'test-model-cache-db');
  const model2 = GetModel(TestModel, 'test-model-cache-db');

  expect(model1).to.equal(model2);
  expect(model1).to.be.instanceOf(TestModel);
}

async function CreateNewModelWhenNotCachedTest() {
  @RegisterTable('nocache_table', 'model-nocache-schema')
  class TestTable extends Table {
    name!: string;
  }

  const TestModel = BasicDataModel(TestTable, 'nocache_table');

  await CreateDatabaseSchemaInstance('model-nocache-schema', 'model-db1');
  await CreateDatabaseSchemaInstance('model-nocache-schema', 'model-db2');

  const model1 = GetModel(TestModel, 'model-db1');
  const model2 = GetModel(TestModel, 'model-db2');

  expect(model1).to.not.equal(model2);
  expect(model1).to.be.instanceOf(TestModel);
  expect(model2).to.be.instanceOf(TestModel);
}

async function HandleModelWithStringInstanceIdTest() {
  @RegisterTable('static_table', 'model-static-schema')
  class TestTable extends Table {
    name!: string;
  }
  const TestModel = BasicDataModel(TestTable, 'static_table');
  await CreateDatabaseSchemaInstance('model-static-schema', 'test-static-model-db');
  class _TestService extends Controller('/staticmodel') {
    @Model(TestModel, 'test-static-model-db')
    model!: InstanceType<typeof TestModel>;

    @Get('/')
    callback() {
      expect('model' in this).to.equal(true);
      expect(this.model).to.be.instanceOf(TestModel);
    }
  }

  const res = await fetch('http://localhost:5010/staticmodel');
  expect(res.status, res.statusText).to.equal(200);
}

async function HandleModelWithCallbackInstanceIdTest() {
  @RegisterTable('dynamic_table', 'model-dynamic-schema')
  class TestTable extends Table {
    name!: string;
  }
  const TestModel = BasicDataModel(TestTable, 'dynamic_table');
  await CreateDatabaseSchemaInstance('model-dynamic-schema', 'test-dynamic-model-db');
  class _TestService extends Controller('/dynamicmodel/:database') {
    @Model(TestModel, (ctx: RequestContext) => ctx.routeParameters.database)
    model!: InstanceType<typeof TestModel>;

    @Get('/')
    callback() {
      expect('model' in this).to.equal(true);
      expect(this.model).to.be.instanceOf(TestModel);
    }
  }

  const res = await fetch('http://localhost:5010/dynamicmodel/test-dynamic-model-db');
  expect(res.status, res.statusText).to.equal(200);
}
