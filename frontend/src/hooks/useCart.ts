import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  type: 'product' | 'combo';
  name: string;
  price: number;
  image?: string;
  quantity: number;
  items?: {
    id: string;
    productId: string;
    isChoosable: boolean;
    product: {
      name: string;
      price: number;
    };
    selectedOption?: string; // ID do produto escolhido (para itens escolhíveis)
  }[];
}

interface CartStore {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateComboOption: (comboId: string, itemId: string, selectedOption: string) => void;
  clearCart: () => void;
  total: number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (item) => {
        const items = get().items;
        const existingItem = items.find(i => i.id === item.id);

        if (existingItem) {
          set({
            items: items.map(i =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          });
        } else {
          set({ items: [...items, item] });
        }
      },
      removeFromCart: (itemId) => {
        set({ items: get().items.filter(item => item.id !== itemId) });
      },
      updateQuantity: (itemId, quantity) => {
        if (quantity < 1) return;
        set({
          items: get().items.map(item =>
            item.id === itemId
              ? { ...item, quantity }
              : item
          )
        });
      },
      updateComboOption: (comboId, itemId, selectedOption) => {
        set({
          items: get().items.map(item =>
            item.id === comboId && item.type === 'combo'
              ? {
                  ...item,
                  items: item.items?.map(i =>
                    i.id === itemId
                      ? { ...i, selectedOption }
                      : i
                  )
                }
              : item
          )
        });
      },
      clearCart: () => set({ items: [] }),
      get total() {
        return get().items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      }
    }),
    {
      name: 'cart-storage'
    }
  )
); 