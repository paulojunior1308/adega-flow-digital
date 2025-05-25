import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { ComboOptionsModal } from './ComboOptionsModal';

interface ComboItem {
  id: string;
  productId: string;
  isChoosable: boolean;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    category: {
      id: string;
      name: string;
    };
  };
}

interface Combo {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  items: ComboItem[];
}

export function ComboCarousel() {
  const [combos, setCombos] = React.useState<Combo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCombo, setSelectedCombo] = React.useState<Combo | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const { addToCart } = useCart();

  React.useEffect(() => {
    api.get('/combos')
      .then(response => {
        setCombos(response.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleAddToCart = (combo: Combo) => {
    if (combo.items.some(item => item.isChoosable)) {
      setSelectedCombo(combo);
      setModalOpen(true);
    } else {
      addToCart({
        id: combo.id,
        type: 'combo',
        name: combo.name,
        price: combo.price,
        image: combo.image,
        quantity: 1,
        items: combo.items
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="text-muted-foreground">Carregando combos...</span>
      </div>
    );
  }

  if (combos.length === 0) {
    return null;
  }

  return (
    <>
      <section className="py-8">
        <div className="container">
          <h2 className="text-2xl font-bold mb-6">Combos Especiais</h2>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {combos.map((combo) => (
                <CarouselItem key={combo.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card>
                    {combo.image && (
                      <div className="relative aspect-video">
                        <img
                          src={combo.image}
                          alt={combo.name}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle>{combo.name}</CardTitle>
                      <CardDescription>{combo.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {combo.items.map((item) => (
                          <li key={item.id} className="text-sm text-muted-foreground">
                            {item.product.name}
                            {item.isChoosable && (
                              <span className="ml-1 text-primary">(Escolha o sabor)</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                      <span className="text-lg font-bold">{formatPrice(combo.price)}</span>
                      <Button onClick={() => handleAddToCart(combo)}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </CardFooter>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      {selectedCombo && (
        <ComboOptionsModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          combo={selectedCombo}
          onConfirm={(choosableSelections) => {
            api.post('/cart', {
              comboId: selectedCombo.id,
              quantity: 1,
              choosableSelections
            }).then(() => {
              setModalOpen(false);
            });
          }}
        />
      )}
    </>
  );
} 