import { Database } from '@ajs/database/beta';
import { expect } from 'chai';
import { Product, ProductModel } from '../types/Product';
import { Users, UsersModel } from '../types/Users';
import { Customer, CustomerModel } from '../types/Customer';
import { Orders, OrdersModel } from '../types/Orders';
import { Cart, CartModel } from '../types/Cart';
import { productData } from '../datasets/ProductData';
import { usersData } from '../datasets/UsersData';
import { customerData } from '../datasets/CustomerData';
import { cartData } from '../datasets/CartData';
import { ordersData } from '../datasets/OrdersData';

const db = Database<{
  t_products: Product;
  t_users: Users;
  t_customers: Customer;
  t_orders: Orders;
  t_carts: Cart;
}>('test-database-decorators');

describe('Database Decorators - Real Usage Tests', () => {
  it('Create and retrieve a user', CreateAndRetrieveUserTest);
  it('Create and retrieve a product', CreateAndRetrieveProductTest);
  it('Update a product', UpdateProductTest);
  it('Delete a product', DeleteProductTest);
  it('Create a customer with user data', CreateCustomerWithUserDataTest);
  it('Create a cart with items', CreateCartWithItemsTest);
  it('Create an order with cart and customer', CreateOrderWithCartAndCustomerTest);
  it('Find products by brand', FindProductsByBrandTest);
  it('Find products by category', FindProductsByCategoryTest);
  it('Find active products', FindActiveProductsTest);
  it('Insert multiple products at once', InsertMultipleProductsAtOnceTest);
  it('Insert multiple users at once', InsertMultipleUsersAtOnceTest);
  it('Validate product data structure', ValidateProductDataStructureTest);
  it('Validate user data structure', ValidateUserDataStructureTest);
});

async function CreateAndRetrieveUserTest() {
  const userModel = new UsersModel(db);

  const insertResult = await userModel.insert(usersData[0]);
  expect(insertResult).to.have.property('generated_keys');
  expect(insertResult.generated_keys).to.have.length(1);

  const userId = insertResult.generated_keys![0];
  const retrievedUser = await userModel.get(userId);
  expect(retrievedUser).to.have.property('name', usersData[0].name);
  expect(retrievedUser).to.have.property('email', usersData[0].email);
  expect(retrievedUser).to.have.property('role', usersData[0].role);

  const dbUser = await db.table('t_users').get(userId).run();
  expect(dbUser).to.not.equal(undefined);
  expect(dbUser).to.have.property('name', usersData[0].name);
  expect(dbUser).to.have.property('email', usersData[0].email);
  expect(dbUser).to.have.property('role', usersData[0].role);
  expect(dbUser).to.have.property('age', usersData[0].age);
  expect(dbUser).to.have.property('is_active', usersData[0].is_active);
}

async function CreateAndRetrieveProductTest() {
  const productModel = new ProductModel(db);

  const insertResult = await productModel.insert(productData[0]);
  expect(insertResult).to.have.property('generated_keys');
  expect(insertResult.generated_keys).to.have.length(1);

  const productId = insertResult.generated_keys![0];
  const retrievedProduct = await productModel.get(productId);
  expect(retrievedProduct).to.have.property('name', productData[0].name);
  expect(retrievedProduct).to.have.property('price', productData[0].price);
  expect(retrievedProduct).to.have.property('brand', productData[0].brand);

  const dbProduct = await db.table('t_products').get(productId).run();
  expect(dbProduct).to.not.equal(undefined);
  expect(dbProduct).to.have.property('name', productData[0].name);
  expect(dbProduct).to.have.property('price', productData[0].price);
  expect(dbProduct).to.have.property('brand', productData[0].brand);
  expect(dbProduct).to.have.property('category', productData[0].category);
  expect(dbProduct).to.have.property('is_active', productData[0].is_active);
}

