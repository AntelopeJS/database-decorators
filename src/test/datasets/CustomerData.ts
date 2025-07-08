import { Customer } from '../types/Customer';

export const customerData: Partial<Customer>[] = [
  {
    user_id: 'user_001',
    phone: '+33 1 23 45 67 89',
    address: {
      street: '123 Peace Street',
      city: 'Paris',
      postal_code: '75001',
      country: 'France',
    },
    is_active: true,
    total_orders: 5,
    total_spent: 1250.5,
  },
  {
    user_id: 'user_002',
    phone: '+33 1 98 76 54 32',
    address: {
      street: '456 Champs Avenue',
      city: 'Lyon',
      postal_code: '69001',
      country: 'France',
    },
    is_active: true,
    total_orders: 12,
    total_spent: 2890.7,
  },
  {
    user_id: 'user_003',
    phone: '+33 1 11 22 33 44',
    address: {
      street: '789 Central Boulevard',
      city: 'Marseille',
      postal_code: '13001',
      country: 'France',
    },
    is_active: false,
    total_orders: 2,
    total_spent: 450.2,
  },
  {
    user_id: 'user_004',
    phone: '+33 1 55 66 77 88',
    address: {
      street: '321 Commerce Street',
      city: 'Toulouse',
      postal_code: '31000',
      country: 'France',
    },
    is_active: true,
    total_orders: 8,
    total_spent: 1675.3,
  },
  {
    user_id: 'user_005',
    phone: '+33 1 99 88 77 66',
    address: {
      street: '654 Republic Square',
      city: 'Nantes',
      postal_code: '44000',
      country: 'France',
    },
    is_active: true,
    total_orders: 15,
    total_spent: 3420.8,
  },
];
