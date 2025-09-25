import { expect } from 'chai';
import { Database } from '@ajs/database/beta';
import { Table, Index, Fixture } from '@ajs.local/database-decorators/beta/table';
import { BasicDataModel } from '@ajs.local/database-decorators/beta/model';
import { InitializeDatabase } from '@ajs.local/database-decorators/beta/database';
import { RegisterTable, InitializeDatabaseFromSchema } from '@ajs.local/database-decorators/beta/schema';
import { Encrypted, EncryptionModifier } from '@ajs.local/database-decorators/beta/modifiers/encryption';
import { Hashed, HashModifier } from '@ajs.local/database-decorators/beta/modifiers/hash';
import { Localized, LocalizationModifier } from '@ajs.local/database-decorators/beta/modifiers/localization';

describe('Integration - real database operations', () => {
  it('creates and queries user with modifiers', async () => CreateAndQueryUserWithModifiersTest());
  it('performs CRUD operations on products', async () => PerformCrudOperationsOnProductsTest());
  it('handles localized content', async () => HandleLocalizedContentTest());
  it('manages encrypted sensitive data', async () => ManageEncryptedSensitiveDataTest());
  it('validates hashed passwords', async () => ValidateHashedPasswordsTest());
  it('works with schema registration', async () => WorkWithSchemaRegistrationTest());
  it('handles complex relationships', async () => HandleComplexRelationshipsTest());
  it('performs bulk operations', async () => PerformBulkOperationsTest());
  it('manages database initialization', async () => ManageDatabaseInitializationTest());
});

async function CreateAndQueryUserWithModifiersTest() {
  @RegisterTable('users')
  class User extends Table.with(HashModifier, EncryptionModifier) {
    @Index({ primary: true })
    declare id: string;

    @Index()
    declare email: string;

    @Hashed({ algorithm: 'sha256' })
    declare password: string;

    @Encrypted({ secretKey: '12345678901234567890123456789012' })
    declare secretData: Record<string, unknown>;

    declare name: string;
    declare age: number;
  }

  const UserModel = BasicDataModel(User, 'users');
  const database = Database('test-integration-db');
  const userModel = new UserModel(database);

  await InitializeDatabase('test-integration-db', { users: User });

  const userData = {
    email: 'test@example.com',
    password: 'securePassword123',
    secretData: { token: 'secret-token-123' },
    name: 'John Doe',
    age: 30,
  };

  const insertResult = await userModel.insert(userData);
  expect(insertResult).to.have.property('generated_keys');
  expect(insertResult.generated_keys).to.have.length(1);

  const userId = insertResult.generated_keys![0];
  const retrievedUserFromModel = await userModel.get(userId);
  const retrievedUserFromDatabase = await database.table('users').get(userId).run();

  expect(retrievedUserFromModel).to.have.property('email').that.equals('test@example.com');
  expect(retrievedUserFromModel).to.have.property('name').that.equals('John Doe');
  expect(retrievedUserFromModel).to.have.property('age').that.equals(30);
  expect(retrievedUserFromModel?.password).to.not.equal('securePassword123');
  expect(retrievedUserFromModel?.secretData).to.deep.equal({ token: 'secret-token-123' });
  expect(retrievedUserFromDatabase?.secretData).to.not.deep.equal({ token: 'secret-token-123' });

  if (retrievedUserFromModel?.testHash) {
    const isPasswordValid = retrievedUserFromModel.testHash('password', 'securePassword123');
    expect(isPasswordValid).to.equal(true);
  }

  const dbUser = (await database.table('users').get(userId).run()) as {
    email: string;
    name: string;
    password: string;
    secretData: string;
  };
  expect(dbUser).to.have.property('email').that.equals('test@example.com');
  expect(dbUser).to.have.property('name').that.equals('John Doe');
}