async function UpdateProductTest() {
  const productModel = new ProductModel(db);

  const insertResult = await productModel.insert(productData[1]);
  const productId = insertResult.generated_keys![0];

  const updateData = {
    price: 1899.99,
    stock_quantity: 20,
  };

  await productModel.update(productId, updateData);

  const updatedProduct = await productModel.get(productId);
  expect(updatedProduct).to.have.property('price', 1899.99);
  expect(updatedProduct).to.have.property('stock_quantity', 20);

  const dbProduct = await db.table('t_products').get(productId).run();
  expect(dbProduct).to.not.equal(undefined);
  expect(dbProduct).to.have.property('price', 1899.99);
  expect(dbProduct).to.have.property('stock_quantity', 20);
  expect(dbProduct).to.have.property('name', productData[1].name);
}

async function DeleteProductTest() {
  const productModel = new ProductModel(db);

  const insertResult = await productModel.insert(productData[2]);
  const productId = insertResult.generated_keys![0];

  await productModel.delete(productId);

  const deletedProduct = await productModel.get(productId);
  expect(deletedProduct).to.equal(undefined);

  const dbProduct = await db.table('t_products').get(productId).run();
  expect(dbProduct).to.equal(undefined);
}

async function CreateCustomerWithUserDataTest() {
  const userModel = new UsersModel(db);
  const customerModel = new CustomerModel(db);

  const userResult = await userModel.insert(usersData[1]);
  const userId = userResult.generated_keys![0];

  const customerDataWithUserId = {
    ...customerData[0],
    user_id: userId,
  };

  const customerResult = await customerModel.insert(customerDataWithUserId);
  expect(customerResult).to.have.property('generated_keys');
  expect(customerResult.generated_keys).to.have.length(1);

  const customerId = customerResult.generated_keys![0];
  const dbCustomer = await db.table('t_customers').get(customerId).run();
  expect(dbCustomer).to.not.equal(undefined);
  expect(dbCustomer).to.have.property('user_id', userId);
  expect(dbCustomer).to.have.property('phone', customerData[0].phone);
  expect(dbCustomer).to.have.property('address');
  if (dbCustomer && dbCustomer.address && customerData[0].address) {
    expect(dbCustomer.address).to.have.property('street', customerData[0].address.street);
    expect(dbCustomer.address).to.have.property('city', customerData[0].address.city);
  }
}

async function CreateCartWithItemsTest() {
  const productModel = new ProductModel(db);
  const customerModel = new CustomerModel(db);
  const cartModel = new CartModel(db);

  const productResult = await productModel.insert(productData[3]);
  const productId = productResult.generated_keys![0];
  const retrievedProduct = await productModel.get(productId);

  const customerResult = await customerModel.insert(customerData[1]);
  const customerId = customerResult.generated_keys![0];

  const cartDataWithIds = {
    ...cartData[0],
    customer_id: customerId,
    items: [
      {
        product_id: productId,
        quantity: 2,
        price: retrievedProduct!.price,
      },
    ],
    total_amount: (retrievedProduct!.price || 0) * 2,
  };

  const cartResult = await cartModel.insert(cartDataWithIds);
  expect(cartResult).to.have.property('generated_keys');
  expect(cartResult.generated_keys).to.have.length(1);

  const cartId = cartResult.generated_keys![0];
  const dbCart = await db.table('t_carts').get(cartId).run();
  expect(dbCart).to.not.equal(undefined);
  expect(dbCart).to.have.property('customer_id', customerId);
  expect(dbCart).to.have.property('items');
  if (dbCart && dbCart.items) {
    expect(dbCart.items).to.have.length(1);
    expect(dbCart.items[0]).to.have.property('product_id', productId);
    expect(dbCart.items[0]).to.have.property('quantity', 2);
    expect(dbCart.items[0]).to.have.property('price', retrievedProduct!.price);
  }
  expect(dbCart).to.have.property('total_amount', (retrievedProduct!.price || 0) * 2);
}

