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
}>('test-playground-features');

describe('Database Decorators - Playground Features', () => {
  it('Create and retrieve a user with all fields', CreateAndRetrieveUserWithAllFieldsTest);
  it('Create and retrieve a product with all fields', CreateAndRetrieveProductWithAllFieldsTest);
  it('Create and retrieve a customer with all fields', CreateAndRetrieveCustomerWithAllFieldsTest);
  it('Create and retrieve a cart with all fields', CreateAndRetrieveCartWithAllFieldsTest);
  it('Create and retrieve an order with all fields', CreateAndRetrieveOrderWithAllFieldsTest);
  it('Update a user with all fields', UpdateUserWithAllFieldsTest);
  it('Update a product with all fields', UpdateProductWithAllFieldsTest);
  it('Update a customer with all fields', UpdateCustomerWithAllFieldsTest);
  it('Update a cart with all fields', UpdateCartWithAllFieldsTest);
  it('Update an order with all fields', UpdateOrderWithAllFieldsTest);
  it('Delete a user and verify', DeleteUserAndVerifyTest);
  it('Delete a product and verify', DeleteProductAndVerifyTest);
  it('Delete a customer and verify', DeleteCustomerAndVerifyTest);
  it('Delete a cart and verify', DeleteCartAndVerifyTest);
  it('Delete an order and verify', DeleteOrderAndVerifyTest);
});

async function CreateAndRetrieveUserWithAllFieldsTest() {
  const userModel = new UsersModel(db);

  const insertResult = await userModel.insert(usersData[0]);
  expect(insertResult).to.have.property('generated_keys');
  expect(insertResult.generated_keys).to.have.length(1);

  const userId = insertResult.generated_keys![0];
  const retrievedUser = await userModel.get(userId);
  expect(retrievedUser).to.have.property('name', usersData[0].name);
  expect(retrievedUser).to.have.property('email', usersData[0].email);
  expect(retrievedUser).to.have.property('password', usersData[0].password);
  expect(retrievedUser).to.have.property('role', usersData[0].role);
  expect(retrievedUser).to.have.property('age', usersData[0].age);
  expect(retrievedUser).to.have.property('is_active', usersData[0].is_active);

  const dbUser = await db.table('t_users').get(userId).run();
  expect(dbUser).to.not.equal(undefined);
  expect(dbUser).to.have.property('name', usersData[0].name);
  expect(dbUser).to.have.property('email', usersData[0].email);
  expect(dbUser).to.have.property('password', usersData[0].password);
  expect(dbUser).to.have.property('role', usersData[0].role);
  expect(dbUser).to.have.property('age', usersData[0].age);
  expect(dbUser).to.have.property('is_active', usersData[0].is_active);
}

async function CreateAndRetrieveProductWithAllFieldsTest() {
  const productModel = new ProductModel(db);

  const insertResult = await productModel.insert(productData[0]);
  expect(insertResult).to.have.property('generated_keys');
  expect(insertResult.generated_keys).to.have.length(1);

  const productId = insertResult.generated_keys![0];
  const retrievedProduct = await productModel.get(productId);
  expect(retrievedProduct).to.have.property('name', productData[0].name);
  expect(retrievedProduct).to.have.property('description', productData[0].description);
  expect(retrievedProduct).to.have.property('price', productData[0].price);
  expect(retrievedProduct).to.have.property('stock_quantity', productData[0].stock_quantity);
  expect(retrievedProduct).to.have.property('category', productData[0].category);
  expect(retrievedProduct).to.have.property('brand', productData[0].brand);
  expect(retrievedProduct).to.have.property('is_active', productData[0].is_active);
  expect(retrievedProduct).to.have.property('images');
  expect(retrievedProduct).to.have.property('tags');
  expect(retrievedProduct).to.have.property('total_sold', productData[0].total_sold);

  const dbProduct = await db.table('t_products').get(productId).run();
  expect(dbProduct).to.not.equal(undefined);
  expect(dbProduct).to.have.property('name', productData[0].name);
  expect(dbProduct).to.have.property('description', productData[0].description);
  expect(dbProduct).to.have.property('price', productData[0].price);
  expect(dbProduct).to.have.property('stock_quantity', productData[0].stock_quantity);
  expect(dbProduct).to.have.property('category', productData[0].category);
  expect(dbProduct).to.have.property('brand', productData[0].brand);
  expect(dbProduct).to.have.property('is_active', productData[0].is_active);
  expect(dbProduct).to.have.property('images');
  expect(dbProduct).to.have.property('tags');
  expect(dbProduct).to.have.property('total_sold', productData[0].total_sold);
}

