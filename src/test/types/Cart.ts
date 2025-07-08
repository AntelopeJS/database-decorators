import { RegisterTable, Index, Table, BasicDataModel } from '@ajs.local/database-decorators/beta';

type CartItem = {
  product_id: string;
  quantity: number;
  price: number;
};

@RegisterTable('t_carts', 'core')
export class Cart extends Table {
  @Index({ primary: true })
  declare _id: string;

  declare created_at: Date;
  declare updated_at: Date;

  declare customer_id: string;
  declare items: CartItem[];
  declare total_amount: number;
  declare is_active: boolean;
  declare expires_at: Date;
}

export class CartModel extends BasicDataModel(Cart, 't_carts') {
  private async createCart(new_cart: Cart) {
    return await this.insert(new_cart);
  }

  private async updateCart(id: string, updated_cart: Cart) {
    return await this.update(id, updated_cart);
  }

  private async deleteCart(id: string) {
    return await this.delete(id);
  }

  private async getCart(id: string) {
    return await this.get(id);
  }

  private async getCarts() {
    return await this.getAll();
  }

  private async getCartByCustomer(customer_id: string) {
    return await this.getBy('customer_id', customer_id);
  }

  private async getActiveCarts() {
    return await this.getBy('is_active', true);
  }

  private async addItemToCart(cart_id: string, product_id: string, quantity: number, price: number) {
    const cart = await this.get(cart_id);
    if (cart) {
      const existing_item_index = cart.items.findIndex((item: CartItem) => item.product_id === product_id);

      if (existing_item_index >= 0) {
        cart.items[existing_item_index].quantity += quantity;
      } else {
        cart.items.push({ product_id, quantity, price });
      }

      cart.total_amount = cart.items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
      return await this.update(cart_id, cart);
    }
  }

  private async removeItemFromCart(cart_id: string, product_id: string) {
    const cart = await this.get(cart_id);
    if (cart) {
      cart.items = cart.items.filter((item: CartItem) => item.product_id !== product_id);
      cart.total_amount = cart.items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0);
      return await this.update(cart_id, cart);
    }
  }

  private async clearCart(cart_id: string) {
    return await this.update(cart_id, { items: [], total_amount: 0 });
  }
}
