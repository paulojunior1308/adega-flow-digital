import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { useCart } from '@/hooks/useCart';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: {
    name: string;
  };
}

interface ComboItem {
  id: string;
  productId: string;
  isChoosable: boolean;
  quantity: number;
  categoryId?: string;
  product: {
    name: string;
    price: number;
    category?: { id: string; name: string };
  };
  selectedOption?: string;
  nameFilter?: string;
}

interface ComboOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  combo: {
    id: string;
    name: string;
    items: ComboItem[];
  };
  onConfirm: (choosableSelections: Record<string, Record<string, number>>) => void;
}

export function ComboOptionsModal({ open, onOpenChange, combo, onConfirm }: ComboOptionsModalProps) {
  const [loading, setLoading] = React.useState(true);
  const [options, setOptions] = React.useState<Record<string, Product[]>>({});
  const [choosableSelections, setChoosableSelections] = React.useState<Record<string, Record<string, number>>>({});
  const [searchTerms, setSearchTerms] = React.useState<Record<string, string>>({});
  const { updateComboOption } = useCart();

  // Agrupar itens escolhíveis por categoriaId
  const choosableItems = combo.items.filter(item => item.isChoosable);
  const fixedItems = combo.items.filter(item => !item.isChoosable);
  const choosableByCategory: Record<string, { categoryName: string, quantity: number, items: ComboItem[] }> = {};
  choosableItems.forEach(item => {
    if (!item.categoryId) return;
    if (!choosableByCategory[item.categoryId]) {
      choosableByCategory[item.categoryId] = {
        categoryName: item.product.category?.name || 'Categoria',
        quantity: 0,
        items: []
      };
    }
    choosableByCategory[item.categoryId].quantity += item.quantity;
    choosableByCategory[item.categoryId].items.push(item);
  });

  // Preencher searchTerms apenas na primeira abertura do modal
  React.useEffect(() => {
    if (open) {
      const initialSearchTerms: Record<string, string> = {};
      combo.items.forEach(item => {
        if (item.isChoosable && item.categoryId && item.nameFilter) {
          initialSearchTerms[item.categoryId] = item.nameFilter;
        }
      });
      setSearchTerms(prev => Object.keys(prev).length === 0 ? initialSearchTerms : prev);
    }
  }, [open, combo.items]);

  // Buscar produtos de cada categoria sempre que searchTerms mudar
  React.useEffect(() => {
    if (open) {
      const fetchOptions = async () => {
        setLoading(true);
        try {
          const categoryIds = Object.keys(choosableByCategory);
          const optionsPromises = categoryIds.map(async (categoryId) => {
            const searchTerm = searchTerms[categoryId] || '';
            const response = await api.get(`/products?categoryId=${categoryId}${searchTerm ? `&search=${searchTerm}` : ''}`);
            return { categoryId, options: response.data };
          });
          const results = await Promise.all(optionsPromises);
          const optionsMap: Record<string, Product[]> = {};
          results.forEach(({ categoryId, options }) => {
            optionsMap[categoryId] = options;
          });
          setOptions(optionsMap);
          // Inicializar seleções por categoria
          const initialSelections: Record<string, Record<string, number>> = {};
          categoryIds.forEach(categoryId => {
            initialSelections[categoryId] = {};
          });
          setChoosableSelections(initialSelections);
        } catch (error) {
          console.error('Erro ao carregar opções:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchOptions();
    }
  }, [open, combo.items, searchTerms]);

  const handleQuantityChange = (itemId: string, optionId: string, value: number) => {
    setChoosableSelections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [optionId]: Math.max(0, value)
      }
    }));
  };

  const handleSearchChange = (categoryId: string, value: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [categoryId]: value
    }));
  };

  // Ajustar validação: soma das quantidades por categoria
  const allQuantitiesValid = Object.entries(choosableByCategory).every(([categoryId, group]) => {
    const total = Object.values(choosableSelections[categoryId] || {}).reduce((sum, q) => sum + q, 0);
    return total === group.quantity;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure seu {combo.name}</DialogTitle>
          <DialogDescription>
            Escolha os produtos para cada categoria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-4">Carregando opções...</div>
          ) : (
            <>
              {Object.entries(choosableByCategory).map(([categoryId, group]) => (
                <div key={categoryId} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Escolha {group.quantity} para {group.categoryName}
                    </label>
                    <div className="relative w-64">
                      <input
                        type="text"
                        placeholder="Buscar produtos..."
                        value={searchTerms[categoryId] || ''}
                        onChange={(e) => handleSearchChange(categoryId, e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                  
                  {options[categoryId]?.length === 0 && (
                    <div className="text-xs text-red-600">Nenhum produto encontrado para esta categoria.</div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {options[categoryId]?.map(option => (
                      option.stock === 0 ? null : (
                        <div key={option.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex-1">
                            <span className="font-medium">{option.name}</span>
                            <p className="text-sm text-gray-500">R$ {option.price.toFixed(2)}</p>
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={group.quantity}
                            value={choosableSelections[categoryId]?.[option.id] || 0}
                            onChange={e => handleQuantityChange(categoryId, option.id, Number(e.target.value))}
                            className="w-16 border rounded px-2 py-1"
                          />
                        </div>
                      )
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Total selecionado: {Object.values(choosableSelections[categoryId] || {}).reduce((sum, q) => sum + q, 0)} / {group.quantity}
                  </div>
                  
                  {Object.values(choosableSelections[categoryId] || {}).reduce((sum, q) => sum + q, 0) !== group.quantity && (
                    <div className="text-xs text-red-600">Selecione exatamente {group.quantity} opções.</div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => onConfirm(choosableSelections)}
            disabled={!allQuantitiesValid}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 