async function CreateAndRetrieveCustomerWithAllFieldsTest() {
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
  const retrievedCustomer = await customerModel.get(customerId);
  expect(retrievedCustomer).to.have.property('user_id', userId);
  expect(retrievedCustomer).to.have.property('phone', customerData[0].phone);
  expect(retrievedCustomer).to.have.property('address');
  if (retrievedCustomer && retrievedCustomer.address && customerData[0].address) {
    expect(retrievedCustomer.address).to.have.property('street', customerData[0].address.street);
    expect(retrievedCustomer.address).to.have.property('city', customerData[0].address.city);
    expect(retrievedCustomer.address).to.have.property('postal_code', customerData[0].address.postal_code);
    expect(retrievedCustomer.address).to.have.property('country', customerData[0].address.country);
  }

  const dbCustomer = await db.table('t_customers').get(customerId).run();
  expect(dbCustomer).to.not.equal(undefined);
  expect(dbCustomer).to.have.property('user_id', userId);
  expect(dbCustomer).to.have.property('phone', customerData[0].phone);
  expect(dbCustomer).to.have.property('address');
  if (dbCustomer && dbCustomer.address && customerData[0].address) {
    expect(dbCustomer.address).to.have.property('street', customerData[0].address.street);
    expect(dbCustomer.address).to.have.property('city', customerData[0].address.city);
    expect(dbCustomer.address).to.have.property('postal_code', customerData[0].address.postal_code);
    expect(dbCustomer.address).to.have.property('country', customerData[0].address.country);
  }
}

async function CreateAndRetrieveCartWithAllFieldsTest() {
  const productModel = new ProductModel(db);
  const customerModel = new CustomerModel(db);
  const cartModel = new CartModel(db);

  const productResult = await productModel.insert(productData[1]);
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
        quantity: 3,
        price: retrievedProduct!.price,
      },
    ],
    total_amount: (retrievedProduct!.price || 0) * 3,
  };

  const cartResult = await cartModel.insert(cartDataWithIds);
  expect(cartResult).to.have.property('generated_keys');
  expect(cartResult.generated_keys).to.have.length(1);

  const cartId = cartResult.generated_keys![0];
  const retrievedCart = await cartModel.get(cartId);
  expect(retrievedCart).to.have.property('customer_id', customerId);
  expect(retrievedCart).to.have.property('items');
  if (retrievedCart && retrievedCart.items) {
    expect(retrievedCart.items).to.have.length(1);
    expect(retrievedCart.items[0]).to.have.property('product_id', productId);
    expect(retrievedCart.items[0]).to.have.property('quantity', 3);
    expect(retrievedCart.items[0]).to.have.property('price', retrievedProduct!.price);
  }
  expect(retrievedCart).to.have.property('total_amount', (retrievedProduct!.price || 0) * 3);

  const dbCart = await db.table('t_carts').get(cartId).run();
  expect(dbCart).to.not.equal(undefined);
  expect(dbCart).to.have.property('customer_id', customerId);
  expect(dbCart).to.have.property('items');
  if (dbCart && dbCart.items) {
    expect(dbCart.items).to.have.length(1);
    expect(dbCart.items[0]).to.have.property('product_id', productId);
    expect(dbCart.items[0]).to.have.property('quantity', 3);
    expect(dbCart.items[0]).to.have.property('price', retrievedProduct!.price);
  }
  expect(dbCart).to.have.property('total_amount', (retrievedProduct!.price || 0) * 3);
}

