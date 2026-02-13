import { expect } from 'chai';
import {
  DEFAULT_SCHEMA,
  DatumStaticMetadata,
  Fixture,
  GetTablesFromSchema,
  Index,
  RegisterTable,
  Table,
  getMetadata,
} from '@ajs.local/database-decorators/beta';

const RootExportsTableName = 'root_exports_users';

describe('database decorators root exports', () => {
  it('exposes table decorators from the root interface', async () => exposeTableDecoratorsFromRootInterfaceTest());
  it('exposes fixture decorator from the root interface', async () => exposeFixtureDecoratorFromRootInterfaceTest());
  it('registers tables through root schema exports', async () => registerTablesThroughRootSchemaExportsTest());
});

async function exposeTableDecoratorsFromRootInterfaceTest() {
  class UserTable extends Table {
    @Index({ primary: true })
    declare id: string;

    @Index()
    declare email: string;
  }

  const metadata = getMetadata(UserTable, DatumStaticMetadata);
  expect(metadata.primary).to.equal('id');
  expect(metadata.indexes.email).to.deep.equal(['email']);
}

async function exposeFixtureDecoratorFromRootInterfaceTest() {
  const fixtures = [{ id: '1', name: 'Antelope' }];

  @Fixture(() => fixtures)
  class FixtureTable extends Table {
    @Index({ primary: true })
    declare id: string;

    declare name: string;
  }

  const metadata = getMetadata(FixtureTable, DatumStaticMetadata);
  expect(metadata.generator).to.be.a('function');
}

async function registerTablesThroughRootSchemaExportsTest() {
  @RegisterTable(RootExportsTableName)
  class RootExportTable extends Table {
    @Index({ primary: true })
    declare id: string;
  }

  const tables = GetTablesFromSchema(String(DEFAULT_SCHEMA));
  expect(tables).to.have.property(RootExportsTableName);
  expect(tables?.[RootExportsTableName]).to.equal(RootExportTable);
}
