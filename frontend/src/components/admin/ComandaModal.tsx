import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, X, Plus, Minus, Receipt, User, List } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/axios';
import { ComboOptionsModal } from '@/components/home/ComboOptionsModal';
import socket from '@/lib/socket';

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
  comboInstanceId?: string;
}

interface Comanda {
  id: string;
  number: number;
  customerName: string;
  tableNumber?: string;
  items: ComandaItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
  isOpen: boolean;
  user?: {
    name: string;
  };
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

  // Carregar comandas da API
  useEffect(() => {
    if (open) {
      loadComandas();
    }
  }, [open]);

  // Função para carregar comandas
  const loadComandas = async () => {
    try {
      const response = await api.get('/admin/comandas');
      const comandasWithDates = response.data.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      }));
      setComandas(comandasWithDates);
    } catch (error) {
      console.error('Erro ao carregar comandas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as comandas.",
        variant: "destructive",
      });
    }
  };

  // WebSocket para sincronização em tempo real
  useEffect(() => {
    if (!open) return;

    // Ouvir eventos de comandas
    const handleComandaCreated = (data: { comanda: Comanda }) => {
      const comandaWithDates = {
        ...data.comanda,
        createdAt: new Date(data.comanda.createdAt),
        updatedAt: new Date(data.comanda.updatedAt)
      };
      setComandas(prev => {
        const exists = prev.some(c => c.id === comandaWithDates.id);
        if (!exists) {
          return [comandaWithDates, ...prev];
        }
        return prev;
      });
    };

    const handleComandaUpdated = (data: { comanda: Comanda }) => {
      const comandaWithDates = {
        ...data.comanda,
        createdAt: new Date(data.comanda.createdAt),
        updatedAt: new Date(data.comanda.updatedAt)
      };
      setComandas(prev => prev.map(c => 
        c.id === comandaWithDates.id ? comandaWithDates : c
      ));
      
      // Se a comanda atual foi atualizada, atualizar também
      if (currentComanda?.id === comandaWithDates.id) {
        setCurrentComanda(comandaWithDates);
      }
    };

    const handleComandaClosed = (data: { comanda: Comanda }) => {
      const comandaWithDates = {
        ...data.comanda,
        createdAt: new Date(data.comanda.createdAt),
        updatedAt: new Date(data.comanda.updatedAt)
      };
      setComandas(prev => prev.map(c => 
        c.id === comandaWithDates.id ? comandaWithDates : c
      ));
    };

    const handleComandaReopened = (data: { comanda: Comanda }) => {
      const comandaWithDates = {
        ...data.comanda,
        createdAt: new Date(data.comanda.createdAt),
        updatedAt: new Date(data.comanda.updatedAt)
      };
      setComandas(prev => prev.map(c => 
        c.id === comandaWithDates.id ? comandaWithDates : c
      ));
    };

    const handleComandaDeleted = (data: { comandaId: string }) => {
      setComandas(prev => prev.filter(c => c.id !== data.comandaId));
      if (currentComanda?.id === data.comandaId) {
        setCurrentComanda(null);
        setShowComandaList(true);
      }
    };

    socket.on('comanda-created', handleComandaCreated);
    socket.on('comanda-updated', handleComandaUpdated);
    socket.on('comanda-closed', handleComandaClosed);
    socket.on('comanda-reopened', handleComandaReopened);
    socket.on('comanda-deleted', handleComandaDeleted);

    return () => {
      socket.off('comanda-created', handleComandaCreated);
      socket.off('comanda-updated', handleComandaUpdated);
      socket.off('comanda-closed', handleComandaClosed);
      socket.off('comanda-reopened', handleComandaReopened);
      socket.off('comanda-deleted', handleComandaDeleted);
    };
  }, [open, currentComanda]);

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
  const createNewComanda = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome da pessoa para criar a comanda.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.post('/admin/comandas', {
        customerName: customerName.trim(),
        tableNumber: null // Pode ser adicionado depois se necessário
      });

      const newComanda = {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };

      setCurrentComanda(newComanda);
      setCustomerName('');
      setShowComandaList(false);
      toast({
        title: "Comanda criada",
        description: `Comanda #${newComanda.number} criada para ${newComanda.customerName}.`,
      });
    } catch (error) {
      console.error('Erro ao criar comanda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a comanda.",
        variant: "destructive",
      });
    }
  };

  // Open existing comanda
  const openComanda = (comanda: Comanda) => {
    setCurrentComanda(comanda);
    setShowComandaList(false);
  };

  // Close comanda
  const closeComanda = async (comandaId: string) => {
    try {
      await api.put(`/admin/comandas/${comandaId}/close`);
      
      if (currentComanda?.id === comandaId) {
        setCurrentComanda(null);
        setShowComandaList(true);
      }

      toast({
        title: "Comanda fechada",
        description: "A comanda foi fechada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao fechar comanda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fechar a comanda.",
        variant: "destructive",
      });
    }
  };

  // Add item to comanda
  const addToComanda = async (item: any, quantity: number = 1) => {
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
    try {
      await api.post(`/admin/comandas/${currentComanda.id}/items`, {
        productId: item.id,
        code: item.code || item.id.substring(0, 6),
        name: `${item.name} (Avulso)`,
        quantity: quantity,
        price: item.price,
        isDoseItem: false,
        isFractioned: item.isFractioned || false,
        discountBy: null,
        choosableSelections: null
      });
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item à comanda.",
        variant: "destructive",
      });
    }
  };

  // Handle combo configuration
  const handleComboConfirm = async (choosableSelections: Record<string, Record<string, number>>) => {
    if (!currentComanda || !comboToConfigure) return;

    // Montar lista de produtos do combo (fixos e escolhidos)
    const produtosCombo: { product: Product, quantidade: number, discountBy?: 'volume' | 'unit' }[] = [];
    // Fixos
    for (const item of comboToConfigure.items) {
      if (!item.isChoosable && item.product) {
        produtosCombo.push({
          product: item.product,
          quantidade: Math.max(1, item.quantity),
          discountBy: item.discountBy
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
              product,
              quantidade: Number(quantidade),
              discountBy: undefined
            });
          }
        }
      }
    }

    // Calcular valor proporcional igual ao PDV
    const totalOriginalPrice = produtosCombo.reduce((sum, item) => sum + item.product.price * (item.discountBy === 'volume' ? 1 : item.quantidade), 0);
    let accumulatedPrice = 0;
    for (let i = 0; i < produtosCombo.length; i++) {
      const item = produtosCombo[i];
      const proportion = (item.product.price * (item.discountBy === 'volume' ? 1 : item.quantidade)) / totalOriginalPrice;
      let proportionalPrice = comboToConfigure.price * proportion;
      proportionalPrice = Math.round(proportionalPrice * 100) / 100;
      accumulatedPrice += proportionalPrice;
      if (i === produtosCombo.length - 1) {
        proportionalPrice += (comboToConfigure.price - accumulatedPrice);
      }
      const precoUnitario = proportionalPrice / item.quantidade;
      try {
        await api.post(`/admin/comandas/${currentComanda.id}/items`, {
          productId: item.product.id,
          code: item.product.code || item.product.id.substring(0, 6),
          name: `Combo ${comboToConfigure.name} - ${item.product.name}`,
          quantity: item.quantidade,
          price: precoUnitario,
          isDoseItem: false,
          isFractioned: item.product.isFractioned,
          discountBy: item.discountBy,
          choosableSelections: null
        });
      } catch (error) {
        console.error('Erro ao adicionar item do combo:', error);
      }
    }

    setComboModalOpen(false);
    setComboToConfigure(null);

    toast({
      description: `${comboToConfigure.name} adicionado à comanda.`
    });
  };

  const handleDoseConfirm = async (choosableSelections: Record<string, Record<string, number>>) => {
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

        try {
          await api.post(`/admin/comandas/${currentComanda.id}/items`, {
            productId: produto.productId,
            code: produto.productId.substring(0, 6),
            name: `Dose de ${doseToConfigure.name} - ${produto.nome}`,
            quantity: produto.quantidade,
            price: precoUnitario,
            isDoseItem: true,
            isFractioned: produto.isFractioned,
            discountBy: produto.isFractioned ? 'volume' : 'unit',
            choosableSelections: {
                [doseToConfigure.id]: { [produto.productId]: produto.quantidade }
            }
          });
        } catch (error) {
          console.error('Erro ao adicionar item da dose:', error);
        }
    }

    setDoseModalOpen(false);
    setDoseToConfigure(null);
    toast({
      description: `Dose de ${doseToConfigure.name} adicionada à comanda.`
    });
  };

  // Update item quantity
  const updateComandaItemQuantity = async (itemId: string, newQuantity: number) => {
    if (!currentComanda) return;

    if (newQuantity <= 0) {
      removeComandaItem(itemId);
      return;
    }

    try {
      await api.put(`/admin/comandas/${currentComanda.id}/items/${itemId}`, {
        quantity: newQuantity
      });
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quantidade.",
        variant: "destructive",
      });
    }
  };

  // Remove item from comanda
  const removeComandaItem = async (itemId: string) => {
    if (!currentComanda) return;

    try {
      await api.delete(`/admin/comandas/${currentComanda.id}/items/${itemId}`);
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item.",
        variant: "destructive",
      });
    }
  };

  // Add product by code
  const handleAddProductByCode = async () => {
    const product = products.find(p => p.code === productCode);
    if (product) {
      await addToComanda(product, productQuantity);
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
  const handleTransferToCart = async () => {
    if (!currentComanda || currentComanda.items.length === 0) return;

    try {
      const itemsToTransfer: any[] = [];
      // Agrupar combos por nome do combo
      const combosMap: Record<string, { comboName: string, items: any[] }> = {};
      currentComanda.items.forEach(item => {
        if (item.name.toLowerCase().includes('combo')) {
          // Extrai o nome do combo (ex: "Combo Combo de Jack Daniel's - Produto")
          const match = item.name.match(/Combo (.+?)( - |$)/i);
          const comboName = match ? match[1].trim() : item.name;
          if (!combosMap[comboName]) {
            combosMap[comboName] = { comboName, items: [] };
          }
          combosMap[comboName].items.push(item);
        } else {
          // Produto avulso ou dose
          let type: 'product' | 'combo' = 'product';
          let isComboItem = false;
          let isDoseItem = false;
          if (item.name.toLowerCase().includes('dose')) isDoseItem = true;
          itemsToTransfer.push({
            ...item,
            id: `${item.productId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type,
            isComboItem,
            isDoseItem,
            total: item.price * item.quantity,
          });
        }
      });

      // Para cada combo, buscar o combo original pelo nome e montar os itens proporcionais igual ao PDV
      Object.values(combosMap).forEach(({ comboName, items }) => {
        const comboOriginal = combos.find((c: any) => c.name === comboName);
        if (!comboOriginal) {
          items.forEach(i => itemsToTransfer.push(i));
          return;
        }
        // Descobrir a quantidade de combos: menor quantidade entre os produtos do combo presentes na comanda
        const comboProductIds = comboOriginal.items.map((i: any) => i.product.id);
        const quantities = comboProductIds.map(pid => {
          const item = items.find(i => i.productId === pid);
          return item ? item.quantity : 0;
        });
        const comboQty = Math.min(...quantities.filter(q => q > 0));
        if (!comboQty || comboQty === 0) return; // Não transferir se não houver todos os produtos do combo
        // Valor total do combo (forçado): preço do combo original * quantidade de combos
        const finalPrice = comboOriginal.price * comboQty;
        // Montar os itens do combo igual ao PDV
        const allItems: { product: Product; quantity: number; discountBy?: 'volume' | 'unit' }[] = [];
        comboOriginal.items.forEach((item: any) => {
          if (!item.product) return;
          allItems.push({
            product: item.product,
            quantity: item.quantity * comboQty,
            discountBy: item.discountBy
          });
        });
        const totalOriginalPrice = allItems.reduce((sum, item) => sum + item.product.price * (item.discountBy === 'volume' ? 1 : item.quantity), 0);
        let accumulatedPrice = 0;
        allItems.forEach((item, index) => {
          const proportion = (item.product.price * (item.discountBy === 'volume' ? 1 : item.quantity)) / totalOriginalPrice;
          let proportionalPrice = finalPrice * proportion;
          proportionalPrice = Math.round(proportionalPrice * 100) / 100;
          accumulatedPrice += proportionalPrice;
          if (index === allItems.length - 1) {
            proportionalPrice += (finalPrice - accumulatedPrice);
          }
          itemsToTransfer.push({
            id: `${comboOriginal.id}-${item.product.id}-${Date.now()}`,
            productId: item.product.id,
            code: item.product.code,
            name: `${item.product.name} (Combo: ${comboOriginal.name})`,
            quantity: item.quantity,
            price: proportionalPrice / item.quantity,
            total: proportionalPrice,
            isComboItem: true,
            isDoseItem: false,
            isFractioned: item.product.isFractioned,
            discountBy: item.discountBy,
            type: 'combo',
          });
        });
      });

      // Transferir todos os itens de uma vez para o carrinho
      onTransferToCart(itemsToTransfer);

      // Fechar a comanda
      await closeComanda(currentComanda.id);
      
      // Fechar o modal
      onOpenChange(false);

      toast({
        title: "Itens transferidos",
        description: `${currentComanda.items.length} itens foram transferidos para o carrinho.`,
      });
    } catch (error) {
      console.error('Erro ao transferir itens:', error);
      toast({
        title: "Erro",
        description: "Não foi possível transferir os itens.",
        variant: "destructive",
      });
    }
  };

  // Reset comanda
  const handleResetComanda = async () => {
    if (!currentComanda) return;

    try {
      // Remover todos os itens da comanda
      for (const item of currentComanda.items) {
        await api.delete(`/admin/comandas/${currentComanda.id}/items/${item.id}`);
      }
      
      toast({
        title: "Comanda resetada",
        description: "Todos os itens foram removidos da comanda.",
      });
    } catch (error) {
      console.error('Erro ao resetar comanda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível resetar a comanda.",
        variant: "destructive",
      });
    }
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
                          onClick={async () => await closeComanda(comanda.id)} 
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
                          onClick={async () => await addToComanda(product)}
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
                          onClick={async () => await updateComandaItemQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={async () => await updateComandaItemQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={async () => await removeComandaItem(item.id)}
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