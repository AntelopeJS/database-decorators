import { expect } from 'chai';
import { Encrypted, EncryptionModifier } from '@ajs.local/database-decorators/beta/modifiers/encryption';
import { Table } from '@ajs.local/database-decorators/beta/table';

describe('Modifiers - encryption', () => {
  it('creates encryption modifier', async () => CreateEncryptionModifierTest());
  it('encrypts and decrypts string values', async () => EncryptAndDecryptStringValuesTest());
  it('encrypts and decrypts object values', async () => EncryptAndDecryptObjectValuesTest());
  it('encrypts and decrypts array values', async () => EncryptAndDecryptArrayValuesTest());
  it('uses custom encryption algorithm', async () => UseCustomEncryptionAlgorithmTest());
  it('uses custom iv size', async () => UseCustomIvSizeTest());
  it('handles encryption decorator', async () => HandleEncryptionDecoratorTest());
  it('generates unique iv for each encryption', async () => GenerateUniqueIvForEachEncryptionTest());
  it('preserves data integrity', async () => PreserveDataIntegrityTest());
});

interface EncryptionOptions {
  secretKey: string;
  algorithm?: string;
  ivSize?: number;
}

interface EncryptionMeta {
  iv: string;
  authTag?: string;
}

class TestableEncryptionModifier extends EncryptionModifier {
  public setOptions(options: EncryptionOptions) {
    this.options = options;
  }

  public getOptions(): EncryptionOptions {
    return this.options;
  }

  public getMeta(): EncryptionMeta {
    return this.meta;
  }

  public setMeta(meta: EncryptionMeta) {
    this.meta = meta;
  }
}

async function CreateEncryptionModifierTest() {
  const modifier = new TestableEncryptionModifier();
  modifier.setOptions({ secretKey: '12345678901234567890123456789012' });
  modifier.setMeta({ iv: '' });

  expect(modifier).to.be.instanceOf(EncryptionModifier);
  expect(modifier.getOptions().secretKey).to.equal('12345678901234567890123456789012');
  expect(modifier.getOptions().algorithm ?? 'aes-256-gcm').to.equal('aes-256-gcm');
  expect(modifier.getOptions().ivSize ?? 16).to.equal(16);
}

async function EncryptAndDecryptStringValuesTest() {
  const modifier = new TestableEncryptionModifier();
  modifier.setOptions({
    secretKey: '12345678901234567890123456789012',
    algorithm: 'aes-256-cbc',
  });
  modifier.setMeta({ iv: '' });

  const originalValue = 'sensitive data';
  const encrypted = modifier.lock(undefined, originalValue);
  const decrypted = modifier.unlock(encrypted) as string;

  expect(encrypted).to.be.a('string');
  expect(encrypted).to.not.equal(originalValue);
  expect(decrypted).to.equal(originalValue);
  expect(modifier.getMeta().iv).to.be.a('string');
}

async function EncryptAndDecryptObjectValuesTest() {
  const modifier = new TestableEncryptionModifier();
  modifier.setOptions({
    secretKey: '12345678901234567890123456789012',
    algorithm: 'aes-256-cbc',
  });
  modifier.setMeta({ iv: '' });

  const originalValue = { name: 'John', age: 30, isActive: true };
  const encrypted = modifier.lock(undefined, originalValue);
  const decrypted = modifier.unlock(encrypted) as typeof originalValue;

  expect(encrypted).to.be.a('string');
  expect(encrypted).to.not.equal(JSON.stringify(originalValue));
  expect(decrypted).to.deep.equal(originalValue);
}

async function EncryptAndDecryptArrayValuesTest() {
  const modifier = new TestableEncryptionModifier();
  modifier.setOptions({
    secretKey: '12345678901234567890123456789012',
    algorithm: 'aes-256-cbc',
  });
  modifier.setMeta({ iv: '' });

  const originalValue = ['item1', 'item2', { nested: 'value' }];
  const encrypted = modifier.lock(undefined, originalValue);
  const decrypted = modifier.unlock(encrypted) as typeof originalValue;

  expect(encrypted).to.be.a('string');
  expect(encrypted).to.not.equal(JSON.stringify(originalValue));
  expect(decrypted).to.deep.equal(originalValue);
}