async function CreateOrderWithCartAndCustomerTest() {
  const userModel = new UsersModel(db);
  const customerModel = new CustomerModel(db);
  const productModel = new ProductModel(db);
  const cartModel = new CartModel(db);
  const orderModel = new OrdersModel(db);

  const userResult = await userModel.insert(usersData[2]);
  const userId = userResult.generated_keys![0];

  const customerResult = await customerModel.insert({
    ...customerData[2],
    user_id: userId,
  });
  const customerId = customerResult.generated_keys![0];

  const productResult = await productModel.insert(productData[4]);
  const productId = productResult.generated_keys![0];
  const retrievedProduct = await productModel.get(productId);

  const cartResult = await cartModel.insert({
    ...cartData[1],
    customer_id: customerId,
    items: [
      {
        product_id: productId,
        quantity: 1,
        price: retrievedProduct!.price,
      },
    ],
    total_amount: retrievedProduct!.price,
  });
  const cartId = cartResult.generated_keys![0];

  const orderResult = await orderModel.insert({
    ...ordersData[1],
    customer_id: customerId,
    cart_id: cartId,
    items: [
      {
        product_id: productId,
        quantity: 1,
        price: retrievedProduct!.price,
        total: retrievedProduct!.price,
      },
    ],
    subtotal: retrievedProduct!.price,
    total_amount: (retrievedProduct!.price || 0) * 1.2,
  });

  expect(orderResult).to.have.property('generated_keys');
  expect(orderResult.generated_keys).to.have.length(1);

  const orderId = orderResult.generated_keys![0];
  const dbOrder = await db.table('t_orders').get(orderId).run();
  expect(dbOrder).to.not.equal(undefined);
  expect(dbOrder).to.have.property('customer_id', customerId);
  expect(dbOrder).to.have.property('cart_id', cartId);
  expect(dbOrder).to.have.property('items');
  if (dbOrder && dbOrder.items) {
    expect(dbOrder.items).to.have.length(1);
    expect(dbOrder.items[0]).to.have.property('product_id', productId);
    expect(dbOrder.items[0]).to.have.property('quantity', 1);
    expect(dbOrder.items[0]).to.have.property('price', retrievedProduct!.price);
    expect(dbOrder.items[0]).to.have.property('total', retrievedProduct!.price);
  }
  expect(dbOrder).to.have.property('subtotal', retrievedProduct!.price);
  expect(dbOrder).to.have.property('total_amount', (retrievedProduct!.price || 0) * 1.2);
}

async function FindProductsByBrandTest() {
  const productModel = new ProductModel(db);

  await productModel.insert(productData);

  const appleProducts = await productModel.getBy('brand', 'Apple');
  expect(appleProducts.length).to.be.greaterThan(0);

  const samsungProducts = await productModel.getBy('brand', 'Samsung');
  expect(samsungProducts.length).to.be.greaterThan(0);

  const dbAppleProducts = await db.table('t_products').getAll('brand', 'Apple').run();
  expect(dbAppleProducts.length).to.be.greaterThan(0);
  dbAppleProducts.forEach((product) => {
    expect(product.brand).to.equal('Apple');
  });

  const dbSamsungProducts = await db.table('t_products').getAll('brand', 'Samsung').run();
  expect(dbSamsungProducts.length).to.be.greaterThan(0);
  expect(dbSamsungProducts[0].brand).to.equal('Samsung');
}

async function FindProductsByCategoryTest() {
  const productModel = new ProductModel(db);

  await productModel.insert(productData);

  const electronicsProducts = await productModel.getBy('category', 'Electronics');
  expect(electronicsProducts.length).to.be.greaterThan(0);

  const clothingProducts = await productModel.getBy('category', 'Sport');
  expect(clothingProducts.length).to.be.greaterThan(0);

  const dbElectronicsProducts = await db.table('t_products').getAll('category', 'Electronics').run();
  expect(dbElectronicsProducts.length).to.be.greaterThan(0);
  dbElectronicsProducts.forEach((product) => {
    expect(product.category).to.equal('Electronics');
  });

  const dbClothingProducts = await db.table('t_products').getAll('category', 'Sport').run();
  expect(dbClothingProducts.length).to.be.greaterThan(0);
  expect(dbClothingProducts[0].category).to.equal('Sport');
}

