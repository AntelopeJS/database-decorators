import { expect } from 'chai';
import {
  attachModifier,
  ContainerModifier,
  fromDatabase,
  getModifiedFields,
  lock,
  Modifier,
  ModifiersDynamicMetadata,
  OneWayModifier,
  testValue,
  toDatabase,
  TwoWayModifier,
  unlock,
} from '@ajs.local/database-decorators/beta/modifiers/common';
import { Table } from '@ajs.local/database-decorators/beta/table';
import { getMetadata } from '@ajs.local/database-decorators/beta/common';
import { testEnabled, skipTests } from '../../../../config';

if (testEnabled.modifiers_common) {
  describe('Modifiers - common', () => {
    it('creates basic modifier', async () => CreateBasicModifierTest());
    it('creates one way modifier', async () => CreateOneWayModifierTest());
    it('creates two way modifier', async () => CreateTwoWayModifierTest());
    it('creates container modifier', async () => CreateContainerModifierTest());
    it('attaches OneWayModifier and applies lock()', async () => BasicAttachTest());
    it('passes options to modifier via attachModifier()', async () => AttachWithOptionsTest());
    it('attaches multiple modifiers on same field', async () => ChainedModifiersTest());
    it('throws if adding OneWayModifier after another OneWayModifier', async () => DuplicateOneWayErrorTest());
    it('converts database data to table instance', async () => ConvertDatabaseDataToTableTest());
    it('converts table instance to database data', async () => ConvertTableToDatabaseDataTest());
    it('unlocks modifier fields', async () => UnlockModifierFieldsTest());
    it('locks modifier fields', async () => LockModifierFieldsTest());
    it('tests value against modifier', async () => TestValueAgainstModifierTest());
    it('gets modified fields', async () => GetModifiedFieldsTest());
  });
} else {
  skipTests('Modifiers - common');
}

async function CreateBasicModifierTest() {
  class TestModifier extends Modifier<any, any> {
    public lock(v: any): any {
      return v;
    }
  }

  const modifier = new TestModifier();
  expect(modifier).to.be.instanceOf(Modifier);
}

async function CreateOneWayModifierTest() {
  class TestOneWayModifier extends OneWayModifier<string, [string]> {
    lock(_: string | undefined, value: unknown, prefix: string): string {
      return `${prefix}_${String(value)}`;
    }

    test(lockedValue: string, value: unknown, prefix: string): boolean {
      return this.lock(undefined, value, prefix) === lockedValue;
    }
  }

  const mod = new TestOneWayModifier();
  const locked = mod.lock(undefined, 'val', 'prefix');
  expect(locked).to.equal('prefix_val');
  expect(mod.test(locked, 'val', 'prefix')).to.equal(true);
}

async function CreateTwoWayModifierTest() {
  class TestTwoWayModifier extends TwoWayModifier<string, [string]> {
    lock(_: string | undefined, value: unknown, prefix: string): string {
      return `${prefix}_${String(value)}`;
    }

    unlock(lockedValue: string, prefix: string): unknown {
      return lockedValue.replace(`${prefix}_`, '');
    }
  }

  const mod = new TestTwoWayModifier();
  const locked = mod.lock(undefined, 'value', 'pre');
  const unlocked = mod.unlock(locked, 'pre');
  expect(unlocked).to.equal('value');
}

async function CreateContainerModifierTest() {
  class TestContainer extends ContainerModifier {
    getLock() {
      return this.lock;
    }
    getUnlock() {
      return this.unlock;
    }
  }

  const mod = new TestContainer();
  const lockFn = mod.getLock();
  const unlockFn = mod.getUnlock();

  const data1 = lockFn(undefined, 'val', 'key1');
  expect(data1).to.deep.equal({ key1: 'val' });

  const data2 = lockFn(data1, 'val2', 'key2');
  expect(data2).to.deep.equal({ key1: 'val', key2: 'val2' });

  const result = unlockFn(data2, 'key1');
  expect(result).to.equal('val');
}

async function BasicAttachTest() {
  class AddPrefix extends OneWayModifier<string, []> {
    lock(_: string | undefined, value: unknown): string {
      return `mod_${String(value)}`;
    }
  }

  class TestTable extends Table {
    name!: string;
  }

  attachModifier(TestTable, AddPrefix, 'name', {});
  const row = new TestTable();
  getMetadata(row, ModifiersDynamicMetadata);

  row.name = 'value';
  expect(row.name).to.equal('value');

  lock(row, AddPrefix, ['name']);
  row.name = 'value';
  expect(row.name).to.equal('mod_value');
}

async function AttachWithOptionsTest() {
  interface Opts {
    suffix: string;
  }

  class AddSuffix extends OneWayModifier<string, [], {}, Opts> {
    lock(_: string | undefined, value: unknown): string {
      return `${String(value)}${this.options.suffix}`;
    }
  }

  class TestTable extends Table {
    name!: string;
  }

  attachModifier(TestTable, AddSuffix, 'name', { suffix: '!' });
  const row = new TestTable();
  getMetadata(row, ModifiersDynamicMetadata);

  row.name = 'hello';
  expect(row.name).to.equal('hello');

  lock(row, AddSuffix, ['name']);
  row.name = 'hello';
  expect(row.name).to.equal('hello!');
}

