import { env } from '../../config/env';
import { getPublicMenuCategoriesWithProducts, PublicMenuCategoryRecord } from './publicMenu.repository';

export interface PublicMenuStoreInfo {
  name: string;
  address: string;
  phone: string;
  businessHours: string;
  logoUrl?: string;
}

export interface PublicMenuProductViewModel {
  name: string;
  description?: string;
  price: number;
  image?: string;
}

export interface PublicMenuCategoryViewModel {
  name: string;
  products: PublicMenuProductViewModel[];
}

export interface PublicMenuViewModel {
  store: PublicMenuStoreInfo;
  categories: PublicMenuCategoryViewModel[];
}

function mapCategories(records: PublicMenuCategoryRecord[]): PublicMenuCategoryViewModel[] {
  return records.map((category) => ({
    name: category.name,
    products: category.products.map((product) => ({
      name: product.name,
      description: product.description || undefined,
      price: product.price,
      image: product.image || undefined,
    })),
  }));
}

export const publicMenuService = {
  async getPublicMenuViewModel(): Promise<PublicMenuViewModel> {
    const categories = await getPublicMenuCategoriesWithProducts();

    // Usa o logo padrão do projeto disponível em frontend/public/logo.png,
    // servido pelo backend no caminho /public/logo.png para manter mesma origem.
    const defaultLogoUrl = '/public/logo.png';

    const store: PublicMenuStoreInfo = {
      name: env.publicMenuStoreName || 'Element Adega',
      address:
        env.publicMenuStoreAddress ||
        'Av. Antônio Carlos Benjamin dos Santos, 1663 - Jardim São Bernardo',
      phone: env.publicMenuStorePhone || '(11) 96868-1952',
      businessHours: env.publicMenuBusinessHours || 'Seg a Dom - 18h às 02h',
      logoUrl: env.publicMenuLogoUrl || defaultLogoUrl,
    };

    return {
      store,
      categories: mapCategories(categories),
    };
  },
};

