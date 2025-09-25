import { expect } from 'chai';
import { BasicDataModel, GetModel, StaticModel, DynamicModel } from '@ajs.local/database-decorators/beta/model';
import { Table, Index } from '@ajs.local/database-decorators/beta/table';
import { Controller, Get, RequestContext } from '@ajs/api/beta';

describe('Model - data operations', () => {
  it('creates basic data model', async () => CreateBasicDataModelTest());
  it('converts plain data to table instance', async () => ConvertPlainDataToTableTest());
  it('converts database data to table instance', async () => ConvertDatabaseDataToTableTest());
  it('converts table instance to database data', async () => ConvertTableToDatabaseDataTest());
  it('handles null database data', async () => HandleNullDatabaseDataTest());
  it('gets model from cache', async () => GetModelFromCacheTest());
  it('creates new model when not cached', async () => CreateNewModelWhenNotCachedTest());
  it('handles static model decorator', async () => HandleStaticModelDecoratorTest());
  it('handles dynamic model decorator', async () => HandleDynamicModelDecoratorTest());
});

async function CreateBasicDataModelTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    id!: string;

    name!: string;
    age!: number;
  }

  const TestModel = BasicDataModel(TestTable, 'test_table');

  expect(TestModel).to.be.a('function');
  expect(TestModel.name).to.equal('Model');
}

async function ConvertPlainDataToTableTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    id!: string;

    name!: string;
    age!: number;
  }

  const TestModel = BasicDataModel(TestTable, 'test_table');
  const plainData = { id: '1', name: 'John', age: 30 };
  const instance = TestModel.fromPlainData(plainData);

  expect(instance).to.be.instanceOf(TestTable);
  expect(instance.id).to.equal('1');
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
    @Index({ primary: true })
    id!: string;

    name!: string;
    age!: number;
  }

  const TestModel = BasicDataModel(TestTable, 'test_table');
  const instance = new TestTable();
  instance.id = '1';
  instance.name = 'John';
  instance.age = 30;

  const dbData = TestModel.toDatabase(instance);

  expect(dbData.id).to.equal('1');
  expect(dbData.name).to.equal('John');
  expect(dbData.age).to.equal(30);
}

async function HandleNullDatabaseDataTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    id!: string;

    name!: string;
  }

  const TestModel = BasicDataModel(TestTable, 'test_table');
  const instance = TestModel.fromDatabase(null);

  expect(instance).to.equal(undefined);
}

async function GetModelFromCacheTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    id!: string;

    name!: string;
  }

  const TestModel = BasicDataModel(TestTable, 'test_table');

  const model1 = GetModel(TestModel, 'test-db');
  const model2 = GetModel(TestModel, 'test-db');

  expect(model1).to.equal(model2);
  expect(model1).to.be.instanceOf(TestModel);
}

async function CreateNewModelWhenNotCachedTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    id!: string;

    name!: string;
  }

  const TestModel = BasicDataModel(TestTable, 'test_table');

  const model1 = GetModel(TestModel, 'db1');
  const model2 = GetModel(TestModel, 'db2');

  expect(model1).to.not.equal(model2);
  expect(model1).to.be.instanceOf(TestModel);
  expect(model2).to.be.instanceOf(TestModel);
}

async function HandleStaticModelDecoratorTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    id!: string;
    name!: string;
  }
  const TestModel = BasicDataModel(TestTable, 'test_table');
  class _TestService extends Controller('/staticmodel') {
    @StaticModel(TestModel, 'test-db')
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

async function HandleDynamicModelDecoratorTest() {
  class TestTable extends Table {
    @Index({ primary: true })
    id!: string;
    name!: string;
  }
  const TestModel = BasicDataModel(TestTable, 'test_table');
  class _TestService extends Controller('/dynamicmodel/:database') {
    @DynamicModel(TestModel, (ctx: RequestContext) => ctx.routeParameters.database)
    model!: InstanceType<typeof TestModel>;

    @Get('/')
    callback() {
      expect('model' in this).to.equal(true);
      expect(this.model).to.be.instanceOf(TestModel);
    }
  }

  const res = await fetch('http://localhost:5010/dynamicmodel/test-db');
  expect(res.status, res.statusText).to.equal(200);
}