async function CreateAndRetrieveOrderWithAllFieldsTest() {
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

  const productResult = await productModel.insert(productData[2]);
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
    ...ordersData[0],
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
  const retrievedOrder = await orderModel.get(orderId);
  expect(retrievedOrder).to.have.property('customer_id', customerId);
  expect(retrievedOrder).to.have.property('cart_id', cartId);
  expect(retrievedOrder).to.have.property('items');
  if (retrievedOrder && retrievedOrder.items) {
    expect(retrievedOrder.items).to.have.length(1);
    expect(retrievedOrder.items[0]).to.have.property('product_id', productId);
    expect(retrievedOrder.items[0]).to.have.property('quantity', 1);
    expect(retrievedOrder.items[0]).to.have.property('price', retrievedProduct!.price);
    expect(retrievedOrder.items[0]).to.have.property('total', retrievedProduct!.price);
  }
  expect(retrievedOrder).to.have.property('subtotal', retrievedProduct!.price);
  expect(retrievedOrder).to.have.property('tax_amount', ordersData[0].tax_amount);
  expect(retrievedOrder).to.have.property('shipping_amount', ordersData[0].shipping_amount);
  expect(retrievedOrder).to.have.property('total_amount', (retrievedProduct!.price || 0) * 1.2);
  expect(retrievedOrder).to.have.property('status', ordersData[0].status);
  expect(retrievedOrder).to.have.property('payment_status', ordersData[0].payment_status);
  expect(retrievedOrder).to.have.property('shipping_address');
  if (retrievedOrder && retrievedOrder.shipping_address && ordersData[0].shipping_address) {
    expect(retrievedOrder.shipping_address).to.have.property('street', ordersData[0].shipping_address.street);
    expect(retrievedOrder.shipping_address).to.have.property('city', ordersData[0].shipping_address.city);
  }

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
  expect(dbOrder).to.have.property('tax_amount', ordersData[0].tax_amount);
  expect(dbOrder).to.have.property('shipping_amount', ordersData[0].shipping_amount);
  expect(dbOrder).to.have.property('total_amount', (retrievedProduct!.price || 0) * 1.2);
  expect(dbOrder).to.have.property('status', ordersData[0].status);
  expect(dbOrder).to.have.property('payment_status', ordersData[0].payment_status);
  expect(dbOrder).to.have.property('shipping_address');
  if (dbOrder && dbOrder.shipping_address && ordersData[0].shipping_address) {
    expect(dbOrder.shipping_address).to.have.property('street', ordersData[0].shipping_address.street);
    expect(dbOrder.shipping_address).to.have.property('city', ordersData[0].shipping_address.city);
  }
}

async function UpdateUserWithAllFieldsTest() {
  const userModel = new UsersModel(db);

  const insertResult = await userModel.insert(usersData[3]);
  const userId = insertResult.generated_keys![0];

  const updateData = {
    name: 'Updated User Name',
    email: 'updated@example.com',
    password: 'newpassword123',
    role: 'admin' as const,
    age: 35,
    is_active: false,
  };

  await userModel.update(userId, updateData);

  const updatedUser = await userModel.get(userId);
  expect(updatedUser).to.have.property('name', updateData.name);
  expect(updatedUser).to.have.property('email', updateData.email);
  expect(updatedUser).to.have.property('password', updateData.password);
  expect(updatedUser).to.have.property('role', updateData.role);
  expect(updatedUser).to.have.property('age', updateData.age);
  expect(updatedUser).to.have.property('is_active', updateData.is_active);

  const dbUser = await db.table('t_users').get(userId).run();
  expect(dbUser).to.not.equal(undefined);
  expect(dbUser).to.have.property('name', updateData.name);
  expect(dbUser).to.have.property('email', updateData.email);
  expect(dbUser).to.have.property('password', updateData.password);
  expect(dbUser).to.have.property('role', updateData.role);
  expect(dbUser).to.have.property('age', updateData.age);
  expect(dbUser).to.have.property('is_active', updateData.is_active);
}

