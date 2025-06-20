import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, X, Plus, Minus, Receipt, User, List } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/axios';
import { ComboOptionsModal } from '@/components/home/ComboOptionsModal';

// Types definition
interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  stock: number;
  isFractioned?: boolean;
  totalVolume?: number;
  unitVolume?: number;
}

interface ComandaItem {
  id: string;
  productId: string;
  code: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  choosableSelections?: Record<string, Record<string, number>>;
  isDoseItem?: boolean;
  isFractioned?: boolean;
  discountBy?: 'volume' | 'unit';
}

interface Comanda {
  id: string;
  number: number;
  customerName: string;
  items: ComandaItem[];
  total: number;
  createdAt: Date;
  isOpen: boolean;
}

interface ComandaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferToCart: (items: ComandaItem[]) => void;
}

export function ComandaModal({
  open,
  onOpenChange,
  onTransferToCart
}: ComandaModalProps) {
  // State management
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [currentComanda, setCurrentComanda] = useState<Comanda | null>(null);
  const [showComandaList, setShowComandaList] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [productCode, setProductCode] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [doses, setDoses] = useState<any[]>([]);
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [comboToConfigure, setComboToConfigure] = useState<any>(null);
  const [doseModalOpen, setDoseModalOpen] = useState(false);
  const [doseToConfigure, setDoseToConfigure] = useState<any>(null);
  const { toast } = useToast();
  const [nextComandaNumber, setNextComandaNumber] = useState(1);

  // Carregar comandas do localStorage
  useEffect(() => {
    const savedComandas = localStorage.getItem('comandas');
    if (savedComandas) {
      const parsed = JSON.parse(savedComandas);
      // Converter strings de data para objetos Date
      const comandasWithDates = parsed.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt)
      }));
      setComandas(comandasWithDates);

      // Encontrar o maior número de comanda para continuar a sequência
      const maxNumber = Math.max(...comandasWithDates.map((c: Comanda) => c.number), 0);
      setNextComandaNumber(maxNumber + 1);
    }
  }, []);

  // Salvar comandas no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem('comandas', JSON.stringify(comandas));
  }, [comandas]);

  // Buscar produtos, combos e doses ao carregar
  useEffect(() => {
    if (open) {
      Promise.all([
        api.get('/admin/products'),
        api.get('/admin/combos'),
        api.get('/admin/doses')
      ]).then(([productsRes, combosRes, dosesRes]) => {
        setProducts(productsRes.data.filter((p: any) => p.stock > 0));
        setCombos(combosRes.data);
        setDoses(dosesRes.data);
      });
    }
  }, [open]);

  // Unificar produtos, combos e doses para exibição
  const allItems = React.useMemo(() => [
    ...products.map(p => ({ ...p, type: 'product' })),
    ...combos.map(c => ({
      ...c,
      type: 'combo',
      code: c.id.substring(0, 6),
      name: c.name,
      price: c.price,
      items: c.items.map(item => ({
        ...item,
        isChoosable: item.allowFlavorSelection,
        product: {
          ...item.product,
          category: item.product?.category
        }
      }))
    })),
    ...doses.map(d => ({
      ...d,
      type: 'dose',
      code: d.id.substring(0, 6),
      items: d.items.map((item: any) => ({
        ...item,
        isChoosable: item.allowFlavorSelection,
        product: {
          ...item.product,
          category: item.product?.category
        }
      }))
    }))
  ], [products, combos, doses]);

  // Busca dinâmica
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts([]);
    } else {
      setFilteredProducts(
        allItems.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      );
    }
  }, [searchQuery, allItems]);

  // Calculate totals
  const subtotal = currentComanda?.items.reduce((sum, item) => sum + item.total, 0) || 0;

  // Create new comanda
  const createNewComanda = () => {
    if (!customerName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome da pessoa para criar a comanda.",
        variant: "destructive",
      });
      return;
    }

    const newComanda: Comanda = {
      id: Math.random().toString(36).substring(2, 8),
      number: nextComandaNumber,
      customerName: customerName.trim(),
      items: [],
      total: 0,
      createdAt: new Date(),
      isOpen: true
    };

    setComandas(prev => [...prev, newComanda]);
    setCurrentComanda(newComanda);
    setCustomerName('');
    setNextComandaNumber(prev => prev + 1);
    setShowComandaList(false);
    toast({
      title: "Comanda criada",
      description: `Comanda #${newComanda.number} criada para ${newComanda.customerName}.`,
    });
  };

  // Open existing comanda
  const openComanda = (comanda: Comanda) => {
    setCurrentComanda(comanda);
    setShowComandaList(false);
  };

  // Close comanda
  const closeComanda = (comandaId: string) => {
    setComandas(prev => prev.map(comanda => 
      comanda.id === comandaId 
        ? { ...comanda, isOpen: false }
        : comanda
    ));

    if (currentComanda?.id === comandaId) {
      setCurrentComanda(null);
      setShowComandaList(true);
    }

    toast({
      title: "Comanda fechada",
      description: "A comanda foi fechada com sucesso.",
    });
  };

  // Add item to comanda
  const addToComanda = (item: any, quantity: number = 1) => {
    if (!currentComanda) {
      toast({
        title: "Nenhuma comanda selecionada",
        description: "Crie ou selecione uma comanda primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (item.type === 'combo') {
      setComboToConfigure(item);
      setComboModalOpen(true);
      return;
    }

    if (item.type === 'dose') {
      setDoseToConfigure(item);
      setDoseModalOpen(true);
      return;
    }

    // Para produtos simples
    const existingItem = currentComanda.items.find(cartItem => 
      cartItem.productId === item.id && 
      cartItem.name === `${item.name} (Avulso)`
    );

    if (existingItem) {
      // Atualizar quantidade se já existe
      updateComandaItemQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      // Adicionar novo item
      const newItem = {
        id: Math.random().toString(36).substring(2, 8),
        productId: item.id,
        code: item.code,
        name: `${item.name} (Avulso)`,
        price: item.price,
        quantity: quantity,
        total: item.price * quantity,
        isAvulso: true
      };

      setCurrentComanda(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: [...prev.items, newItem]
        };
      });

      // Atualizar a lista de comandas
      setComandas(prev => prev.map(comanda => 
        comanda.id === currentComanda.id 
          ? { ...comanda, items: [...comanda.items, newItem] }
          : comanda
      ));
    }
  };

  // Handle combo configuration
  const handleComboConfirm = (choosableSelections: Record<string, Record<string, number>>) => {
    if (!currentComanda || !comboToConfigure) return;

    const produtosCombo: { productId: string, nome: string, precoOriginal: number, quantidade: number }[] = [];
    
    // Fixos
    for (const item of comboToConfigure.items) {
      if (!item.isChoosable) {
        produtosCombo.push({
          productId: item.productId,
          nome: item.product?.name || '',
          precoOriginal: item.product?.price || 0,
          quantidade: Math.max(1, item.quantity)
        });
      }
    }

    // Escolhíveis
    for (const [categoryId, selections] of Object.entries(choosableSelections)) {
      for (const [productId, quantidade] of Object.entries(selections)) {
        if (quantidade > 0) {
          const product = products.find(p => p.id === productId);
          if (product) {
            produtosCombo.push({
              productId: product.id,
              nome: product.name,
              precoOriginal: product.price,
              quantidade: Number(quantidade)
            });
          }
        }
      }
    }

    // Calcular valor total original e fator de desconto
    const totalOriginal = produtosCombo.reduce((sum, p) => sum + p.precoOriginal * p.quantidade, 0);
    const fatorDesconto = comboToConfigure.price / totalOriginal;

    // Criar itens com preços ajustados
    const comboItems: ComandaItem[] = [];
    let totalAjustado = 0;

    // Processar todos os itens exceto o último
    for (let i = 0; i < produtosCombo.length - 1; i++) {
      const produto = produtosCombo[i];
      const precoAjustado = Math.floor((produto.precoOriginal * fatorDesconto) * 100) / 100;
      const total = precoAjustado * produto.quantidade;
      totalAjustado += total;

      comboItems.push({
        id: Math.random().toString(36).substring(2, 8),
        productId: produto.productId,
        code: produto.productId.substring(0, 6),
        name: `Combo ${comboToConfigure.name} - ${produto.nome}`,
        quantity: produto.quantidade,
        price: precoAjustado,
        total
      });
    }

    // Processar o último item ajustando o valor para bater com o total do combo
    const ultimoProduto = produtosCombo[produtosCombo.length - 1];
    const valorRestante = comboToConfigure.price - totalAjustado;
    const precoUnitarioUltimo = Math.floor((valorRestante / ultimoProduto.quantidade) * 100) / 100;

    comboItems.push({
      id: Math.random().toString(36).substring(2, 8),
      productId: ultimoProduto.productId,
      code: ultimoProduto.productId.substring(0, 6),
      name: `Combo ${comboToConfigure.name} - ${ultimoProduto.nome}`,
      quantity: ultimoProduto.quantidade,
      price: precoUnitarioUltimo,
      total: valorRestante
    });

    // Calcular preço proporcional para cada item
    let runningTotal = 0;
    for (let i = 0; i < comboItems.length - 1; i++) {
        const item = comboItems[i];
        const adjustedPrice = item.price * fatorDesconto;
        item.price = adjustedPrice;
        item.total = item.price * item.quantity;
        runningTotal += item.total;
    }
    // Ajustar o último item para bater o total exato
    const lastItem = comboItems[comboItems.length - 1];
    const lastItemTotal = comboToConfigure.price - runningTotal;
    lastItem.price = lastItemTotal / lastItem.quantity;
    lastItem.total = lastItemTotal;


    setCurrentComanda(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: [...prev.items, ...comboItems],
        total: prev.total + comboToConfigure.price
      };
    });

    setComboModalOpen(false);
    setComboToConfigure(null);

    toast({
      description: `${comboToConfigure.name} adicionado à comanda.`
    });
  };

  const handleDoseConfirm = (choosableSelections: Record<string, Record<string, number>>) => {
    if (!currentComanda || !doseToConfigure) return;

    const produtosDose: { productId: string, nome: string, precoOriginal: number, quantidade: number, isFractioned?: boolean }[] = [];
    
    // Itens Fixos da Dose
    for (const item of doseToConfigure.items) {
      if (!(item as any).allowFlavorSelection) {
        produtosDose.push({
          productId: item.productId,
          nome: item.product?.name || '',
          precoOriginal: item.product?.price || 0,
          quantidade: Math.max(1, item.quantity),
          isFractioned: item.product?.isFractioned
        });
      }
    }

    // Itens Escolhíveis da Dose
    for (const [categoryId, selections] of Object.entries(choosableSelections)) {
      for (const [productId, quantidade] of Object.entries(selections)) {
        if (quantidade > 0) {
          const product = products.find(p => p.id === productId);
          if (product) {
            produtosDose.push({
              productId: product.id,
              nome: product.name,
              precoOriginal: product.price,
              quantidade: Number(quantidade),
              isFractioned: product.isFractioned
            });
          }
        }
      }
    }

    const totalOriginal = produtosDose.reduce((sum, p) => sum + p.precoOriginal * p.quantidade, 0);
    const fatorDesconto = totalOriginal > 0 ? doseToConfigure.price / totalOriginal : 0;

    const doseItems: ComandaItem[] = [];
    let totalAcumulado = 0;

    for (let i = 0; i < produtosDose.length; i++) {
        const produto = produtosDose[i];
        let precoFinalItem: number;

        if (i === produtosDose.length - 1) {
            // Último item: ajusta para bater o total da dose
            precoFinalItem = doseToConfigure.price - totalAcumulado;
        } else {
            // Demais itens: calcula o preço proporcional e arredonda
            const precoProporcional = produto.precoOriginal * fatorDesconto;
            precoFinalItem = Math.round(precoProporcional * 100) / 100;
            totalAcumulado += precoFinalItem;
        }
        
        const precoUnitario = precoFinalItem / produto.quantidade;

        doseItems.push({
            id: `${produto.productId}-${Math.random().toString(36).substring(2, 8)}`,
            productId: produto.productId,
            code: produto.productId.substring(0, 6),
            name: `Dose de ${doseToConfigure.name} - ${produto.nome}`,
            quantity: produto.quantidade,
            price: precoUnitario,
            total: precoFinalItem,
            isDoseItem: true,
            isFractioned: produto.isFractioned,
            choosableSelections: {
                [doseToConfigure.id]: { [produto.productId]: produto.quantidade }
            }
        });
    }

    setCurrentComanda(prev => {
      if (!prev) return prev;
      const newItems = [...prev.items, ...doseItems];
      const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);
      return {
        ...prev,
        items: newItems,
        total: newTotal
      };
    });

    setDoseModalOpen(false);
    setDoseToConfigure(null);
    toast({
      description: `Dose de ${doseToConfigure.name} adicionada à comanda.`
    });
  };

  // Update item quantity
  const updateComandaItemQuantity = (itemId: string, newQuantity: number) => {
    if (!currentComanda) return;

    if (newQuantity <= 0) {
      removeComandaItem(itemId);
      return;
    }

    const updatedItems = currentComanda.items.map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    );

    setCurrentComanda(prev => prev ? { ...prev, items: updatedItems } : null);
    setComandas(prev => prev.map(c => 
      c.id === currentComanda.id ? { ...c, items: updatedItems } : c
    ));
  };

  // Remove item from comanda
  const removeComandaItem = (itemId: string) => {
    if (!currentComanda) return;

    const updatedItems = currentComanda.items.filter(item => item.id !== itemId);
    
    setCurrentComanda(prev => prev ? { ...prev, items: updatedItems } : null);
    setComandas(prev => prev.map(c => 
      c.id === currentComanda.id ? { ...c, items: updatedItems } : c
    ));
  };

  // Add product by code
  const handleAddProductByCode = () => {
    const product = products.find(p => p.code === productCode);
    if (product) {
      addToComanda(product, productQuantity);
      setProductCode('');
      setProductQuantity(1);
    } else {
      toast({
        title: "Produto não encontrado",
        description: "Verifique o código do produto.",
        variant: "destructive",
      });
    }
  };

  // Transfer items to cart
  const handleTransferToCart = () => {
    if (!currentComanda || currentComanda.items.length === 0) return;

    // Transferir todos os itens de uma vez para o carrinho
    onTransferToCart(currentComanda.items);

    // Fechar a comanda
    closeComanda(currentComanda.id);
    
    // Fechar o modal
    onOpenChange(false);

    toast({
      title: "Itens transferidos",
      description: `${currentComanda.items.length} itens foram transferidos para o carrinho.`,
    });
  };

  // Reset comanda
  const handleResetComanda = () => {
    if (!currentComanda) return;

    setCurrentComanda(prev => prev ? { ...prev, items: [] } : null);
    setComandas(prev => prev.map(c => 
      c.id === currentComanda.id ? { ...c, items: [] } : c
    ));
    
    toast({
      title: "Comanda resetada",
      description: "Todos os itens foram removidos da comanda.",
    });
  };

  // Show comanda list
  const handleShowComandaList = () => {
    setShowComandaList(true);
    setCurrentComanda(null);
  };

  // Get open comandas
  const openComandas = comandas.filter(c => c.isOpen);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {currentComanda ? `Comanda #${currentComanda.number} - ${currentComanda.customerName}` : 'Gerenciar Comandas'}
            </DialogTitle>
          </DialogHeader>

          {showComandaList ? (
            // Comanda List View
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Comandas Abertas</h3>
                <Button onClick={() => {
                  setShowComandaList(false);
                  setCurrentComanda(null);
                }} variant="outline">
                  Nova Comanda
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                {openComandas.length > 0 ? (
                  openComandas.map((comanda) => (
                    <div key={comanda.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">#{comanda.number} - {comanda.customerName}</h4>
                          <p className="text-sm text-gray-500">
                            {comanda.items.length} itens • R$ {comanda.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Criada em {new Date(comanda.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => openComanda(comanda)} 
                          size="sm" 
                          className="flex-1"
                        >
                          Abrir
                        </Button>
                        <Button 
                          onClick={() => closeComanda(comanda.id)} 
                          size="sm" 
                          variant="outline"
                        >
                          Fechar
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 col-span-full">
                    Nenhuma comanda aberta
                  </div>
                )}
              </div>
            </div>
          ) : currentComanda ? (
            // Comanda Edit View
            <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
              {/* Left side - Product search and display */}
              <div className="flex-1 flex flex-col overflow-y-auto">
                {/* Search bar */}
                <div className="flex flex-col md:flex-row gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      type="text" 
                      placeholder="Buscar por nome ou código..." 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-32">
                    <Input 
                      type="text" 
                      placeholder="Cód.Prod" 
                      value={productCode}
                      onChange={(e) => setProductCode(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-16">
                    <Input 
                      type="number" 
                      min="1" 
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <Button 
                    onClick={handleAddProductByCode} 
                    className="px-3 w-full md:w-auto" 
                    disabled={!productCode || !products.find(p => p.code === productCode) || products.find(p => p.code === productCode)?.stock === 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {searchQuery.trim() !== '' && (
                    <div className="grid grid-cols-1 gap-2">
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          className="text-left p-3 border rounded-md hover:border-cyan-400 transition-colors bg-white w-full"
                          onClick={() => addToComanda(product)}
                          disabled={product.stock === 0}
                        >
                          <div className="font-medium">{product.code} - {product.name}</div>
                          <div className="text-green-600 mt-1">R$ {product.price.toFixed(2)}</div>
                          {product.type === 'combo' && <span className="text-xs text-blue-600">(Combo)</span>}
                          {product.type === 'dose' && <span className="text-xs text-purple-600">(Dose)</span>}
                        </button>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          Nenhum produto encontrado para "{searchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                  {searchQuery.trim() === '' && (
                    <div className="text-center py-8 text-gray-500">
                      Digite algo na busca para encontrar produtos
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Comanda items */}
              <div className="w-full lg:w-96 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg">Itens da Comanda</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleResetComanda}
                      disabled={currentComanda.items.length === 0}
                    >
                      Limpar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleShowComandaList}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Comanda items */}
                <div className="flex-1 overflow-y-auto">
                  {currentComanda.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-gray-500">
                            {item.quantity} {item.discountBy === 'volume' || (item.discountBy === undefined && item.isFractioned) ? 'ml' : 'un'} x R$ {item.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Cód: {item.code}</span>
                          <span>R$ {item.total.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateComandaItemQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateComandaItemQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeComandaItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between mb-4">
                    <div className="font-medium">Total:</div>
                    <div className="font-medium text-lg text-green-600">R$ {subtotal.toFixed(2)}</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleTransferToCart}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={currentComanda.items.length === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Transferir para Carrinho
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => onOpenChange(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // New Comanda View
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-center mb-6">
                <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Criar Nova Comanda</h3>
                <p className="text-gray-500">Digite o nome da pessoa para criar uma nova comanda</p>
              </div>
              
              <div className="w-full max-w-md space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    type="text" 
                    placeholder="Nome da pessoa" 
                    className="pl-9"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createNewComanda()}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={createNewComanda}
                    className="flex-1"
                    disabled={!customerName.trim()}
                  >
                    Criar Comanda
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleShowComandaList}
                  >
                    Ver Comandas
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Combo Options Modal */}
      {comboToConfigure && (
        <ComboOptionsModal
          open={comboModalOpen}
          onOpenChange={setComboModalOpen}
          combo={comboToConfigure}
          onConfirm={handleComboConfirm}
        />
      )}

      {/* Dose Options Modal */}
      {doseToConfigure && (
        <ComboOptionsModal
          open={doseModalOpen}
          onOpenChange={setDoseModalOpen}
          combo={{
            id: doseToConfigure.id,
            name: `Dose de ${doseToConfigure.name}`,
            items: doseToConfigure.items.map((item: any) => ({
              ...item,
              isChoosable: item.allowFlavorSelection
            }))
          }}
          onConfirm={handleDoseConfirm}
          isDoseConfiguration={true}
        />
      )}
    </>
  );
} 