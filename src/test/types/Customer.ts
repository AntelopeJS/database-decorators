import { RegisterTable, Index, Table, BasicDataModel } from '@ajs.local/database-decorators/beta';
import { OrdersModel } from './Orders';
import { CartModel } from './Cart';

@RegisterTable('t_customers', 'core')
export class Customer extends Table {
  @Index({ primary: true })
  declare _id: string;

  declare created_at: Date;
  declare updated_at: Date;

  declare user_id: string;
  declare phone: string;
  declare address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  declare is_active: boolean;
  declare total_orders: number;
  declare total_spent: number;
}

export class CustomerModel extends BasicDataModel(Customer, 't_customers') {
  private async createCustomer(new_customer: Customer) {
    return await this.insert(new_customer);
  }

  private async updateCustomer(id: string, updated_customer: Customer) {
    return await this.update(id, updated_customer);
  }

  private async deleteCustomer(id: string) {
    return await this.delete(id);
  }

  private async getCustomer(id: string) {
    return await this.get(id);
  }

  private async getCustomerByUser(user_id: string) {
    return await this.getBy('user_id', user_id);
  }

  private async getCustomers() {
    return await this.getAll();
  }

  private async getCustomerWithUserData(customer_id: string) {
    const customer = await this.get(customer_id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    const user = await this.get(customer.user_id);
    if (!user) {
      throw new Error('User not found');
    }
    return { ...customer, user };
  }

  private async getActiveCustomers() {
    return await this.getBy('is_active', true);
  }

  private async updateCustomerTotalSpent(id: string, total_spent: number) {
    return await this.update(id, { total_spent });
  }

  private async incrementCustomerOrders(id: string) {
    const customer = await this.get(id);
    if (customer) {
      return await this.update(id, { total_orders: customer.total_orders + 1 });
    }
  }

  private async getOrders(customer_id: string) {
    const ordersModel = new OrdersModel(this.database);
    return await ordersModel.getBy('customer_id', customer_id);
  }

  private async getCart(customer_id: string) {
    const cartModel = new CartModel(this.database);
    return await cartModel.getBy('customer_id', customer_id);
  }
}
