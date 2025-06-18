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
import { Input } from '@/components/ui/input';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  isFractioned?: boolean;
  category?: {
    id: string;
    name: string;
  };
}

interface ComboItem {
  id: string;
  productId: string;
  isChoosable?: boolean;
  allowFlavorSelection?: boolean;
  product: Product;
  quantity?: number;
  categoryId?: string;
  volumeToDiscount?: number;
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
    choosableByCategory[item.categoryId].quantity += item.quantity || 0;
    choosableByCategory[item.categoryId].items.push(item);
  });

  // Preencher searchTerms ao abrir o modal OU quando o combo mudar
  React.useEffect(() => {
    if (open && combo) {
      const initialSearchTerms: Record<string, string> = {};
      combo.items.forEach(item => {
        if (item.isChoosable && item.categoryId && item.nameFilter) {
          initialSearchTerms[item.categoryId] = item.nameFilter;
        }
      });
      setSearchTerms(initialSearchTerms);
      // Se houver outros estados relacionados, resetar aqui também
    }
    // eslint-disable-next-line
  }, [open, combo]);

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

  // Resetar estados internos ao fechar o modal
  React.useEffect(() => {
    if (!open) {
      setSearchTerms({});
      setOptions({});
      setChoosableSelections({});
      setLoading(true);
    }
  }, [open]);

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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
              {Object.entries(options).map(([categoryId, categoryOptions]) => {
                const item = choosableItems.find(item => item.categoryId === categoryId);
                const isFractionedCategory = categoryOptions.some(option => option.isFractioned);
                const volumeToDiscount = item?.volumeToDiscount;

                return (
                  <div key={categoryId} className="space-y-4">
                    <h3 className="font-semibold">
                      Escolha {isFractionedCategory ? '1' : (item?.quantity || 1)} para {choosableByCategory[categoryId]?.categoryName}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryOptions.map(option => (
                        <div key={option.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <span>
                              {option.name} - R$ {option.price.toFixed(2)}
                            </span>
                            {isFractionedCategory ? (
                              <input
                                type="radio"
                                name={`option-${categoryId}`}
                                checked={choosableSelections[categoryId]?.[option.id] === volumeToDiscount}
                                onChange={() => {
                                  const newSelections = { ...choosableSelections };
                                  if (!newSelections[categoryId]) newSelections[categoryId] = {};
                                  // Limpa todas as seleções anteriores desta categoria
                                  Object.keys(newSelections[categoryId]).forEach(key => {
                                    newSelections[categoryId][key] = 0;
                                  });
                                  // Define o volume para a opção selecionada
                                  newSelections[categoryId][option.id] = volumeToDiscount || 0;
                                  setChoosableSelections(newSelections);
                                }}
                                className="w-4 h-4"
                              />
                            ) : (
                              <Input
                                type="number"
                                min={0}
                                value={choosableSelections[categoryId]?.[option.id] || 0}
                                onChange={e => handleQuantityChange(categoryId, option.id, Number(e.target.value))}
                                className="w-16"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">
                      Total selecionado: {Object.values(choosableSelections[categoryId] || {}).reduce((sum, q) => sum + q, 0)} / {isFractionedCategory ? '1' : (item?.quantity || 1)}
                    </div>
                    {Object.values(choosableSelections[categoryId] || {}).reduce((sum, q) => sum + q, 0) !== (isFractionedCategory ? 1 : (item?.quantity || 1)) && (
                      <div className="text-sm text-red-500">
                        Selecione exatamente {isFractionedCategory ? '1' : (item?.quantity || 1)} opção(ões).
                      </div>
                    )}
                  </div>
                );
              })}
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