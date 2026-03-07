import {
  DatumStaticMetadata,
  getMetadata,
} from "@ajs.local/database-decorators/beta/common";
import {
  getTablesForSchema,
  RegisterTable,
} from "@ajs.local/database-decorators/beta/schema";
import { Index, Table } from "@ajs.local/database-decorators/beta/table";
import { expect } from "chai";

describe("Schema - RegisterTable decorator", () => {
  it("stores tableName and schemaName in metadata", async () =>
    StoreTableNameAndSchemaNameInMetadataTest());
  it("stores tableName for multiple classes", async () =>
    StoreTableNameForMultipleClassesTest());
  it("preserves existing metadata", async () => PreserveExistingMetadataTest());
  it("registers tables in schema registry", async () =>
    RegisterTablesInSchemaRegistryTest());
  it("returns undefined for unknown schema", async () =>
    ReturnUndefinedForUnknownSchemaTest());
});

async function StoreTableNameAndSchemaNameInMetadataTest() {
  @RegisterTable("test_table", "test-schema")
  class TestTable extends Table {
    name!: string;
  }

  const metadata = getMetadata(TestTable, DatumStaticMetadata);
  expect(metadata.tableName).to.equal("test_table");
  expect(metadata.schemaName).to.equal("test-schema");
}

async function StoreTableNameForMultipleClassesTest() {
  @RegisterTable("user_table", "multi-schema")
  class UserTable extends Table {
    @Index()
    email!: string;

    name!: string;
  }

  @RegisterTable("product_table", "multi-schema")
  class ProductTable extends Table {
    @Index()
    name!: string;

    price!: number;
  }

  const userMetadata = getMetadata(UserTable, DatumStaticMetadata);
  const productMetadata = getMetadata(ProductTable, DatumStaticMetadata);

  expect(userMetadata.tableName).to.equal("user_table");
  expect(userMetadata.schemaName).to.equal("multi-schema");
  expect(productMetadata.tableName).to.equal("product_table");
  expect(productMetadata.schemaName).to.equal("multi-schema");
}

async function PreserveExistingMetadataTest() {
  @RegisterTable("indexed_table", "preserve-schema")
  class IndexedTable extends Table {
    @Index()
    email!: string;

    name!: string;
  }

  const metadata = getMetadata(IndexedTable, DatumStaticMetadata);
  expect(metadata.tableName).to.equal("indexed_table");
  expect(metadata.schemaName).to.equal("preserve-schema");
  expect(metadata.primary).to.equal("_id");
  expect(metadata.indexes).to.have.property("email");
}

async function RegisterTablesInSchemaRegistryTest() {
  @RegisterTable("reg_users", "registry-schema")
  class _RegUser extends Table {}

  @RegisterTable("reg_products", "registry-schema")
  class _RegProduct extends Table {}

  const tables = getTablesForSchema("registry-schema");
  expect(tables).to.not.equal(undefined);
  expect(tables).to.have.property("reg_users");
  expect(tables).to.have.property("reg_products");
}

async function ReturnUndefinedForUnknownSchemaTest() {
  const tables = getTablesForSchema("nonexistent-schema");
  expect(tables).to.equal(undefined);
}