async function UpdateProductWithAllFieldsTest() {
  const productModel = new ProductModel(db);

  const insertResult = await productModel.insert(productData[3]);
  const productId = insertResult.generated_keys![0];

  const updateData = {
    name: 'Updated Product Name',
    description: 'Updated product description',
    price: 2999.99,
    stock_quantity: 50,
    category: 'Updated Category',
    brand: 'Updated Brand',
    is_active: false,
    images: ['updated-image-1.jpg', 'updated-image-2.jpg'],
    tags: ['updated', 'product', 'tag'],
    total_sold: 100,
  };

  await productModel.update(productId, updateData);

  const updatedProduct = await productModel.get(productId);
  expect(updatedProduct).to.have.property('name', updateData.name);
  expect(updatedProduct).to.have.property('description', updateData.description);
  expect(updatedProduct).to.have.property('price', updateData.price);
  expect(updatedProduct).to.have.property('stock_quantity', updateData.stock_quantity);
  expect(updatedProduct).to.have.property('category', updateData.category);
  expect(updatedProduct).to.have.property('brand', updateData.brand);
  expect(updatedProduct).to.have.property('is_active', updateData.is_active);
  expect(updatedProduct).to.have.property('images');
  expect(updatedProduct).to.have.property('tags');
  expect(updatedProduct).to.have.property('total_sold', updateData.total_sold);

  const dbProduct = await db.table('t_products').get(productId).run();
  expect(dbProduct).to.not.equal(undefined);
  expect(dbProduct).to.have.property('name', updateData.name);
  expect(dbProduct).to.have.property('description', updateData.description);
  expect(dbProduct).to.have.property('price', updateData.price);
  expect(dbProduct).to.have.property('stock_quantity', updateData.stock_quantity);
  expect(dbProduct).to.have.property('category', updateData.category);
  expect(dbProduct).to.have.property('brand', updateData.brand);
  expect(dbProduct).to.have.property('is_active', updateData.is_active);
  expect(dbProduct).to.have.property('images');
  expect(dbProduct).to.have.property('tags');
  expect(dbProduct).to.have.property('total_sold', updateData.total_sold);
}

async function UpdateCustomerWithAllFieldsTest() {
  const userModel = new UsersModel(db);
  const customerModel = new CustomerModel(db);

  const userResult = await userModel.insert(usersData[4]);
  const userId = userResult.generated_keys![0];

  const customerResult = await customerModel.insert({
    ...customerData[3],
    user_id: userId,
  });
  const customerId = customerResult.generated_keys![0];

  const updateData = {
    phone: '+1-555-999-8888',
    address: {
      street: 'Updated Street Address',
      city: 'Updated City',
      postal_code: '99999',
      country: 'Updated Country',
    },
  };

  await customerModel.update(customerId, updateData);

  const updatedCustomer = await customerModel.get(customerId);
  expect(updatedCustomer).to.have.property('phone', updateData.phone);
  expect(updatedCustomer).to.have.property('address');
  if (updatedCustomer && updatedCustomer.address && customerData[0].address) {
    expect(updatedCustomer.address).to.have.property('street', updateData.address.street);
    expect(updatedCustomer.address).to.have.property('city', updateData.address.city);
    expect(updatedCustomer.address).to.have.property('postal_code', updateData.address.postal_code);
    expect(updatedCustomer.address).to.have.property('country', updateData.address.country);
  }

  const dbCustomer = await db.table('t_customers').get(customerId).run();
  expect(dbCustomer).to.not.equal(undefined);
  expect(dbCustomer).to.have.property('user_id', userId);
  expect(dbCustomer).to.have.property('phone', updateData.phone);
  expect(dbCustomer).to.have.property('address');
  if (dbCustomer && dbCustomer.address && customerData[0].address) {
    expect(dbCustomer.address).to.have.property('street', updateData.address.street);
    expect(dbCustomer.address).to.have.property('city', updateData.address.city);
    expect(dbCustomer.address).to.have.property('postal_code', updateData.address.postal_code);
    expect(dbCustomer.address).to.have.property('country', updateData.address.country);
  }
}