async function PerformCrudOperationsOnProductsTest() {
  @RegisterTable('products')
  class Product extends Table {
    @Index({ primary: true })
    declare id: string;

    @Index()
    declare name: string;

    @Index()
    declare category: string;

    declare price: number;
    declare stockQuantity: number;
    declare isActive: boolean;
  }

  const ProductModel = BasicDataModel(Product, 'products');
  const database = Database('test-crud-db');
  const productModel = new ProductModel(database);

  await InitializeDatabase('test-crud-db', { products: Product });

  const productData = {
    name: 'Test Product',
    category: 'Electronics',
    price: 99.99,
    stockQuantity: 50,
    isActive: true,
  };

  const insertResult = await productModel.insert(productData);
  const productId = insertResult.generated_keys![0];

  const retrievedProduct = await productModel.get(productId);
  expect(retrievedProduct).to.have.property('name').that.equals('Test Product');
  expect(retrievedProduct).to.have.property('price').that.equals(99.99);

  const updateData = { price: 89.99, stockQuantity: 45 };
  await productModel.update(productId, updateData);

  const updatedProduct = await productModel.get(productId);
  expect(updatedProduct).to.have.property('price').that.equals(89.99);
  expect(updatedProduct).to.have.property('stockQuantity').that.equals(45);

  await productModel.delete(productId);

  const deletedProduct = await productModel.get(productId);
  expect(deletedProduct).to.equal(undefined);
}

async function HandleLocalizedContentTest() {
  @RegisterTable('localized_content')
  class LocalizedContent extends Table.with(LocalizationModifier) {
    @Index({ primary: true })
    declare id: string;

    declare category: string;

    @Localized({ fallbackLocale: 'en' })
    declare title: string;

    @Localized({ fallbackLocale: 'en' })
    declare description: string;
  }

  const ContentModel = BasicDataModel(LocalizedContent, 'localized_content');
  const database = Database('test-localization-db');
  const contentModel = new ContentModel(database);

  await InitializeDatabase('test-localization-db', { localized_content: LocalizedContent });

  const content = new LocalizedContent();
  content.id = 'content-123';
  content.category = 'News';

  content.localize('en').title = 'English Title';
  content.localize('fr').title = 'French Title';
  content.localize('en').description = 'English Description';
  content.localize('fr').description = 'French Description';

  const insertResult = await contentModel.insert(content);
  const contentId = insertResult.generated_keys![0];

  const retrievedContent = await contentModel.get(contentId);
  expect(retrievedContent).to.have.property('title');
  expect(retrievedContent).to.have.property('description');
  expect(retrievedContent).to.have.property('category').that.equals('News');

  if (retrievedContent?.localize) {
    const frenchContent = retrievedContent.localize('fr');
    expect(frenchContent.title).to.equal('French Title');
    expect(frenchContent.description).to.equal('French Description');

    const englishContent = retrievedContent.localize('en');
    expect(englishContent.title).to.equal('English Title');
    expect(englishContent.description).to.equal('English Description');

    const germanContent = retrievedContent.localize('de');
    expect(germanContent.title).to.equal('English Title');
    expect(germanContent.description).to.equal('English Description');
  }
}

async function ManageEncryptedSensitiveDataTest() {
  @RegisterTable('sensitive_data')
  class SensitiveData extends Table.with(EncryptionModifier) {
    @Index({ primary: true })
    declare id: string;

    @Encrypted({ secretKey: '12345678901234567890123456789012' })
    declare creditCard: string;

    @Encrypted({ secretKey: '12345678901234567890123456789012' })
    declare ssn: string;

    declare userId: string;
  }

  const SensitiveDataModel = BasicDataModel(SensitiveData, 'sensitive_data');
  const database = Database('test-encryption-db');
  const sensitiveDataModel = new SensitiveDataModel(database);

  await InitializeDatabase('test-encryption-db', { sensitive_data: SensitiveData });

  const sensitiveData = {
    creditCard: '4111-1111-1111-1111',
    ssn: '123-45-6789',
    userId: 'user123',
  };

  const insertResult = await sensitiveDataModel.insert(sensitiveData);
  const dataId = insertResult.generated_keys![0];

  const retrievedData = await sensitiveDataModel.get(dataId);
  expect(retrievedData).to.have.property('userId').that.equals('user123');
  expect(retrievedData?.creditCard).to.equal('4111-1111-1111-1111');
  expect(retrievedData?.ssn).to.equal('123-45-6789');

  const dbData = (await database.table('sensitive_data').get(dataId).run()) as {
    userId: string;
    creditCard: string;
    ssn: string;
  };
  expect(dbData).to.have.property('userId').that.equals('user123');
  expect(dbData?.creditCard).to.not.equal('4111-1111-1111-1111');
  expect(dbData?.ssn).to.not.equal('123-45-6789');
}

