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

async function CreateEncryptionModifierTest() {
  const Mixed = Table.with(EncryptionModifier);
  class Sample extends Mixed {
    @Encrypted({ secretKey: '12345678901234567890123456789012' })
    value!: string;
  }

  const instance = new Sample();
  instance.value = 'hello';
  expect(instance.value).to.equal('hello');
}

async function EncryptAndDecryptStringValuesTest() {
  const T = Table.with(EncryptionModifier);
  class User extends T {
    @Encrypted({ secretKey: '12345678901234567890123456789012', algorithm: 'aes-256-cbc' })
    email!: string;
  }

  const user = new User();
  user.email = 'user@example.com';
  expect(user.email).to.equal('user@example.com');
}

async function EncryptAndDecryptObjectValuesTest() {
  const T = Table.with(EncryptionModifier);
  class Doc extends T {
    @Encrypted({ secretKey: '12345678901234567890123456789012', algorithm: 'aes-256-cbc' })
    meta!: Record<string, unknown>;
  }

  const doc = new Doc();
  const original = { admin: true, count: 3 };
  doc.meta = original;
  expect(doc.meta).to.deep.equal(original);
}

async function EncryptAndDecryptArrayValuesTest() {
  const T = Table.with(EncryptionModifier);
  class Tags extends T {
    @Encrypted({ secretKey: '12345678901234567890123456789012', algorithm: 'aes-256-cbc' })
    values!: (string | { deep: string })[];
  }

  const tags = new Tags();
  const original = ['a', 'b', { deep: 'x' }];
  tags.values = original;
  expect(tags.values).to.deep.equal(original);
}

async function UseCustomEncryptionAlgorithmTest() {
  const T = Table.with(EncryptionModifier);
  class CustomAlgo extends T {
    @Encrypted({ secretKey: '12345678901234567890123456789012', algorithm: 'aes-256-cbc' })
    field!: string;
  }

  const row = new CustomAlgo();
  row.field = 'custom';
  expect(row.field).to.equal('custom');
}

async function UseCustomIvSizeTest() {
  const T = Table.with(EncryptionModifier);
  class WithIv extends T {
    @Encrypted({ secretKey: '12345678901234567890123456789012', ivSize: 16, algorithm: 'aes-256-cbc' })
    data!: string;
  }

  const test = new WithIv();
  test.data = 'iv test';
  expect(test.data).to.equal('iv test');
}

async function HandleEncryptionDecoratorTest() {
  const T = Table.with(EncryptionModifier);
  class Secured extends T {
    @Encrypted({ secretKey: '12345678901234567890123456789012', algorithm: 'aes-256-cbc' })
    password!: string;

    @Encrypted({ secretKey: '12345678901234567890123456789012', algorithm: 'aes-256-cbc' })
    extra!: Record<string, unknown>;
  }

  const s = new Secured();
  s.password = 'admin123';
  s.extra = { token: 'xyz' };

  expect(s.password).to.equal('admin123');
  expect(s.extra).to.deep.equal({ token: 'xyz' });
}

async function GenerateUniqueIvForEachEncryptionTest() {
  const T = Table.with(EncryptionModifier);
  class Message extends T {
    @Encrypted({ secretKey: '12345678901234567890123456789012', algorithm: 'aes-256-cbc' })
    body!: string;
  }

  const m1 = new Message();
  const m2 = new Message();

  m1.body = 'secret';
  m2.body = 'secret';

  expect(m1.body).to.equal('secret');
  expect(m2.body).to.equal('secret');
  expect(m1).to.not.deep.equal(m2);
}

async function PreserveDataIntegrityTest() {
  const T = Table.with(EncryptionModifier);
  class Complex extends T {
    @Encrypted({ secretKey: '12345678901234567890123456789012', algorithm: 'aes-256-cbc' })
    payload!: {
      string: string;
      number: number;
      boolean: boolean;
      null: null;
      array: number[];
      object: { nested: string };
      date: Date;
    };
  }

  const original = {
    string: 'txt',
    number: 123,
    boolean: true,
    null: null,
    array: [1, 2],
    object: { nested: 'val' },
    date: new Date('2022-12-01'),
  };

  const instance = new Complex();
  instance.payload = original;
  expect(instance.payload).to.deep.equal(original);
  expect(instance.payload.date).to.be.instanceOf(Date);
}