async function ChainedModifiersTest() {
  class Prefix extends OneWayModifier<string, []> {
    lock(_: string | undefined, value: unknown): string {
      return `pre_${String(value)}`;
    }
  }

  class Suffix extends TwoWayModifier<string, [], {}, { suffix: string }> {
    lock(_: string | undefined, value: unknown): string {
      return `${String(value)}${this.options.suffix}`;
    }

    unlock(lockedValue: string): unknown {
      return lockedValue.replace(this.options.suffix, '');
    }
  }

  class TestTable extends Table {
    name!: string;
  }

  attachModifier(TestTable, Prefix, 'name', {});
  attachModifier(TestTable, Suffix, 'name', { suffix: '!' });

  const row = new TestTable();
  getMetadata(row, ModifiersDynamicMetadata);

  lock(row, Prefix, ['name']);
  unlock(row, Suffix, ['name']);

  row.name = 'value';
  expect(row.name).to.equal('pre_value!');
}

async function DuplicateOneWayErrorTest() {
  class Mod1 extends OneWayModifier<string, []> {
    lock(_: string | undefined, val: unknown): string {
      return `#${String(val)}`;
    }
  }

  class Mod2 extends OneWayModifier<string, []> {
    lock(_: string | undefined, val: unknown): string {
      return `@${String(val)}`;
    }
  }

  class TestTable extends Table {
    name!: string;
  }

  attachModifier(TestTable, Mod1, 'name', {});
  expect(() => {
    attachModifier(TestTable, Mod2, 'name', {});
  }).to.throw(/already has a One-Way Modifier/);
}

async function ConvertDatabaseDataToTableTest() {
  class TestTable extends Table {
    name!: string;
    age!: number;
  }

  const dbRow = { _id: '1', name: 'John', age: 40 };
  const instance = fromDatabase(dbRow, TestTable);

  expect(instance).to.be.instanceOf(TestTable);
  expect(instance.name).to.equal('John');
  expect(instance.age).to.equal(40);
}

async function ConvertTableToDatabaseDataTest() {
  class TestTable extends Table {
    name!: string;
    age!: number;
  }

  const instance = new TestTable();
  instance.name = 'Eva';
  instance.age = 22;

  const db = toDatabase(instance);
  expect(db.name).to.equal('Eva');
  expect(db.age).to.equal(22);
}

async function UnlockModifierFieldsTest() {
  class TestMod extends TwoWayModifier<string, [string]> {
    lock(_: string | undefined, v: unknown, p: string): string {
      return `${p}_${String(v)}`;
    }
    unlock(v: string, p: string): unknown {
      return v.replace(`${p}_`, '');
    }
  }

  class TestTable extends Table {
    name!: string;
  }

  attachModifier(TestTable, TestMod, 'name', {});
  const row = new TestTable();

  lock(row, TestMod, ['name'], 'test');
  row.name = 'value';
  expect(row.name).to.equal('test_value');

  unlock(row, TestMod, ['name'], 'test');
  expect(row.name).to.equal('value');
}

async function LockModifierFieldsTest() {
  class TestMod extends OneWayModifier<string, [string]> {
    lock(_: string | undefined, v: unknown, p: string): string {
      return `${p}_${String(v)}`;
    }
  }

  class TestTable extends Table {
    name!: string;
  }

  attachModifier(TestTable, TestMod, 'name', {});
  const row = new TestTable();

  row.name = 'init';
  expect(row.name).to.equal('init');

  lock(row, TestMod, ['name'], 'mod');
  row.name = 'new_value';
  expect(row.name).to.equal('mod_new_value');
}

async function TestValueAgainstModifierTest() {
  class TestMod extends OneWayModifier<string, [string]> {
    lock(_: string | undefined, v: unknown, p: string): string {
      return `${p}_${String(v)}`;
    }
    test(l: string, v: unknown, p: string): boolean {
      return this.lock(undefined, v, p) === l;
    }
  }

  class TestTable extends Table {
    name!: string;
  }

  attachModifier(TestTable, TestMod, 'name', {});
  const row = new TestTable();
  lock(row, TestMod, ['name'], 't');

  row.name = 'foo';
  expect(row.name).to.equal('t_foo');

  expect(testValue(row, 'name', 't_foo')).to.equal(true);
  expect(testValue(row, 'name', 'foo')).to.equal(false);
  expect(testValue(row, 'name', 't_bar')).to.equal(false);
}

async function GetModifiedFieldsTest() {
  class TestMod extends OneWayModifier<string, []> {
    lock(_: string | undefined, v: unknown): string {
      return `mod_${String(v)}`;
    }
  }

  class TestTable extends Table {
    name!: string;
    age!: number;
  }

  attachModifier(TestTable, TestMod, 'name', { prefix: 'mod' });
  const row = new TestTable();
  const fields = getModifiedFields(row, TestMod);
  expect(fields).to.deep.equal(['name']);
}
