import React from 'react';
import { Button } from '@/components/ui/button';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDetailsProps {
  cart: CartItem[];
  cartTotal: number;
  onAdd: (product: Product) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;
  onCheckout: () => void;
  disabled?: boolean;
}

const CartDetails: React.FC<CartDetailsProps> = ({
  cart,
  cartTotal,
  onAdd,
  onRemove,
  onClear,
  onCheckout,
  disabled = false,
}) => {
  const API_URL = import.meta.env.VITE_API_URL || 'https://adega-flow-digital.onrender.com';

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4">Seu Carrinho</h2>
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-8">
          <p className="text-gray-500">Seu carrinho está vazio</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center py-4 border-b">
                <img
                  src={item.product.image && !item.product.image.startsWith('http') ? API_URL + item.product.image : item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-md mr-3"
                />
                <div className="flex-1">
                  <h3 className="font-medium line-clamp-1">{item.product.name}</h3>
                  <p className="text-sm text-gray-500">
                    R$ {item.product.price.toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => onRemove(item.product.id)}
                  >
                    -
                  </Button>
                  <span className="mx-2">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => onAdd(item.product)}
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t mt-auto">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">R$ {cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-gray-500">Entrega</span>
              <span className="font-medium">Grátis</span>
            </div>
            <div className="flex justify-between mb-6">
              <span className="text-lg font-bold">Total</span>
              <span className="text-lg font-bold">R$ {cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClear}
              >
                Limpar
              </Button>
              <Button
                className="flex-1 bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/90"
                onClick={onCheckout}
                disabled={disabled}
              >
                Finalizar
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartDetails; 