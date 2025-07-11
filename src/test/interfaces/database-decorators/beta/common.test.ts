import { expect } from 'chai';
import { DatumStaticMetadata, getMetadata, DeepPartial } from '@ajs.local/database-decorators/beta/common';

describe('Common - metadata', () => {
  it('creates metadata with default values', async () => CreateMetadataWithDefaultValuesTest());
  it('adds index to metadata', async () => AddIndexToMetadataTest());
  it('retrieves existing metadata', async () => RetrieveExistingMetadataTest());
  it('creates new metadata when not exists', async () => CreateNewMetadataWhenNotExistsTest());
  it('handles deep partial types correctly', async () => HandleDeepPartialTypesCorrectlyTest());
});

async function CreateMetadataWithDefaultValuesTest() {
  const metadata = new DatumStaticMetadata();

  expect(metadata.primary).to.equal('id');
  expect(metadata.indexes).to.deep.equal({});
  expect(metadata.generator).to.equal(undefined);
}

async function AddIndexToMetadataTest() {
  const metadata = new DatumStaticMetadata();

  metadata.addIndex('email', 'user_search');
  metadata.addIndex('name', 'user_search');

  expect(metadata.indexes.user_search).to.deep.equal(['email', 'name']);
}

async function RetrieveExistingMetadataTest() {
  class TestClass {}
  const metadata1 = getMetadata(TestClass, DatumStaticMetadata);
  const metadata2 = getMetadata(TestClass, DatumStaticMetadata);

  expect(metadata1).to.equal(metadata2);
}

async function CreateNewMetadataWhenNotExistsTest() {
  class TestClass {}
  const metadata = getMetadata(TestClass, DatumStaticMetadata);

  expect(metadata).to.be.instanceOf(DatumStaticMetadata);
  expect(metadata.primary).to.equal('id');
}

async function HandleDeepPartialTypesCorrectlyTest() {
  interface TestType {
    name: string;
    age: number;
    address: {
      street: string;
      city: string;
    };
    hobbies: string[];
  }

  const partial: DeepPartial<TestType> = {
    name: 'John',
    address: {
      street: 'Main St',
    },
    hobbies: ['reading'],
  };

  expect(partial.name).to.equal('John');
  expect(partial.address?.street).to.equal('Main St');
  expect(partial.address?.city).to.equal(undefined);
  expect(partial.hobbies).to.deep.equal(['reading']);
}
