import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface CartItem {
  id: number;
  code: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  pinned?: boolean;
}

const AdminCashRegister = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [productCode, setProductCode] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);
  const [quickProductsOpen, setQuickProductsOpen] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(34);
  const [cpfCnpjDialogOpen, setCpfCnpjDialogOpen] = useState(false);
  const [cpfCnpjValue, setCpfCnpjValue] = useState('');
  const [pinnedProducts, setPinnedProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([
    { id: 1, code: 'CERV1', name: 'Cerveja Skol Lata 350ml', price: 6.00, pinned: false },
    { id: 2, code: 'VINHO1', name: 'Vinho Tinto Taça 150ml', price: 12.00, pinned: false },
    { id: 3, code: 'GUAR1', name: 'Guaraná Lata 350ml', price: 5.00, pinned: false },
    { id: 4, code: 'EMPFR', name: 'Empada de Frango', price: 8.00, pinned: false },
    { id: 5, code: 'CAFE1', name: 'Café Expresso', price: 4.00, pinned: false },
    { id: 6, code: 'BRIG1', name: 'Brigadeiro', price: 3.00, pinned: false },
    { id: 7, code: 'SUCO1', name: 'Suco de Laranja', price: 6.00, pinned: false },
    { id: 8, code: 'SAND1', name: 'Sanduíche Agreste', price: 15.00, pinned: false },
    { id: 9, code: 'COCA1', name: 'Coca Lata 350ml', price: 5.00, pinned: false },
    { id: 10, code: 'BOLO1', name: 'Bolo SESC', price: 7.00, pinned: false },
    { id: 11, code: 'VODKA1', name: 'Vodka Dose 50ml', price: 9.00, pinned: false },
    { id: 12, code: 'ENERG1', name: 'Energético Monster 473ml', price: 12.00, pinned: false },
  ]);
  const { toast } = useToast();
  
  // Atualizar produtos fixados quando houver mudanças nos produtos
  useEffect(() => {
    const newPinnedProducts = products.filter(product => product.pinned);
    setPinnedProducts(newPinnedProducts);
  }, [products]);
  
  // Filter products when searching
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts([]);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);
  
  // Toggle pin product
  const togglePinProduct = (productId: number) => {
    const updatedProducts = products.map(product => {
      if (product.id === productId) {
        return { ...product, pinned: !product.pinned };
      }
      return product;
    });
    setProducts(updatedProducts);
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const discount = 0;
  const total = subtotal - discount;

  // Add item to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItemIndex = cartItems.findIndex(item => item.code === product.code);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].total = 
        updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
      
      setCartItems(updatedItems);
      toast({
        title: "Atualizado",
        description: `Quantidade de ${product.name} atualizada.`,
      });
    } else {
      // Add new item
      const newItem: CartItem = {
        id: Date.now(), // Use timestamp for unique IDs
        code: product.code,
        name: product.name,
        quantity: quantity,
        price: product.price,
        total: product.price * quantity
      };
      
      setCartItems([...cartItems, newItem]);
      toast({
        title: "Adicionado",
        description: `${product.name} adicionado ao carrinho.`,
      });
    }
  };

  // Update cart item quantity
  const updateCartItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return; // Prevent quantity less than 1
    
    const updatedItems = cartItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: newQuantity,
          total: item.price * newQuantity
        };
      }
      return item;
    });
    
    setCartItems(updatedItems);
  };

  // Add product by code
  const handleAddProductByCode = () => {
    if (!productCode) {
      toast({
        title: "Erro",
        description: "Por favor, insira um código de produto.",
        variant: "destructive",
      });
      return;
    }

    const product = products.find(p => p.code === productCode);
    if (product) {
      addToCart(product, productQuantity);
      setProductCode('');
      setProductQuantity(1);
    } else {
      toast({
        title: "Erro",
        description: "Produto não encontrado.",
        variant: "destructive",
      });
    }
  };

  // Remove item from cart
  const removeItem = (itemId: number) => {
    const itemToRemove = cartItems.find(item => item.id === itemId);
    if (itemToRemove) {
      setCartItems(cartItems.filter(item => item.id !== itemId));
      toast({
        title: "Removido",
        description: `${itemToRemove.name} removido do carrinho.`
      });
    } else if (cartItems.length > 0) {
      // Se não achou o item específico mas tem itens no carrinho, remove o último
      const lastItem = cartItems[cartItems.length - 1];
      setCartItems(cartItems.slice(0, -1));
      toast({
        title: "Removido",
        description: `${lastItem.name} removido do carrinho.`
      });
    } else {
      toast({
        title: "Info",
        description: "Não há itens para remover."
      });
    }
  };

  // Cancel ticket
  const cancelTicket = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Info",
        description: "Não há itens para cancelar.",
      });
      return;
    }

    setCartItems([]);
    toast({
      title: "Sucesso",
      description: "Tíquete cancelado com sucesso.",
    });
  };
  
  // Cancelar operação (extornar)
  const cancelOperation = () => {
    toast({
      title: "Extorno",
      description: "Última operação extornada com sucesso.",
    });
  };

  // Finish ticket with payment method
  const finishTicket = (paymentMethod: string) => {
    if (cartItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione itens ao carrinho para finalizar.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: `Venda finalizada! Pagamento via ${paymentMethod}.`,
    });
    
    // Reset cart and increment ticket number
    setCartItems([]);
    setTicketNumber(prev => prev + 1);
  };
  
  // Handle CPF/CNPJ submission
  const handleCpfCnpjSubmit = () => {
    if (cpfCnpjValue) {
      toast({
        title: "CPF/CNPJ Adicionado",
        description: `CPF/CNPJ ${cpfCnpjValue} adicionado à nota.`,
      });
      setCpfCnpjDialogOpen(false);
      setCpfCnpjValue('');
    } else {
      toast({
        title: "Erro",
        variant: "destructive",
        description: "Por favor, informe um CPF/CNPJ válido.",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark">
          Controle de Caixa
        </h1>
        
        <div className="flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white shadow-sm p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-element-blue-dark" />
              <h2 className="text-xl font-medium text-element-blue-dark">Caixa</h2>
            </div>
            {/* ... resto do conteúdo ... */}
          </div>
          
          {/* ... resto do conteúdo da página ... */}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCashRegister;
