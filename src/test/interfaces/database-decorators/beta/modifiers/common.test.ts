import { expect } from 'chai';
import {
  attachModifier,
  ContainerModifier,
  fromDatabase,
  getModifiedFields,
  Modifier,
  OneWayModifier,
  toDatabase,
  TwoWayModifier,
} from '@ajs.local/database-decorators/beta/modifiers/common';
import { Table } from '@ajs.local/database-decorators/beta/table';

describe('Modifiers - common', () => {
  it('creates basic modifier', async () => CreateBasicModifierTest());
  it('creates one way modifier', async () => CreateOneWayModifierTest());
  it('creates two way modifier', async () => CreateTwoWayModifierTest());
  it('creates container modifier', async () => CreateContainerModifierTest());
  it('passes options to modifier via attachModifier()', async () => AttachWithOptionsTest());
  it('attaches multiple modifiers on same field', async () => ChainedModifiersTest());
  it('throws if adding OneWayModifier after another OneWayModifier', async () => DuplicateOneWayErrorTest());
  it('converts database data to table instance', async () => ConvertDatabaseDataToTableTest());
  it('converts table instance to database data', async () => ConvertTableToDatabaseDataTest());
  it('gets modified fields', async () => GetModifiedFieldsTest());
});

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

  const data1 = mod.lock(undefined, 'val', 'key1');
  expect(data1).to.deep.equal({ key1: 'val' });

  const data2 = mod.lock(data1, 'val2', 'key2');
  expect(data2).to.deep.equal({ key1: 'val', key2: 'val2' });

  const result = mod.unlock(data2, 'key1');
  expect(result).to.equal('val');
}

async function AttachWithOptionsTest() {
  interface Opts {
    suffix: string;
  }

  class SuffixModifier extends OneWayModifier<string, [], {}, Opts> {
    public readonly autolock = true;
    lock(_: string | undefined, value: unknown): string {
      return `${String(value)}${this.options.suffix}`;
    }
  }
  class TestTable extends Table {
    declare name: string;
  }

  attachModifier(TestTable, SuffixModifier, 'name', { suffix: '_suffix' });
  const row = new TestTable();
  row.name = 'hello';
  expect(row.name).to.equal('hello_suffix');
}

async function ChainedModifiersTest() {
  class Prefix extends OneWayModifier<string, [], {}, { prefix: string }> {
    lock(_: string | undefined, value: unknown): string {
      return `${this.options.prefix}${String(value)}`;
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

  let error = 'no error';
  attachModifier(TestTable, Prefix, 'name', { prefix: 'pre_' });
  expect(() => {
    attachModifier(TestTable, Suffix, 'name', { suffix: '_suffix' });
  }).to.throw(/please review your ordering/);
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
