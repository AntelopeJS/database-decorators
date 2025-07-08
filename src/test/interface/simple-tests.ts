import { expect } from 'chai';
import { BasicEntity, BasicEntityModel } from '../types/TestEntity';

describe('Database Decorators - Simple Tests', () => {
  it('Convert raw data to model instance', ConvertRawDataToModelTest);
  it('Convert database data to model instance', ConvertDatabaseDataToModelTest);
  it('Return undefined for null data', ReturnUndefinedForNullDataTest);
  it('Have correct metadata', HaveCorrectMetadataTest);
  it('Have correct properties', HaveCorrectPropertiesTest);
  it('Accept correct values', AcceptCorrectValuesTest);
});

function ConvertRawDataToModelTest() {
  const rawData = {
    name: 'Test Entity',
    description: 'Test Description',
    is_active: true,
  };

  const entityInstance = BasicEntityModel.fromPlainData(rawData);
  expect(entityInstance).to.have.property('name', 'Test Entity');
  expect(entityInstance).to.have.property('description', 'Test Description');
  expect(entityInstance).to.have.property('is_active', true);
}

function ConvertDatabaseDataToModelTest() {
  const dbData = {
    _id: 'test-id-123',
    name: 'Test Entity',
    description: 'Test Description',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const entityInstance = BasicEntityModel.fromDatabase(dbData);
  expect(entityInstance).to.have.property('_id', 'test-id-123');
  expect(entityInstance).to.have.property('name', 'Test Entity');
  expect(entityInstance).to.have.property('description', 'Test Description');
  expect(entityInstance).to.have.property('is_active', true);
}

function ReturnUndefinedForNullDataTest() {
  const entityInstance = BasicEntityModel.fromDatabase(null);
  expect(entityInstance).to.equal(undefined);
}

function HaveCorrectMetadataTest() {
  const metadata: unknown = Reflect.getMetadata('design:type', BasicEntity.prototype, '_id');
  expect(metadata).to.not.equal(undefined);
}

function HaveCorrectPropertiesTest() {
  const entity = new BasicEntity();

  expect(entity).to.be.an('object');
  expect(typeof entity).to.equal('object');
}

function AcceptCorrectValuesTest() {
  const entity = new BasicEntity();

  entity._id = 'test-id';
  entity.name = 'Test Name';
  entity.description = 'Test Description';
  entity.is_active = true;

  expect(entity._id).to.equal('test-id');
  expect(entity.name).to.equal('Test Name');
  expect(entity.description).to.equal('Test Description');
  expect(entity.is_active).to.equal(true);
}
