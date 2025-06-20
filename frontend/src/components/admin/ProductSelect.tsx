import React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  price: number;
  category?: {
    name: string;
  };
}

interface ProductSelectProps {
  name: string;
  multiple?: boolean;
  defaultValue?: string[];
  required?: boolean;
}

export function ProductSelect({ name, multiple = false, defaultValue = [], required = false }: ProductSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/admin/products')
      .then(response => {
        setProducts(response.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const selectedProducts = products.filter(product => selectedValues.includes(product.id));

  const handleSelect = (value: string) => {
    let newValues: string[];
    if (multiple) {
      newValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
    } else {
      newValues = [value];
      setOpen(false);
    }
    setSelectedValues(newValues);
  };

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            {loading ? (
              <span>Carregando produtos...</span>
            ) : selectedProducts.length > 0 ? (
              multiple ? (
                <span>{selectedProducts.length} produtos selecionados</span>
              ) : (
                <span>{selectedProducts[0]?.name}</span>
              )
            ) : (
              <span>Selecione os produtos</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar produto..." />
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => handleSelect(product.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(product.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{product.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {product.category?.name} - R$ {product.price.toFixed(2)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {multiple && selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map(product => (
            <Badge
              key={product.id}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => handleSelect(product.id)}
            >
              {product.name}
              <span className="ml-1 opacity-60">×</span>
            </Badge>
          ))}
        </div>
      )}

      {selectedValues.map(value => (
        <input
          key={value}
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      ))}
    </div>
  );
} 