async function FindActiveProductsTest() {
  const productModel = new ProductModel(db);

  await productModel.insert(productData);

  const activeProducts = await productModel.getBy('is_active', true);
  expect(activeProducts.length).to.be.greaterThan(0);

  const dbActiveProducts = await db.table('t_products').getAll('is_active', true).run();
  expect(dbActiveProducts.length).to.be.greaterThan(0);
  dbActiveProducts.forEach((product) => {
    expect(product.is_active).to.equal(true);
  });
}

async function InsertMultipleProductsAtOnceTest() {
  const productModel = new ProductModel(db);

  const insertResults = await productModel.insert(productData);
  expect(insertResults).to.have.property('generated_keys');
  expect(insertResults.generated_keys).to.have.length(5);
  insertResults.generated_keys!.forEach((key: string) => {
    expect(key).to.be.a('string');
  });

  const dbProducts = await db.table('t_products').run();
  expect(dbProducts.length).to.be.greaterThanOrEqual(5);

  const productNames = dbProducts.map((p) => p.name).sort();
  const expectedNames = productData.map((p) => p.name).sort();
  expect(productNames).to.include.members(expectedNames);
}

async function InsertMultipleUsersAtOnceTest() {
  const userModel = new UsersModel(db);

  const insertResults = await userModel.insert(usersData);
  expect(insertResults).to.have.property('generated_keys');
  expect(insertResults.generated_keys).to.have.length(5);
  insertResults.generated_keys!.forEach((key: string) => {
    expect(key).to.be.a('string');
  });

  const dbUsers = await db.table('t_users').run();
  expect(dbUsers.length).to.be.greaterThanOrEqual(5);

  const userNames = dbUsers.map((u) => u.name).sort();
  const expectedNames = usersData.map((u) => u.name).sort();
  expect(userNames).to.include.members(expectedNames);
}

async function ValidateProductDataStructureTest() {
  const productModel = new ProductModel(db);

  const product = await productModel.insert(productData[0]);
  expect(product).to.have.property('generated_keys');
  expect(product.generated_keys).to.have.length(1);

  const productId = product.generated_keys![0];
  const dbProduct = await db.table('t_products').get(productId).run();
  expect(dbProduct).to.not.equal(undefined);
  expect(dbProduct).to.have.property('_id');
  expect(dbProduct).to.have.property('name');
  expect(dbProduct).to.have.property('description');
  expect(dbProduct).to.have.property('price');
  expect(dbProduct).to.have.property('stock_quantity');
  expect(dbProduct).to.have.property('category');
  expect(dbProduct).to.have.property('brand');
  expect(dbProduct).to.have.property('is_active');
  expect(dbProduct).to.have.property('images');
  expect(dbProduct).to.have.property('tags');
  expect(dbProduct).to.have.property('total_sold');
}

async function ValidateUserDataStructureTest() {
  const userModel = new UsersModel(db);

  const user = await userModel.insert(usersData[0]);
  expect(user).to.have.property('generated_keys');
  expect(user.generated_keys).to.have.length(1);

  const userId = user.generated_keys![0];
  const dbUser = await db.table('t_users').get(userId).run();
  expect(dbUser).to.not.equal(undefined);
  expect(dbUser).to.have.property('_id');
  expect(dbUser).to.have.property('name');
  expect(dbUser).to.have.property('email');
  expect(dbUser).to.have.property('password');
  expect(dbUser).to.have.property('role');
  expect(dbUser).to.have.property('age');
  expect(dbUser).to.have.property('is_active');
}
