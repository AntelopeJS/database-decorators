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
}>('test-advanced-features');

describe('Database Decorators - Advanced Features', () => {
  it('Insert multiple products in one operation', InsertMultipleProductsTest);
  it('Retrieve all active products', RetrieveAllActiveProductsTest);
  it('Handle product transaction workflow', HandleProductTransactionWorkflowTest);
  it('Handle inventory management business logic', HandleInventoryManagementTest);
  it('Handle order status management', HandleOrderStatusManagementTest);
  it('Retrieve products by multiple criteria', RetrieveProductsByMultipleCriteriaTest);
});

async function InsertMultipleProductsTest() {
  const productModel = new ProductModel(db);

  const productsToInsert = productData.slice(0, 3);

  const insertResults = await productModel.insert(productsToInsert);
  expect(insertResults).to.have.property('generated_keys');
  expect(insertResults.generated_keys).to.have.length(3);
  insertResults.generated_keys!.forEach((key: string) => {
    expect(key).to.be.a('string');
  });

  const dbProducts = await db.table('t_products').run();
  expect(dbProducts.length).to.be.greaterThanOrEqual(3);

  const insertedProductNames = productsToInsert.map((p) => p.name).sort();
  const dbProductNames = dbProducts.map((p) => p.name).sort();
  expect(dbProductNames).to.include.members(insertedProductNames);
}

async function RetrieveAllActiveProductsTest() {
  const productModel = new ProductModel(db);

  const activeProducts = productData.filter((product) => product.is_active === true);
  const inactiveProducts = productData.filter((product) => product.is_active === false);

  if (activeProducts.length > 0) {
    await productModel.insert(activeProducts[0]);
  }
  if (inactiveProducts.length > 0) {
    await productModel.insert(inactiveProducts[0]);
  }
  if (activeProducts.length > 1) {
    await productModel.insert(activeProducts[1]);
  }

  const retrievedActiveProducts = await productModel.getBy('is_active', true);
  expect(retrievedActiveProducts.length).to.be.greaterThan(0);
  retrievedActiveProducts.forEach((product: Product) => {
    expect(product.is_active).to.equal(true);
  });

  const dbActiveProducts = await db.table('t_products').getAll('is_active', true).run();
  expect(dbActiveProducts.length).to.be.greaterThan(0);
  dbActiveProducts.forEach((product) => {
    expect(product.is_active).to.equal(true);
  });
}

async function HandleProductTransactionWorkflowTest() {
  const userModel = new UsersModel(db);
  const customerModel = new CustomerModel(db);
  const productModel = new ProductModel(db);
  const cartModel = new CartModel(db);
  const orderModel = new OrdersModel(db);

  const userResult = await userModel.insert(usersData[0]);
  const userId = userResult.generated_keys![0];

  const customerResult = await customerModel.insert({
    ...customerData[0],
    user_id: userId,
  });
  const customerId = customerResult.generated_keys![0];

  const productResult = await productModel.insert(productData[0]);
  const productId = productResult.generated_keys![0];
  const retrievedProduct = await productModel.get(productId);

  const cartResult = await cartModel.insert({
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
  });
  const cartId = cartResult.generated_keys![0];

  const orderResult = await orderModel.insert({
    ...ordersData[0],
    customer_id: customerId,
    cart_id: cartId,
    items: [
      {
        product_id: productId,
        quantity: 2,
        price: retrievedProduct!.price,
        total: (retrievedProduct!.price || 0) * 2,
      },
    ],
    subtotal: (retrievedProduct!.price || 0) * 2,
    total_amount: (retrievedProduct!.price || 0) * 2 * 1.2,
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
    expect(dbOrder.items[0]).to.have.property('quantity', 2);
    expect(dbOrder.items[0]).to.have.property('total', (retrievedProduct!.price || 0) * 2);
  }
}

async function HandleInventoryManagementTest() {
  const productModel = new ProductModel(db);

  const productResult = await productModel.insert(productData[1]);
  const productId = productResult.generated_keys![0];
  const retrievedProduct = await productModel.get(productId);

  const initialStock = retrievedProduct!.stock_quantity;
  const quantityToSell = 2;

  if (initialStock >= quantityToSell) {
    await productModel.update(productId, {
      stock_quantity: initialStock - quantityToSell,
      total_sold: (retrievedProduct!.total_sold || 0) + quantityToSell,
    });

    const updatedProduct = await productModel.get(productId);
    expect(updatedProduct!.stock_quantity).to.equal(initialStock - quantityToSell);
    expect(updatedProduct!.total_sold).to.equal((retrievedProduct!.total_sold || 0) + quantityToSell);

    const dbProduct = await db.table('t_products').get(productId).run();
    expect(dbProduct).to.not.equal(undefined);
    expect(dbProduct).to.have.property('stock_quantity', initialStock - quantityToSell);
    expect(dbProduct).to.have.property('total_sold', (retrievedProduct!.total_sold || 0) + quantityToSell);
  }
}

async function HandleOrderStatusManagementTest() {
  const orderModel = new OrdersModel(db);

  const orderResult = await orderModel.insert(ordersData[0]);
  const orderId = orderResult.generated_keys![0];

  const statuses: Orders['status'][] = ['pending', 'confirmed', 'shipped', 'delivered'];

  for (const status of statuses) {
    await orderModel.update(orderId, { status });
    const updatedOrder = await orderModel.get(orderId);
    expect(updatedOrder!.status).to.equal(status);

    const dbOrder = await db.table('t_orders').get(orderId).run();
    expect(dbOrder).to.not.equal(undefined);
    expect(dbOrder).to.have.property('status', status);
  }
}

async function RetrieveProductsByMultipleCriteriaTest() {
  const productModel = new ProductModel(db);

  await productModel.insert(productData);

  const activeProducts = await productModel.getBy('is_active', true);
  expect(activeProducts.length).to.be.greaterThan(0);

  const electronicsProducts = activeProducts.filter((product: Product) => product.category === 'Electronics');
  expect(electronicsProducts.length).to.be.greaterThan(0);

  const expensiveProducts = activeProducts.filter((product: Product) => (product.price || 0) > 1000);
  expect(expensiveProducts.length).to.be.greaterThan(0);

  const dbActiveProducts = await db.table('t_products').getAll('is_active', true).run();
  expect(dbActiveProducts.length).to.be.greaterThan(0);

  const dbElectronicsProducts = dbActiveProducts.filter((product) => product.category === 'Electronics');
  expect(dbElectronicsProducts.length).to.be.greaterThan(0);

  const dbExpensiveProducts = dbActiveProducts.filter((product) => (product.price || 0) > 1000);
  expect(dbExpensiveProducts.length).to.be.greaterThan(0);
}
