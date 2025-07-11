import { expect } from 'chai';
import { Hashed, HashModifier } from '@ajs.local/database-decorators/beta/modifiers/hash';
import { Table } from '@ajs.local/database-decorators/beta/table';
import { testEnabled, skipTests } from '../../../../config';
import * as console from 'node:console';

if (testEnabled.modifiers_hash) {
  describe('Modifiers - hash', () => {
    it('creates hash modifier', async () => CreateHashModifierTest());
    it('hashes string values', async () => HashStringValuesTest());
    it('hashes object values', async () => HashObjectValuesTest());
    it('handles undefined values', async () => HandleUndefinedValuesTest());
    it('uses custom hash algorithm', async () => UseCustomHashAlgorithmTest());
    it('generates unique salt for each field', async () => GenerateUniqueSaltForEachFieldTest());
    it('handles hash decorator', async () => HandleHashDecoratorTest());
    it('tests hash values correctly', async () => TestHashValuesTest());
    it('provides testHash method through mixin', async () => ProvideTestHashMethodTest());
    it('maintains hash consistency', async () => MaintainHashConsistencyTest());
  });
} else {
  skipTests('Modifiers - hash');
}

interface HashOptions {
  algorithm?: string;
}

interface HashMeta {
  salt?: string;
}

class TestableHashModifier extends HashModifier {
  public setOptions(options: HashOptions) {
    this.options = options;
  }

  public getOptions(): HashOptions {
    return this.options;
  }

  public getMeta(): HashMeta {
    return this.meta;
  }

  public setMeta(meta: HashMeta) {
    this.meta = meta;
  }
}

async function CreateHashModifierTest() {
  const modifier = new TestableHashModifier();
  modifier.setOptions({ algorithm: 'sha256' });

  expect(modifier).to.be.instanceOf(HashModifier);
  expect(modifier.getOptions().algorithm).to.equal('sha256');
  expect(modifier.autolock).to.equal(true);
}

async function HashStringValuesTest() {
  const modifier = new TestableHashModifier();
  modifier.setOptions({ algorithm: 'sha256' });
  modifier.setMeta({});

  const originalValue = 'password123';
  const hashed = modifier.lock(undefined, originalValue);

  expect(hashed).to.be.a('string');
  expect(hashed).to.not.equal(originalValue);
  expect(modifier.getMeta().salt).to.be.a('string');
}

async function HashObjectValuesTest() {
  const modifier = new TestableHashModifier();
  modifier.setOptions({ algorithm: 'sha256' });
  modifier.setMeta({});

  const originalValue = { name: 'John', age: 30 };
  const hashed = modifier.lock(undefined, originalValue);

  expect(hashed).to.be.a('string');
  expect(hashed).to.not.equal(JSON.stringify(originalValue));
}

async function HandleUndefinedValuesTest() {
  const modifier = new TestableHashModifier();
  modifier.setOptions({ algorithm: 'sha256' });
  modifier.setMeta({});

  const hashed = modifier.lock(undefined, undefined);

  expect(hashed).to.equal(undefined);
}

async function UseCustomHashAlgorithmTest() {
  const modifier = new TestableHashModifier();
  modifier.setOptions({ algorithm: 'md5' });
  modifier.setMeta({});

  const originalValue = 'test data';
  const hashed = modifier.lock(undefined, originalValue);

  expect(hashed).to.be.a('string');
  expect(hashed).to.not.equal(originalValue);
  expect(modifier.getOptions().algorithm).to.equal('md5');
}

async function GenerateUniqueSaltForEachFieldTest() {
  const modifier1 = new TestableHashModifier();
  modifier1.setOptions({ algorithm: 'sha256' });
  modifier1.setMeta({});

  const modifier2 = new TestableHashModifier();
  modifier2.setOptions({ algorithm: 'sha256' });
  modifier2.setMeta({});

  const value = 'test data';
  const hashed1 = modifier1.lock(undefined, value);
  const hashed2 = modifier2.lock(undefined, value);

  expect(hashed1).to.not.equal(hashed2);
  expect(modifier1.getMeta().salt).to.not.equal(modifier2.getMeta().salt);
}

async function HandleHashDecoratorTest() {
  class TestTable extends Table.with(HashModifier) {
    @Hashed({ algorithm: 'sha256' })
    declare password: string;
  }

  const instance = new TestTable();
  instance.password = 'myPassword123';

  expect(instance.testHash('password', 'myPassword123')).to.equal(true);
  expect(instance.testHash('password', 'notMyPassword')).to.equal(false);
}

async function TestHashValuesTest() {
  const modifier = new TestableHashModifier();
  modifier.setOptions({ algorithm: 'sha256' });
  modifier.setMeta({});

  const originalValue = 'test data';
  const hashed = modifier.lock(undefined, originalValue);

  const isMatch = modifier.test(hashed, originalValue);
  const isNotMatch = modifier.test(hashed, 'wrong data');

  expect(isMatch).to.equal(true);
  expect(isNotMatch).to.equal(false);
}

interface TestTableWithHash extends Table {
  password: string;
  testHash(field: 'password', value: string): boolean;
}

async function ProvideTestHashMethodTest() {
  const TestTableWithMixin = Table.with(HashModifier);

  class TestTable extends TestTableWithMixin {
    @Hashed({ algorithm: 'sha256' })
    declare password: string;
  }

  const instance = new TestTable() as TestTableWithHash;
  instance.password = 'myPassword123';

  expect(typeof instance.testHash).to.equal('function');

  const isMatch = instance.testHash('password', 'myPassword123');
  const isNotMatch = instance.testHash('password', 'wrongPassword');

  expect(isMatch).to.equal(true);
  expect(isNotMatch).to.equal(false);
}

async function MaintainHashConsistencyTest() {
  const modifier = new TestableHashModifier();
  modifier.setMeta({});
  modifier.setOptions({ algorithm: 'sha256' });

  const originalValue = 'consistent data';
  const hashed1 = modifier.lock(undefined, originalValue);
  const salt = modifier.getMeta().salt;

  modifier.setMeta({ salt });
  const hashed2 = modifier.lock(undefined, originalValue);

  expect(hashed1).to.equal(hashed2);
}