async function ValidateHashedPasswordsTest() {
  @RegisterTable('user_accounts')
  class UserAccount extends Table.with(HashModifier) {
    @Index({ primary: true })
    declare id: string;

    @Index()
    declare username: string;

    @Hashed({ algorithm: 'sha256' })
    declare password: string;

    declare email: string;
  }

  const UserAccountModel = BasicDataModel(UserAccount, 'user_accounts');
  const database = Database('test-hash-db');
  const userAccountModel = new UserAccountModel(database);

  await InitializeDatabase('test-hash-db', { user_accounts: UserAccount });

  const accountData = {
    username: 'testuser',
    password: 'mySecurePassword123',
    email: 'test@example.com',
  };

  const insertResult = await userAccountModel.insert(accountData);
  const accountId = insertResult.generated_keys![0];

  const retrievedAccount = await userAccountModel.get(accountId);
  expect(retrievedAccount).to.have.property('username').that.equals('testuser');
  expect(retrievedAccount?.password).to.not.equal('mySecurePassword123');

  if (retrievedAccount?.testHash) {
    const isPasswordValid = retrievedAccount.testHash('password', 'mySecurePassword123');
    const isPasswordInvalid = retrievedAccount.testHash('password', 'wrongPassword');

    expect(isPasswordValid).to.equal(true);
    expect(isPasswordInvalid).to.equal(false);
  }
}

async function WorkWithSchemaRegistrationTest() {
  @RegisterTable('schema_users', 'test_schema')
  class SchemaUser extends Table {
    @Index({ primary: true })
    declare id: string;

    @Index()
    declare email: string;

    declare name: string;
  }

  @RegisterTable('schema_products', 'test_schema')
  class SchemaProduct extends Table {
    @Index({ primary: true })
    declare id: string;

    @Index()
    declare name: string;

    declare price: number;
  }

  const databaseName = 'test-schema-integration-db';
  const schemaName = 'test_schema';

  await InitializeDatabaseFromSchema(databaseName, schemaName);

  const database = Database(databaseName);
  const UserModel = BasicDataModel(SchemaUser, 'schema_users');
  const ProductModel = BasicDataModel(SchemaProduct, 'schema_products');

  const userModel = new UserModel(database);
  const productModel = new ProductModel(database);

  const userData = { email: 'user@example.com', name: 'Test User' };
  const productData = { name: 'Test Product', price: 29.99 };

  const userResult = await userModel.insert(userData);
  const productResult = await productModel.insert(productData);

  expect(userResult.generated_keys).to.have.length(1);
  expect(productResult.generated_keys).to.have.length(1);

  const retrievedUser = await userModel.get(userResult.generated_keys![0]);
  const retrievedProduct = await productModel.get(productResult.generated_keys![0]);

  expect(retrievedUser).to.have.property('email').that.equals('user@example.com');
  expect(retrievedProduct).to.have.property('name').that.equals('Test Product');
}

