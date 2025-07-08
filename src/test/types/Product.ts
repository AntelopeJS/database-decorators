import { RegisterTable, Index, Table, BasicDataModel } from '@ajs.local/database-decorators/beta';

@RegisterTable('t_products', 'core')
export class Product extends Table {
  @Index({ primary: true })
  declare _id: string;

  declare created_at: Date;
  declare updated_at: Date;

  declare name: string;
  declare description: string;
  declare price: number;
  declare stock_quantity: number;
  declare category: string;
  declare brand: string;
  declare is_active: boolean;
  declare images: string[];
  declare tags: string[];
  declare total_sold: number;
}

export class ProductModel extends BasicDataModel(Product, 't_products') {
  private async createProduct(new_product: Product) {
    return await this.insert(new_product);
  }

  private async updateProduct(id: string, updated_product: Product) {
    return await this.update(id, updated_product);
  }

  private async deleteProduct(id: string) {
    return await this.delete(id);
  }

  private async getProduct(id: string) {
    return await this.get(id);
  }

  private async getProducts() {
    return await this.getAll();
  }

  private async getActiveProducts() {
    return await this.getBy('is_active', true);
  }

  private async getProductsByCategory(category: string) {
    return await this.getBy('category', category);
  }

  private async getProductsByBrand(brand: string) {
    return await this.getBy('brand', brand);
  }

  private async updateStockQuantity(id: string, quantity: number) {
    return await this.update(id, { stock_quantity: quantity });
  }

  private async decrementStock(id: string, quantity: number) {
    const product = await this.get(id);
    if (product && product.stock_quantity >= quantity) {
      return await this.update(id, {
        stock_quantity: product.stock_quantity - quantity,
        total_sold: product.total_sold + quantity,
      });
    }
  }
}
