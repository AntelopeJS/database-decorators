import { Users } from '../types/Users';

export const usersData: Partial<Users>[] = [
  {
    name: 'Jean Dupont',
    email: 'jean.dupont@email.com',
    password: '123456789',
    role: 'user',
    age: 28,
    is_active: true,
  },
  {
    name: 'Marie Martin',
    email: 'marie.martin@email.com',
    password: 'password.1',
    role: 'admin',
    age: 35,
    is_active: true,
  },
  {
    name: 'Pierre Durand',
    email: 'pierre.durand@email.com',
    password: 'qwerty',
    role: 'user',
    age: 42,
    is_active: false,
  },
  {
    name: 'Sophie Bernard',
    email: 'sophie.bernard@email.com',
    password: 'iloveyou',
    role: 'user',
    age: 31,
    is_active: true,
  },
  {
    name: 'Lucas Petit',
    email: 'lucas.petit@email.com',
    password: '1q2w3e4r',
    role: 'admin',
    age: 26,
    is_active: true,
  },
];
