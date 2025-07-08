import { Users } from '../types/Users';

export const usersData: Partial<Users>[] = [
  {
    name: 'Jean Dupont',
    email: 'jean.dupont@email.com',
    password: 'password123',
    role: 'user',
    age: 28,
    is_active: true,
  },
  {
    name: 'Marie Martin',
    email: 'marie.martin@email.com',
    password: 'password456',
    role: 'admin',
    age: 35,
    is_active: true,
  },
  {
    name: 'Pierre Durand',
    email: 'pierre.durand@email.com',
    password: 'password789',
    role: 'user',
    age: 42,
    is_active: false,
  },
  {
    name: 'Sophie Bernard',
    email: 'sophie.bernard@email.com',
    password: 'password101',
    role: 'user',
    age: 31,
    is_active: true,
  },
  {
    name: 'Lucas Petit',
    email: 'lucas.petit@email.com',
    password: 'password202',
    role: 'admin',
    age: 26,
    is_active: true,
  },
];
