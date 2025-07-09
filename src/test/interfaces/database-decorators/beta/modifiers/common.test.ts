import { expect } from 'chai';
import {
  attachModifier,
  ContainerModifier,
  fromDatabase,
  fromPlainData,
  getModifiedFields,
  lock,
  Modifier,
  OneWayModifier,
  testValue,
  toDatabase,
  toPlainData,
  TwoWayModifier,
  unlock,
} from '@ajs.local/database-decorators/beta/modifiers/common';
import { Table } from '@ajs.local/database-decorators/beta/table';

describe('Modifiers - common', () => {
  it('creates basic modifier', async () => CreateBasicModifierTest());
  it('creates one way modifier', async () => CreateOneWayModifierTest());
  it('creates two way modifier', async () => CreateTwoWayModifierTest());
  it('creates container modifier', async () => CreateContainerModifierTest());
  it('attaches modifier to table', async () => AttachModifierToTableTest());
  it('converts plain data to table instance', async () => ConvertPlainDataToTableTest());
  it('converts table instance to plain data', async () => ConvertTableToPlainDataTest());
  it('converts database data to table instance', async () => ConvertDatabaseDataToTableTest());
  it('converts table instance to database data', async () => ConvertTableToDatabaseDataTest());
  it('unlocks modifier fields', async () => UnlockModifierFieldsTest());
  it('locks modifier fields', async () => LockModifierFieldsTest());
  it('tests value against modifier', async () => TestValueAgainstModifierTest());
  it('gets modified fields', async () => GetModifiedFieldsTest());
});

interface TestMeta {
  test: string;
}

interface TestOptions {
  option: number;
}

async function CreateBasicModifierTest() {
  class TestModifier extends Modifier<TestMeta, TestOptions> {
    constructor() {
      super();
      this.meta = { test: 'value' };
      this.options = { option: 42 };
    }

    public getMeta(): TestMeta {
      return this.meta;
    }

    public getOptions(): TestOptions {
      return this.options;
    }
  }

  const modifier = new TestModifier();

  expect(modifier.getMeta().test).to.equal('value');
  expect(modifier.getOptions().option).to.equal(42);
}

interface OneWayMeta {
  count: number;
}

interface OneWayOptions {
  prefix: string;
}

async function CreateOneWayModifierTest() {
  class TestOneWayModifier extends OneWayModifier<string, [string], OneWayMeta, OneWayOptions> {
    public lock(lockedValue: string | undefined, value: unknown, prefix: string): string {
      return `${prefix}_${String(value)}`;
    }

    public test(lockedValue: string, value: unknown, prefix: string): boolean {
      return this.lock(undefined, value, prefix) === lockedValue;
    }

    public setMeta(meta: OneWayMeta) {
      this.meta = meta;
    }

    public setOptions(options: OneWayOptions) {
      this.options = options;
    }
  }

  const modifier = new TestOneWayModifier();
  modifier.setMeta({ count: 0 });
  modifier.setOptions({ prefix: 'test' });

  const result = modifier.lock(undefined, 'value', 'test');
  expect(result).to.equal('test_value');

  const isMatch = modifier.test('test_value', 'value', 'test');
  expect(isMatch).to.equal(true);
}

interface TwoWayMeta {
  count: number;
}

interface TwoWayOptions {
  prefix: string;
}

async function CreateTwoWayModifierTest() {
  class TestTwoWayModifier extends TwoWayModifier<string, [string], TwoWayMeta, TwoWayOptions> {
    public lock(lockedValue: string | undefined, value: unknown, prefix: string): string {
      return `${prefix}_${String(value)}`;
    }

    public unlock(lockedValue: string, prefix: string): unknown {
      return lockedValue.replace(`${prefix}_`, '');
    }

    public setMeta(meta: TwoWayMeta) {
      this.meta = meta;
    }

    public setOptions(options: TwoWayOptions) {
      this.options = options;
    }
  }

  const modifier = new TestTwoWayModifier();
  modifier.setMeta({ count: 0 });
  modifier.setOptions({ prefix: 'test' });

  const locked = modifier.lock(undefined, 'value', 'test');
  expect(locked).to.equal('test_value');

  const unlocked = modifier.unlock(locked, 'test');
  expect(unlocked).to.equal('value');
}

interface ContainerMeta {
  count: number;
}

interface ContainerOptions {
  prefix: string;
}

async function CreateContainerModifierTest() {
  class TestContainerModifier extends ContainerModifier<ContainerMeta, ContainerOptions> {
    constructor() {
      super();
      this.meta = { count: 0 };
      this.options = { prefix: 'test' };
    }

    public getLock() {
      return this.lock;
    }

    public getUnlock() {
      return this.unlock;
    }
  }

  const modifier = new TestContainerModifier();

  const locked = modifier.getLock()(undefined, 'value', 'key1');
  expect(locked).to.deep.equal({ key1: 'value' });

  const locked2 = modifier.getLock()(locked, 'value2', 'key2');
  expect(locked2).to.deep.equal({ key1: 'value', key2: 'value2' });

  const unlocked = modifier.getUnlock()(locked2, 'key1');
  expect(unlocked).to.equal('value');
}

