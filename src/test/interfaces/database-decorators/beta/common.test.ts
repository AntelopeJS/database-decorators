import { expect } from 'chai';
import { DatumStaticMetadata, getMetadata, DeepPartial } from '@ajs.local/database-decorators/beta/common';

describe('Common - metadata', () => {
  it('creates metadata with default values', async () => CreateMetadataWithDefaultValuesTest());
  it('adds index to metadata', async () => AddIndexToMetadataTest());
  it('creates new metadata when not exists', async () => CreateNewMetadataWhenNotExistsTest());
  it('retrieves existing metadata', async () => RetrieveExistingMetadataTest());
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

async function CreateNewMetadataWhenNotExistsTest() {
  class TestClass {}
  const metadata = getMetadata(TestClass, DatumStaticMetadata);

  expect(metadata).to.be.instanceOf(DatumStaticMetadata);
  expect(metadata.primary).to.equal('id');
}

async function RetrieveExistingMetadataTest() {
  class TestClass {}
  const metadata1 = getMetadata(TestClass, DatumStaticMetadata);
  const metadata2 = getMetadata(TestClass, DatumStaticMetadata);

  expect(metadata1).to.equal(metadata2);
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

  const _partial: DeepPartial<TestType> = {
    name: 'John',
    address: {
      street: 'Main St',
    },
    hobbies: ['reading'],
  };
}
