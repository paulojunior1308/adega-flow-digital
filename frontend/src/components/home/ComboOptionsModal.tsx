import React, { useState, useEffect } from 'react';
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
import api from '@/lib/api';
import { useCart } from '@/hooks/useCart';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  isFractioned?: boolean;
  totalVolume?: number;
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
  discountBy?: 'volume' | 'unit';
}

interface ComboOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  combo: {
    id: string;
    name: string;
    type?: 'combo' | 'dose';
    items: ComboItem[];
  };
  onConfirm: (choosableSelections: Record<string, Record<string, number>>) => void;
  isDoseConfiguration?: boolean;
  products?: Product[];
}

export function ComboOptionsModal({ open, onOpenChange, combo, onConfirm }: ComboOptionsModalProps) {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<Record<string, Product[]>>({});
  const [choosableSelections, setChoosableSelections] = useState<Record<string, Record<string, number>>>({});

  // Agrupar itens escolhíveis por categoria
  const choosableByCategory = React.useMemo(() => {
    const grouped: Record<string, {
      categoryName: string;
      items: ComboItem[];
      // Define o modo de seleção da categoria (volume ou unidade)
      selectionMode: 'volume' | 'unit';
      // Total a ser selecionado (seja em ml ou em unidades)
      quantity: number;
      nameFilter?: string | null;
    }> = {};

    combo.items
      .filter(item => item.isChoosable)
      .forEach(item => {
        if (!item.categoryId) return;
        if (!grouped[item.categoryId]) {
          const firstItem = combo.items.find(i => i.categoryId === item.categoryId);
          const isVolume = firstItem?.discountBy === 'volume';
          grouped[item.categoryId] = {
            categoryName: item.product.category?.name || 'Categoria',
            items: [],
            selectionMode: isVolume ? 'volume' : 'unit',
            quantity: isVolume ? (firstItem?.volumeToDiscount || 0) : 0,
            nameFilter: firstItem?.nameFilter,
          };
        }
        grouped[item.categoryId].items.push(item);
        if (grouped[item.categoryId].selectionMode === 'unit') {
          grouped[item.categoryId].quantity += item.quantity || 0;
        }
      });
    return grouped;
  }, [combo.items]);

  // Buscar opções de produtos para cada categoria
  useEffect(() => {
    if (open) {
      const fetchOptions = async () => {
        setLoading(true);
        try {
          const categoryIds = Object.keys(choosableByCategory);
          const optionsPromises = categoryIds.map(id => api.get(`/products?categoryId=${id}`));
          const responses = await Promise.all(optionsPromises);
          
          const newOptions: Record<string, Product[]> = {};
          const newSelections: Record<string, Record<string, number>> = {};
          
          responses.forEach((res, index) => {
            const categoryId = categoryIds[index];
            const config = choosableByCategory[categoryId];
            let products = res.data as Product[];

            if (config.nameFilter) {
              products = products.filter(p =>
                p.name.toLowerCase().includes(config.nameFilter!.toLowerCase())
              );
            }

            newOptions[categoryId] = products;
            newSelections[categoryId] = {};
            products.forEach((p: Product) => {
              newSelections[categoryId][p.id] = 0;
            });
          });

          setOptions(newOptions);
          setChoosableSelections(newSelections);
        } catch (error) {
          console.error('Erro ao carregar opções:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchOptions();
    }
  }, [open, choosableByCategory]);

  const handleSelectionChange = (categoryId: string, productId: string, value: number | string) => {
    const categoryConfig = choosableByCategory[categoryId];
    
    setChoosableSelections(prev => {
      const newSelections = { ...prev };
      const categorySelections = { ...(newSelections[categoryId] || {}) };

      if (categoryConfig.selectionMode === 'volume') {
        // Lógica de Radio Button: zera os outros e seta o valor da categoria no item selecionado
        Object.keys(categorySelections).forEach(key => {
          categorySelections[key] = 0;
        });
        // Atribui o valor total esperado para a categoria ao item selecionado.
        categorySelections[productId] = categoryConfig.quantity;
      } else {
        // Lógica de Input Numérico: atualiza o valor, respeitando o máximo
        const numericValue = Number(value);
        const currentTotal = Object.entries(categorySelections)
            .reduce((sum, [id, q]) => sum + (id === productId ? 0 : q), 0);

        const maxAllowed = categoryConfig.quantity - currentTotal;
        categorySelections[productId] = Math.max(0, Math.min(numericValue, maxAllowed));
      }
      
      newSelections[categoryId] = categorySelections;
      return newSelections;
    });
  };

  // Validação do botão de confirmação
  const allQuantitiesValid = Object.entries(choosableByCategory).every(([categoryId, config]) => {
    const totalSelected = Object.values(choosableSelections[categoryId] || {}).reduce((sum, q) => sum + q, 0);
    return totalSelected === config.quantity;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure seu {combo.name}</DialogTitle>
          <DialogDescription>Escolha os produtos para cada categoria</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading && <div className="text-center py-4">Carregando opções...</div>}
          
          {!loading && Object.entries(choosableByCategory).map(([categoryId, config]) => {
            const categoryOptions = options[categoryId] || [];
            const totalSelected = Object.values(choosableSelections[categoryId] || {}).reduce((sum, q) => sum + q, 0);
            
            return (
              <div key={categoryId} className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold">
                  {config.selectionMode === 'volume'
                    ? `Escolha ${config.quantity}ml para ${config.categoryName}`
                    : `Escolha ${config.quantity} para ${config.categoryName}`}
                </h3>
                
                {config.selectionMode === 'volume' ? (
                  <RadioGroup
                    onValueChange={(productId) => handleSelectionChange(categoryId, productId, 0)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {categoryOptions.map(option => (
                      <Label
                        key={option.id}
                        htmlFor={option.id}
                        className="flex items-center justify-between p-4 border rounded-lg cursor-pointer [&:has([data-state=checked])]:border-primary"
                      >
                        <span>{option.name} - R$ {option.price.toFixed(2)}</span>
                        <RadioGroupItem value={option.id} id={option.id} />
                      </Label>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryOptions.map(option => (
                      <div key={option.id} className="p-4 border rounded-lg flex justify-between items-center">
                        <span>{option.name} - R$ {option.price.toFixed(2)}</span>
                        <Input
                          type="number"
                          className="w-20"
                          value={choosableSelections[categoryId]?.[option.id] || 0}
                          onChange={(e) => handleSelectionChange(categoryId, option.id, e.target.value)}
                          min={0}
                          max={config.quantity}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  Total selecionado: {totalSelected} / {config.quantity}
                  {config.selectionMode === 'volume' && 'ml'}
                </div>
                {totalSelected !== config.quantity && (
                  <div className="text-sm text-red-500">
                    Selecione exatamente {config.quantity}{config.selectionMode === 'volume' ? 'ml' : ' opção(ões)'}.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onConfirm(choosableSelections)} disabled={!allQuantitiesValid || loading}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 