async function UseCustomEncryptionAlgorithmTest() {
  const modifier = new TestableEncryptionModifier();
  modifier.setOptions({
    secretKey: '12345678901234567890123456789012',
    algorithm: 'aes-256-cbc',
  });
  modifier.setMeta({ iv: '' });

  const originalValue = 'test data';
  const encrypted = modifier.lock(undefined, originalValue);
  const decrypted = modifier.unlock(encrypted) as string;

  expect(decrypted).to.equal(originalValue);
  expect(modifier.getOptions().algorithm).to.equal('aes-256-cbc');
}

async function UseCustomIvSizeTest() {
  const modifier = new TestableEncryptionModifier();
  modifier.setOptions({
    secretKey: '12345678901234567890123456789012',
    ivSize: 16,
    algorithm: 'aes-256-cbc',
  });
  modifier.setMeta({ iv: '' });

  const originalValue = 'test data';
  const encrypted = modifier.lock(undefined, originalValue);
  const decrypted = modifier.unlock(encrypted) as string;

  expect(decrypted).to.equal(originalValue);
  expect(modifier.getOptions().ivSize).to.equal(16);
}

async function HandleEncryptionDecoratorTest() {
  const TestTableWithMixin = Table.with(EncryptionModifier);

  class TestTable extends TestTableWithMixin {
    @Encrypted({
      secretKey: '12345678901234567890123456789012',
      algorithm: 'aes-256-cbc',
    })
    password!: string;

    @Encrypted({
      secretKey: '12345678901234567890123456789012',
      algorithm: 'aes-256-cbc',
    })
    secretData!: Record<string, unknown>;
  }

  const instance = new TestTable();
  instance.password = 'myPassword123';
  instance.secretData = { token: 'secret-token' };

  expect(instance.password).to.not.equal('myPassword123');
  expect(instance.password).to.be.a('string');
  expect(instance.secretData).to.not.deep.equal({ token: 'secret-token' });
  expect(instance.secretData).to.be.a('string');
}

async function GenerateUniqueIvForEachEncryptionTest() {
  const modifier = new TestableEncryptionModifier();
  modifier.setOptions({
    secretKey: '12345678901234567890123456789012',
    algorithm: 'aes-256-cbc',
  });
  modifier.setMeta({ iv: '' });

  const value = 'test data';
  const encrypted1 = modifier.lock(undefined, value);
  const iv1 = modifier.getMeta().iv;

  modifier.setMeta({ iv: '' });
  const encrypted2 = modifier.lock(undefined, value);
  const iv2 = modifier.getMeta().iv;

  expect(iv1).to.not.equal(iv2);
  expect(encrypted1).to.not.equal(encrypted2);
  expect(modifier.unlock(encrypted1)).to.equal(value);
  expect(modifier.unlock(encrypted2)).to.equal(value);
}

interface ComplexData {
  string: string;
  number: number;
  boolean: boolean;
  null: null;
  array: number[];
  object: { nested: string };
  date: Date;
}

async function PreserveDataIntegrityTest() {
  const modifier = new TestableEncryptionModifier();
  modifier.setOptions({
    secretKey: '12345678901234567890123456789012',
    algorithm: 'aes-256-cbc',
  });
  modifier.setMeta({ iv: '' });

  const complexData: ComplexData = {
    string: 'text',
    number: 42,
    boolean: true,
    null: null,
    array: [1, 2, 3],
    object: { nested: 'value' },
    date: new Date('2023-01-01'),
  };

  const encrypted = modifier.lock(undefined, complexData);
  const decrypted = modifier.unlock(encrypted) as ComplexData;

  expect(decrypted).to.deep.equal(complexData);
  expect(typeof decrypted.string).to.equal('string');
  expect(typeof decrypted.number).to.equal('number');
  expect(typeof decrypted.boolean).to.equal('boolean');
  expect(decrypted.null).to.equal(null);
  expect(Array.isArray(decrypted.array)).to.equal(true);
  expect(typeof decrypted.object).to.equal('object');
  expect(decrypted.date).to.be.instanceOf(Date);
}
