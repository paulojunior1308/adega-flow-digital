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

  // Buscar produtos de cada categoria
  React.useEffect(() => {
    if (open) {
      const fetchOptions = async () => {
        setLoading(true);
        try {
          const categoryIds = Object.keys(choosableByCategory);
          const optionsPromises = categoryIds.map(async (categoryId) => {
            const response = await api.get(`/products?categoryId=${categoryId}`);
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
  }, [open, combo.items]);

  const handleQuantityChange = (itemId: string, optionId: string, value: number) => {
    setChoosableSelections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [optionId]: Math.max(0, value)
      }
    }));
  };

  // Ajustar validação: soma das quantidades por categoria
  const allQuantitiesValid = Object.entries(choosableByCategory).every(([categoryId, group]) => {
    const total = Object.values(choosableSelections[categoryId] || {}).reduce((sum, q) => sum + q, 0);
    return total === group.quantity;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Monte seu Combo</DialogTitle>
          <DialogDescription>
            Selecione os sabores para os itens do combo {combo.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Carregando opções...</p>
          ) : (
            <>
              {fixedItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="font-medium">{item.product.name}</span>
                  <span className="bg-gray-200 rounded px-2 py-1">Fixo</span>
                  <span className="ml-2">Qtd: {item.quantity}</span>
                </div>
              ))}
              {Object.entries(choosableByCategory).map(([categoryId, group]) => (
                <div key={categoryId} className="space-y-2">
                  <label className="text-sm font-medium">
                    Escolha {group.quantity} para {group.categoryName}
                  </label>
                  {options[categoryId]?.length === 0 && (
                    <div className="text-xs text-red-600">Nenhum produto cadastrado para esta categoria.</div>
                  )}
                  {options[categoryId]?.map(option => (
                    option.stock === 0 ? null : (
                      <div key={option.id} className="flex items-center gap-2">
                        <span>{option.name}</span>
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm(choosableSelections);
              onOpenChange(false);
            }}
            disabled={loading || !allQuantitiesValid}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 