async function UpdateCartWithAllFieldsTest() {
  const productModel = new ProductModel(db);
  const customerModel = new CustomerModel(db);
  const cartModel = new CartModel(db);

  const productResult = await productModel.insert(productData[4]);
  const productId = productResult.generated_keys![0];
  const retrievedProduct = await productModel.get(productId);

  const customerResult = await customerModel.insert(customerData[4]);
  const customerId = customerResult.generated_keys![0];

  const cartResult = await cartModel.insert({
    ...cartData[2],
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

  const updateData = {
    items: [
      {
        product_id: productId,
        quantity: 5,
        price: retrievedProduct!.price,
      },
    ],
    total_amount: (retrievedProduct!.price || 0) * 5,
  };

  await cartModel.update(cartId, updateData);

  const updatedCart = await cartModel.get(cartId);
  expect(updatedCart).to.have.property('items');
  if (updatedCart && updatedCart.items) {
    expect(updatedCart.items).to.have.length(1);
    expect(updatedCart.items[0]).to.have.property('product_id', productId);
    expect(updatedCart.items[0]).to.have.property('quantity', 5);
    expect(updatedCart.items[0]).to.have.property('price', retrievedProduct!.price);
  }
  expect(updatedCart).to.have.property('total_amount', (retrievedProduct!.price || 0) * 5);

  const dbCart = await db.table('t_carts').get(cartId).run();
  expect(dbCart).to.not.equal(undefined);
  expect(dbCart).to.have.property('items');
  if (dbCart && dbCart.items) {
    expect(dbCart.items).to.have.length(1);
    expect(dbCart.items[0]).to.have.property('product_id', productId);
    expect(dbCart.items[0]).to.have.property('quantity', 5);
    expect(dbCart.items[0]).to.have.property('price', retrievedProduct!.price);
  }
  expect(dbCart).to.have.property('total_amount', (retrievedProduct!.price || 0) * 5);
}

async function UpdateOrderWithAllFieldsTest() {
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
  const orderId = orderResult.generated_keys![0];

  const updateData = {
    items: [
      {
        product_id: productId,
        quantity: 2,
        price: retrievedProduct!.price,
        total: (retrievedProduct!.price || 0) * 2,
      },
    ],
    subtotal: (retrievedProduct!.price || 0) * 2,
    tax_amount: 200.0,
    shipping_amount: 50.0,
    total_amount: (retrievedProduct!.price || 0) * 2 + 200.0 + 50.0,
    status: 'shipped' as const,
    payment_status: 'paid' as const,
    shipping_address: {
      street: 'Updated Shipping Street',
      city: 'Updated Shipping City',
      state: 'Updated Shipping State',
      zip_code: '88888',
      country: 'Updated Shipping Country',
    },
  };

  await orderModel.update(orderId, updateData);

  const updatedOrder = await orderModel.get(orderId);
  expect(updatedOrder).to.have.property('items');
  expect(updatedOrder!.items).to.have.length(1);
  expect(updatedOrder!.items[0]).to.have.property('product_id', productId);
  expect(updatedOrder!.items[0]).to.have.property('quantity', 2);
  expect(updatedOrder!.items[0]).to.have.property('price', retrievedProduct!.price);
  expect(updatedOrder!.items[0]).to.have.property('total', (retrievedProduct!.price || 0) * 2);
  expect(updatedOrder).to.have.property('subtotal', (retrievedProduct!.price || 0) * 2);
  expect(updatedOrder).to.have.property('tax_amount', updateData.tax_amount);
  expect(updatedOrder).to.have.property('shipping_amount', updateData.shipping_amount);
  expect(updatedOrder).to.have.property('total_amount', (retrievedProduct!.price || 0) * 2 + 200.0 + 50.0);
  expect(updatedOrder).to.have.property('status', updateData.status);
  expect(updatedOrder).to.have.property('payment_status', updateData.payment_status);
  expect(updatedOrder).to.have.property('shipping_address');
  if (updatedOrder && updatedOrder.shipping_address && updateData.shipping_address) {
    expect(updatedOrder.shipping_address).to.have.property('street', updateData.shipping_address.street);
    expect(updatedOrder.shipping_address).to.have.property('city', updateData.shipping_address.city);
  }

  const dbOrder = await db.table('t_orders').get(orderId).run();
  expect(dbOrder).to.not.equal(undefined);
  expect(dbOrder).to.have.property('items');
  if (dbOrder && dbOrder.items) {
    expect(dbOrder.items).to.have.length(1);
    expect(dbOrder.items[0]).to.have.property('product_id', productId);
    expect(dbOrder.items[0]).to.have.property('quantity', 2);
    expect(dbOrder.items[0]).to.have.property('price', retrievedProduct!.price);
    expect(dbOrder.items[0]).to.have.property('total', (retrievedProduct!.price || 0) * 2);
  }
  expect(dbOrder).to.have.property('subtotal', (retrievedProduct!.price || 0) * 2);
  expect(dbOrder).to.have.property('tax_amount', updateData.tax_amount);
  expect(dbOrder).to.have.property('shipping_amount', updateData.shipping_amount);
  expect(dbOrder).to.have.property('total_amount', (retrievedProduct!.price || 0) * 2 + 200.0 + 50.0);
  expect(dbOrder).to.have.property('status', updateData.status);
  expect(dbOrder).to.have.property('payment_status', updateData.payment_status);
  expect(dbOrder).to.have.property('shipping_address');
  if (dbOrder && dbOrder.shipping_address && updateData.shipping_address) {
    expect(dbOrder.shipping_address).to.have.property('street', updateData.shipping_address.street);
    expect(dbOrder.shipping_address).to.have.property('city', updateData.shipping_address.city);
  }
}

async function DeleteUserAndVerifyTest() {
  const userModel = new UsersModel(db);

  const insertResult = await userModel.insert(usersData[1]);
  const userId = insertResult.generated_keys![0];

  await userModel.delete(userId);

  const deletedUser = await userModel.get(userId);
  expect(deletedUser).to.equal(undefined);

  const dbUser = await db.table('t_users').get(userId).run();
  expect(dbUser).to.equal(undefined);
}

async function DeleteProductAndVerifyTest() {
  const productModel = new ProductModel(db);

  const insertResult = await productModel.insert(productData[1]);
  const productId = insertResult.generated_keys![0];

  await productModel.delete(productId);

  const deletedProduct = await productModel.get(productId);
  expect(deletedProduct).to.equal(undefined);

  const dbProduct = await db.table('t_products').get(productId).run();
  expect(dbProduct).to.equal(undefined);
}

async function DeleteCustomerAndVerifyTest() {
  const userModel = new UsersModel(db);
  const customerModel = new CustomerModel(db);

  const userResult = await userModel.insert(usersData[2]);
  const userId = userResult.generated_keys![0];

  const customerResult = await customerModel.insert({
    ...customerData[1],
    user_id: userId,
  });
  const customerId = customerResult.generated_keys![0];

  await customerModel.delete(customerId);

  const deletedCustomer = await customerModel.get(customerId);
  expect(deletedCustomer).to.equal(undefined);

  const dbCustomer = await db.table('t_customers').get(customerId).run();
  expect(dbCustomer).to.equal(undefined);
}

async function DeleteCartAndVerifyTest() {
  const productModel = new ProductModel(db);
  const customerModel = new CustomerModel(db);
  const cartModel = new CartModel(db);

  const productResult = await productModel.insert(productData[2]);
  const productId = productResult.generated_keys![0];
  const retrievedProduct = await productModel.get(productId);

  const customerResult = await customerModel.insert(customerData[2]);
  const customerId = customerResult.generated_keys![0];

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

  await cartModel.delete(cartId);

  const deletedCart = await cartModel.get(cartId);
  expect(deletedCart).to.equal(undefined);

  const dbCart = await db.table('t_carts').get(cartId).run();
  expect(dbCart).to.equal(undefined);
}

async function DeleteOrderAndVerifyTest() {
  const userModel = new UsersModel(db);
  const customerModel = new CustomerModel(db);
  const productModel = new ProductModel(db);
  const cartModel = new CartModel(db);
  const orderModel = new OrdersModel(db);

  const userResult = await userModel.insert(usersData[3]);
  const userId = userResult.generated_keys![0];

  const customerResult = await customerModel.insert({
    ...customerData[3],
    user_id: userId,
  });
  const customerId = customerResult.generated_keys![0];

  const productResult = await productModel.insert(productData[3]);
  const productId = productResult.generated_keys![0];
  const retrievedProduct = await productModel.get(productId);

  const cartResult = await cartModel.insert({
    ...cartData[2],
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
    ...ordersData[2],
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
  const orderId = orderResult.generated_keys![0];

  await orderModel.delete(orderId);

  const deletedOrder = await orderModel.get(orderId);
  expect(deletedOrder).to.equal(undefined);

  const dbOrder = await db.table('t_orders').get(orderId).run();
  expect(dbOrder).to.equal(undefined);
}