interface TestModifierMeta {
  count: number;
}

interface TestModifierOptions {
  prefix: string;
}

async function AttachModifierToTableTest() {
  class TestModifier extends OneWayModifier<string, [], TestModifierMeta, TestModifierOptions> {
    public lock(lockedValue: string | undefined, value: unknown): string {
      return `modified_${String(value)}`;
    }
  }
  class TestTable extends Table {
    name!: string;
  }
  attachModifier(TestTable, TestModifier, 'name', { prefix: 'test' });
  const instance = new TestTable();
  instance.name = 'original';
  expect(instance.name).to.equal('modified_original');
}

async function ConvertPlainDataToTableTest() {
  class TestTable extends Table {
    name!: string;
    age!: number;
  }

  const plainData = { name: 'John', age: 30 };
  const instance = fromPlainData(plainData, TestTable);

  expect(instance).to.be.instanceOf(TestTable);
  expect(instance.name).to.equal('John');
  expect(instance.age).to.equal(30);
}

async function ConvertTableToPlainDataTest() {
  class TestTable extends Table {
    name!: string;
    age!: number;
  }

  const instance = new TestTable();
  instance.name = 'John';
  instance.age = 30;

  const plainData = toPlainData(instance);

  expect(plainData.name).to.equal('John');
  expect(plainData.age).to.equal(30);
  expect(plainData).to.not.have.property('_internal');
}

async function ConvertDatabaseDataToTableTest() {
  class TestTable extends Table {
    name!: string;
    age!: number;
  }

  const dbData = { _id: '123', name: 'John', age: 30 };
  const instance = fromDatabase(dbData, TestTable);

  expect(instance).to.be.instanceOf(TestTable);
  expect(instance.name).to.equal('John');
  expect(instance.age).to.equal(30);
}

async function ConvertTableToDatabaseDataTest() {
  class TestTable extends Table {
    name!: string;
    age!: number;
  }

  const instance = new TestTable();
  instance.name = 'John';
  instance.age = 30;

  const dbData = toDatabase(instance);

  expect(dbData.name).to.equal('John');
  expect(dbData.age).to.equal(30);
}

async function UnlockModifierFieldsTest() {
  class TestModifier extends TwoWayModifier<string, [string], TestModifierMeta, TestModifierOptions> {
    public lock(lockedValue: string | undefined, value: unknown, prefix: string): string {
      return `${prefix}_${String(value)}`;
    }

    public unlock(lockedValue: string, prefix: string): unknown {
      return lockedValue.replace(`${prefix}_`, '');
    }
  }

  class TestTable extends Table {
    name!: string;
  }

  attachModifier(TestTable, TestModifier, 'name', { prefix: 'test' });

  const instance = new TestTable();
  unlock(instance, TestModifier, ['name'], 'test');

  instance.name = 'original';
  expect(instance.name).to.equal('original');
}

async function LockModifierFieldsTest() {
  class TestModifier extends OneWayModifier<string, [string], TestModifierMeta, TestModifierOptions> {
    public lock(lockedValue: string | undefined, value: unknown, prefix: string): string {
      return `${prefix}_${String(value)}`;
    }
  }
  class TestTable extends Table {
    name!: string;
  }
  attachModifier(TestTable, TestModifier, 'name', { prefix: 'test' });
  const instance = new TestTable();
  lock(instance, TestModifier, ['name'], 'test');
  instance.name = 'original';
  expect(instance.name).to.equal('test_original');
}

async function TestValueAgainstModifierTest() {
  class TestModifier extends OneWayModifier<string, [string], TestModifierMeta, TestModifierOptions> {
    public lock(lockedValue: string | undefined, value: unknown, prefix: string): string {
      return `${prefix}_${String(value)}`;
    }
    public test(lockedValue: string, value: unknown, prefix: string): boolean {
      return this.lock(undefined, value, prefix) === lockedValue;
    }
  }
  class TestTable extends Table {
    name!: string;
  }
  attachModifier(TestTable, TestModifier, 'name', { prefix: 'test' });
  const instance = new TestTable();
  lock(instance, TestModifier, ['name'], 'test');
  instance.name = 'original';
  const isMatch = testValue(instance, 'name', 'original');
  expect(isMatch).to.equal(true);
  const isNotMatch = testValue(instance, 'name', 'different');
  expect(isNotMatch).to.equal(false);
}

async function GetModifiedFieldsTest() {
  class TestModifier extends OneWayModifier<string, [], TestModifierMeta, TestModifierOptions> {
    public lock(lockedValue: string | undefined, value: unknown): string {
      return `modified_${String(value)}`;
    }
  }

  class TestTable extends Table {
    name!: string;
    age!: number;
  }

  attachModifier(TestTable, TestModifier, 'name', { prefix: 'test' });

  const instance = new TestTable();
  const modifiedFields = getModifiedFields(instance, TestModifier);

  expect(modifiedFields).to.deep.equal(['name']);
}
