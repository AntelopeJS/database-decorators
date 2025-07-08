import { RegisterTable, Index, Table, BasicDataModel } from '@ajs.local/database-decorators/beta';

@RegisterTable('t_orders', 'core')
export class Orders extends Table {
  @Index({ primary: true })
  declare _id: string;

  declare created_at: Date;
  declare updated_at: Date;

  declare customer_id: string;
  declare cart_id: string;
  declare order_number: string;
  declare items: Array<{
    product_id: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  declare subtotal: number;
  declare tax_amount: number;
  declare shipping_amount: number;
  declare total_amount: number;
  declare status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  declare payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  declare shipping_address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  declare notes: string;
}

export class OrdersModel extends BasicDataModel(Orders, 't_orders') {
  private async createOrder(new_order: Orders) {
    return await this.insert(new_order);
  }

  private async updateOrder(id: string, updated_order: Orders) {
    return await this.update(id, updated_order);
  }

  private async deleteOrder(id: string) {
    return await this.delete(id);
  }

  private async getOrder(id: string) {
    return await this.get(id);
  }

  private async getOrders() {
    return await this.getAll();
  }

  private async getOrdersByCustomer(customer_id: string) {
    return await this.getBy('customer_id', customer_id);
  }

  private async getOrdersByStatus(status: Orders['status']) {
    return await this.getBy('status', status);
  }

  private async getOrdersByPaymentStatus(payment_status: Orders['payment_status']) {
    return await this.getBy('payment_status', payment_status);
  }

  private async updateOrderStatus(id: string, status: Orders['status']) {
    return await this.update(id, { status });
  }

  private async updatePaymentStatus(id: string, payment_status: Orders['payment_status']) {
    return await this.update(id, { payment_status });
  }

  private async getOrderByNumber(order_number: string) {
    return await this.getBy('order_number', order_number);
  }

  private async calculateOrderTotals(id: string) {
    const order = await this.get(id);
    if (order) {
      const subtotal = order.items.reduce((sum: number, item: { total: number }) => sum + item.total, 0);
      const total_amount = subtotal + order.tax_amount + order.shipping_amount;
      return await this.update(id, { subtotal, total_amount });
    }
  }
}
