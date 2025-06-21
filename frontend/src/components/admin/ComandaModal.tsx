import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, X, Plus, Minus, Receipt, User, List, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [comandaSearch, setComandaSearch] = useState('');

  // Carregar comandas do localStorage
  useEffect(() => {
    const savedComandas = localStorage.getItem('comandas');
    if (savedComandas) {
      const parsed = JSON.parse(savedComandas);
      const comandasWithDates = parsed.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        items: c.items || [] // Garante que items seja um array
      }));
      setComandas(comandasWithDates);
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

  const allItems = useMemo(() => [
    ...products.map(p => ({ ...p, type: 'product' })),
    ...combos.map(c => ({ ...c, type: 'combo', code: c.id.substring(0, 6) })),
    ...doses.map(d => ({ ...d, type: 'dose', code: d.id.substring(0, 6) }))
  ], [products, combos, doses]);

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

  const subtotal = currentComanda?.items.reduce((sum, item) => sum + item.total, 0) || 0;

  const createNewComanda = () => {
    if (!customerName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do cliente para criar a comanda.",
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
    toast({
      title: "Comanda criada",
      description: `Comanda #${newComanda.number} criada para ${newComanda.customerName}.`,
    });
  };

  const openComanda = (comanda: Comanda) => {
    setCurrentComanda(comanda);
  };
  
  const updateComandaInList = (updatedComanda: Comanda) => {
    const updatedTotal = updatedComanda.items.reduce((sum, item) => sum + item.total, 0);
    const finalComanda = {...updatedComanda, total: updatedTotal};

    setComandas(prev => prev.map(c => c.id === finalComanda.id ? finalComanda : c));
    setCurrentComanda(finalComanda);
  };

  const addToComanda = (item: any, quantity: number = 1) => {
    if (!currentComanda) return;

    const existingItemIndex = currentComanda.items.findIndex(ci => ci.productId === item.id);

    let newItems: ComandaItem[];

    if (existingItemIndex > -1) {
      newItems = currentComanda.items.map((ci, index) => {
        if (index === existingItemIndex) {
          const newQuantity = ci.quantity + quantity;
          return { ...ci, quantity: newQuantity, total: ci.price * newQuantity };
        }
        return ci;
      });
    } else {
      const newItem: ComandaItem = {
        id: Math.random().toString(36).substring(2, 8),
        productId: item.id,
        code: item.code,
        name: item.name,
        quantity: quantity,
        price: item.price,
        total: item.price * quantity,
      };
      newItems = [...currentComanda.items, newItem];
    }
    
    updateComandaInList({ ...currentComanda, items: newItems });
    toast({ description: `${item.name} adicionado à comanda.` });
  };

  const updateComandaItemQuantity = (itemId: string, newQuantity: number) => {
    if (!currentComanda) return;
    if (newQuantity < 1) {
      removeComandaItem(itemId);
      return;
    }
    const newItems = currentComanda.items.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: newQuantity, total: item.price * newQuantity };
      }
      return item;
    });
    updateComandaInList({ ...currentComanda, items: newItems });
  };

  const removeComandaItem = (itemId: string) => {
    if (!currentComanda) return;
    const newItems = currentComanda.items.filter(item => item.id !== itemId);
    updateComandaInList({ ...currentComanda, items: newItems });
    toast({ description: `Item removido da comanda.` });
  };

  const handleResetComanda = () => {
    if (!currentComanda) return;
    updateComandaInList({ ...currentComanda, items: [] });
    toast({ description: `Itens da comanda #${currentComanda.number} foram limpos.` });
  };

  const handleTransferToCart = () => {
    if (!currentComanda || currentComanda.items.length === 0) {
      toast({
        variant: "destructive",
        description: "Não há itens para transferir.",
      });
      return;
    }
    onTransferToCart(currentComanda.items);
    toast({ description: `Itens da comanda #${currentComanda.number} transferidos para o caixa.` });
    setCurrentComanda(null);
    onOpenChange(false);
  };
  
  const closeComanda = (comandaId: string) => {
    setComandas(prev => prev.map(c => c.id === comandaId ? { ...c, isOpen: false } : c));
    if (currentComanda?.id === comandaId) {
      setCurrentComanda(null);
    }
  };
  
  const handleTransferAndClose = (comanda: Comanda) => {
    if (comanda.items.length > 0) {
      onTransferToCart(comanda.items);
    }
    closeComanda(comanda.id);
    toast({
      title: "Comanda Encerrada",
      description: `Comanda #${comanda.number} de ${comanda.customerName} foi encerrada.`,
    });
  };
  
  const handleShowComandaList = () => {
    setCurrentComanda(null);
  };

  const filteredComandas = useMemo(() => {
    return comandas.filter(c =>
      c.customerName.toLowerCase().includes(comandaSearch.toLowerCase()) ||
      c.number.toString().includes(comandaSearch)
    ).sort((a, b) => b.number - a.number);
  }, [comandas, comandaSearch]);

  const renderComandaList = () => (
    <>
      <DialogHeader>
        <DialogTitle>Gerenciador de Comandas</DialogTitle>
      </DialogHeader>
      
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            placeholder="Nome do cliente para nova comanda"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createNewComanda()}
          />
          <Button onClick={createNewComanda} disabled={!customerName.trim()}>
            <Plus className="mr-2 h-4 w-4" /> Criar Nova Comanda
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar comanda por nome ou número..."
            className="pl-9"
            value={comandaSearch}
            onChange={(e) => setComandaSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="h-[50vh] flex-1">
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComandas.filter(c => c.isOpen).length > 0 ? (
            filteredComandas.filter(c => c.isOpen).map(comanda => (
              <Card key={comanda.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-lg">
                    <span>Comanda #{comanda.number}</span>
                    <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Aberta</span>
                  </CardTitle>
                  <p className="text-sm text-gray-500 pt-1">{comanda.customerName}</p>
                </CardHeader>
                <CardContent>
                  <p>{comanda.items.length} item(s)</p>
                  <p className="font-semibold text-lg">Total: R$ {comanda.total.toFixed(2)}</p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button onClick={() => openComanda(comanda)} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Itens
                  </Button>
                  <Button variant="outline" title="Transferir para o caixa e fechar" size="icon" onClick={() => handleTransferAndClose(comanda)}>
                    <Receipt className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500">
              <List className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium">Nenhuma comanda aberta</h3>
              <p className="mt-1 text-sm">Crie uma nova comanda para começar.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );

  const renderComandaDetail = () => (
    <>
      <DialogHeader className="flex flex-row items-center justify-between pr-6 border-b pb-4">
        <div>
          <DialogTitle>Comanda #{currentComanda?.number} - {currentComanda?.customerName}</DialogTitle>
          <p className="text-sm text-gray-500">{currentComanda?.items.length || 0} item(s) no total</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleShowComandaList}>
           <ArrowLeft className="h-5 w-5" />
        </Button>
      </DialogHeader>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden p-1 lg:p-4">
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-2">
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
          </div>
          <ScrollArea className="flex-1 bg-white rounded-lg p-2 border">
            {searchQuery.trim() !== '' && (
              <div className="grid grid-cols-1 gap-1">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    className="text-left p-2 border-b rounded-md hover:bg-gray-100 transition-colors w-full"
                    onClick={() => addToComanda(product)}
                  >
                    <div className="font-medium text-sm">{product.name}</div>
                    <div className="text-sm text-green-600">R$ {product.price.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            )}
            {searchQuery.trim() !== '' && filteredProducts.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-4">Nenhum produto encontrado.</div>
            )}
          </ScrollArea>
        </div>

        <div className="lg:w-2/5 flex flex-col gap-2 overflow-hidden">
          <h3 className="font-semibold text-lg px-4 lg:px-0">Itens na Comanda</h3>
          <ScrollArea className="h-full bg-gray-50 p-2 rounded-lg border">
            {currentComanda?.items.length > 0 ? (
              currentComanda.items.map(item => (
                <div key={item.id} className="p-2 border-b last:border-b-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm flex-1 pr-2">{item.name}</span>
                    <span className="font-bold text-sm">R$ {item.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateComandaItemQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3"/></Button>
                    <span>{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateComandaItemQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3"/></Button>
                    <div className="flex-grow"></div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeComandaItem(item.id)}><X className="h-4 w-4"/></Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">Nenhum item adicionado</div>
            )}
          </ScrollArea>
        </div>
      </div>

      <DialogFooter className="p-4 bg-gray-100 border-t">
        <div className="flex justify-between items-center w-full flex-wrap gap-2">
            <div className="text-lg">
                Total: <span className="font-bold">R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
                <Button variant="destructive" onClick={handleResetComanda}>Limpar Itens</Button>
                <Button onClick={handleTransferToCart} className="bg-green-600 hover:bg-green-700">
                <ShoppingCart className="mr-2 h-4 w-4" /> Transferir p/ Caixa
                </Button>
            </div>
        </div>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        {currentComanda ? renderComandaDetail() : renderComandaList()}
      </DialogContent>
    </Dialog>
  );
} 