async function HandleComplexRelationshipsTest() {
  @RegisterTable('orders')
  class Order extends Table {
    @Index({ primary: true })
    declare id: string;

    @Index()
    declare customerId: string;

    @Index()
    declare orderDate: Date;

    declare totalAmount: number;
    declare status: string;
  }

  @RegisterTable('order_items')
  class OrderItem extends Table {
    @Index({ primary: true })
    declare id: string;

    @Index()
    declare orderId: string;

    @Index()
    declare productId: string;

    declare quantity: number;
    declare unitPrice: number;
  }

  const OrderModel = BasicDataModel(Order, 'orders');
  const OrderItemModel = BasicDataModel(OrderItem, 'order_items');
  const database = Database('test-relationships-db');

  await InitializeDatabase('test-relationships-db', { orders: Order, order_items: OrderItem });

  const orderModel = new OrderModel(database);
  const orderItemModel = new OrderItemModel(database);

  const orderData = {
    customerId: 'customer123',
    orderDate: new Date(),
    totalAmount: 299.97,
    status: 'pending',
  };

  const orderResult = await orderModel.insert(orderData);
  const orderId = orderResult.generated_keys![0];

  const orderItemsData = [
    { orderId, productId: 'product1', quantity: 2, unitPrice: 99.99 },
    { orderId, productId: 'product2', quantity: 1, unitPrice: 99.99 },
  ];

  const orderItemsResult = await orderItemModel.insert(orderItemsData);
  expect(Object.keys(orderItemsResult.generated_keys || {})).to.have.length(2);

  const retrievedOrder = await orderModel.get(orderId);
  expect(retrievedOrder).to.have.property('customerId').that.equals('customer123');
  expect(retrievedOrder).to.have.property('totalAmount').that.equals(299.97);

  const orderItems = await orderItemModel.getBy('orderId', orderId);
  expect(orderItems).to.be.an('array');
  expect(orderItems).to.have.length(2);
}

async function PerformBulkOperationsTest() {
  @RegisterTable('bulk_products')
  class BulkProduct extends Table {
    @Index({ primary: true })
    declare id: string;

    @Index()
    declare category: string;

    declare name: string;
    declare price: number;
  }

  const BulkProductModel = BasicDataModel(BulkProduct, 'bulk_products');
  const database = Database('test-bulk-db');
  const bulkProductModel = new BulkProductModel(database);

  await InitializeDatabase('test-bulk-db', { bulk_products: BulkProduct });

  const bulkData = [
    { name: 'Product 1', category: 'Electronics', price: 99.99 },
    { name: 'Product 2', category: 'Electronics', price: 149.99 },
    { name: 'Product 3', category: 'Books', price: 19.99 },
    { name: 'Product 4', category: 'Books', price: 29.99 },
    { name: 'Product 5', category: 'Clothing', price: 49.99 },
  ];

  const insertResult = await bulkProductModel.insert(bulkData);
  expect(Object.keys(insertResult.generated_keys || {})).to.have.length(5);

  const allProducts = await bulkProductModel.getAll();
  expect(allProducts).to.be.an('array');
  expect(allProducts).to.have.length(5);

  const electronicsProducts = await bulkProductModel.getBy('category', 'Electronics');
  expect(electronicsProducts).to.be.an('array');
  expect(electronicsProducts).to.have.length(2);

  const booksProducts = await bulkProductModel.getBy('category', 'Books');
  expect(booksProducts).to.be.an('array');
  expect(booksProducts).to.have.length(2);
}

async function ManageDatabaseInitializationTest() {
  @Fixture(() => [
    { id: '1', name: 'Fixture User 1', email: 'fixture1@example.com' },
    { id: '2', name: 'Fixture User 2', email: 'fixture2@example.com' },
  ])
  @RegisterTable('fixture_users')
  class FixtureUser extends Table {
    @Index({ primary: true })
    declare id: string;

    @Index()
    declare email: string;

    declare name: string;
  }

  const databaseName = 'test-fixture-db';
  const initInfo = await InitializeDatabaseFromSchema(databaseName);

  expect(initInfo.databaseStatus).to.be.oneOf(['created', 'unchanged']);
  expect(initInfo.tablesStatus).to.have.property('fixture_users');
  expect(initInfo.oldTables).to.be.an('array');

  const database = Database(databaseName);
  const FixtureUserModel = BasicDataModel(FixtureUser, 'fixture_users');
  const fixtureUserModel = new FixtureUserModel(database);

  const allUsers = await fixtureUserModel.getAll();
  expect(allUsers.length).to.be.greaterThan(0);
}
