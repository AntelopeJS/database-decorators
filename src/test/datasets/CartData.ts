import { Cart } from '../types/Cart';

export const cartData: Partial<Cart>[] = [
  {
    customer_id: 'customer_001',
    items: [
      {
        product_id: 'product_001',
        quantity: 2,
        price: 1199.99,
      },
      {
        product_id: 'product_003',
        quantity: 1,
        price: 349.99,
      },
    ],
    total_amount: 2749.97,
    is_active: true,
    expires_at: new Date('2024-12-31T23:59:59Z'),
  },
  {
    customer_id: 'customer_002',
    items: [
      {
        product_id: 'product_002',
        quantity: 1,
        price: 1499.99,
      },
    ],
    total_amount: 1499.99,
    is_active: true,
    expires_at: new Date('2024-12-31T23:59:59Z'),
  },
  {
    customer_id: 'customer_003',
    items: [
      {
        product_id: 'product_004',
        quantity: 3,
        price: 129.99,
      },
      {
        product_id: 'product_005',
        quantity: 1,
        price: 999.99,
      },
    ],
    total_amount: 1389.96,
    is_active: false,
    expires_at: new Date('2024-11-30T23:59:59Z'),
  },
  {
    customer_id: 'customer_004',
    items: [
      {
        product_id: 'product_001',
        quantity: 1,
        price: 1199.99,
      },
      {
        product_id: 'product_002',
        quantity: 1,
        price: 1499.99,
      },
      {
        product_id: 'product_003',
        quantity: 2,
        price: 349.99,
      },
    ],
    total_amount: 3449.96,
    is_active: true,
    expires_at: new Date('2024-12-31T23:59:59Z'),
  },
  {
    customer_id: 'customer_005',
    items: [
      {
        product_id: 'product_005',
        quantity: 1,
        price: 129.99,
      },
    ],
    total_amount: 129.99,
    is_active: true,
    expires_at: new Date('2024-12-31T23:59:59Z'),
  },
];
