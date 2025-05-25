
import React, { useState } from 'react';
import ClientSidebar from '@/components/client/ClientSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Plus, Star } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Reutilizando as mesmas interfaces e dados de exemplo
interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  description: string;
  category: string;
  rating: number;
  tags: string[];
}

// Dados de exemplo - em uma aplicação real, viriam de uma API
const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Skol 350ml - Pack com 12",
    price: 39.90,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    description: "Pack com 12 unidades de cerveja Skol 350ml",
    category: "cervejas",
    rating: 4.5,
    tags: ["cerveja", "pack", "skol"]
  },
  {
    id: 2,
    name: "Vodka Smirnoff 998ml",
    price: 49.90,
    oldPrice: 59.90,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    description: "Vodka Smirnoff Original 998ml",
    category: "destilados",
    rating: 4.8,
    tags: ["vodka", "destilado", "smirnoff"]
  },
  {
    id: 3,
    name: "Essência Narguilé Love66 - 50g",
    price: 29.90,
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04",
    description: "Essência para narguilé sabor Love66 - 50g",
    category: "narguile",
    rating: 4.7,
    tags: ["narguile", "essencia", "love66"]
  },
  {
    id: 4,
    name: "Red Label 750ml",
    price: 89.90,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    description: "Whisky Johnnie Walker Red Label 750ml",
    category: "whisky",
    rating: 4.6,
    tags: ["whisky", "destilado", "johnnie walker"]
  },
  {
    id: 5,
    name: "Jack Daniel's 1L",
    price: 129.90,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    description: "Whiskey Jack Daniel's Old No. 7 - 1 Litro",
    category: "whisky",
    rating: 4.9,
    tags: ["whiskey", "destilado", "jack daniels"]
  },
  {
    id: 6,
    name: "Pack Heineken 6 Long Necks",
    price: 45.90,
    oldPrice: 49.90,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    description: "Pack com 6 cervejas Heineken Long Neck 330ml",
    category: "cervejas",
    rating: 4.7,
    tags: ["cerveja", "pack", "heineken"]
  },
  {
    id: 7,
    name: "Monster Energy 473ml",
    price: 9.90,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    description: "Energético Monster Energy tradicional 473ml",
    category: "energeticos",
    rating: 4.5,
    tags: ["energetico", "monster", "bebida"]
  },
  {
    id: 8,
    name: "Carvão para Narguile Premium 1kg",
    price: 24.90,
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04",
    description: "Carvão premium para narguile - embalagem com 1kg",
    category: "narguile",
    rating: 4.6,
    tags: ["narguile", "carvao"]
  },
];

// Categorias disponíveis
const CATEGORIES = [
  { id: "cervejas", name: "Cervejas" },
  { id: "destilados", name: "Destilados" },
  { id: "whisky", name: "Whisky" },
  { id: "narguile", name: "Narguile" },
  { id: "energeticos", name: "Energéticos" },
  { id: "combos", name: "Combos" },
];

// Tags disponíveis para filtro
const TAGS = [
  "cerveja",
  "destilado",
  "whisky",
  "vodka",
  "narguile",
  "energetico",
  "pack",
  "essencia"
];

const ClientSearch = () => {
  // Estado de busca e filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState([0, 150]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [showOffers, setShowOffers] = useState(false);

  const { toast } = useToast();
  
  // Filtra produtos
  const filteredProducts = PRODUCTS.filter(product => {
    // Filtro por termo de busca
    const matchesSearch = searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por preço
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    // Filtro por categoria
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(product.category);
    
    // Filtro por tags
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => product.tags.includes(tag));
    
    // Filtro por rating
    const matchesRating = product.rating >= minRating;
    
    // Filtro por ofertas
    const matchesOffers = !showOffers || (showOffers && product.oldPrice);
    
    return matchesSearch && matchesPrice && matchesCategory && matchesTags && matchesRating && matchesOffers;
  });
  
  // Adicionar ao carrinho (simulado)
  const addToCart = (product: Product) => {
    toast({
      title: "Produto adicionado",
      description: `${product.name} adicionado ao carrinho`,
      duration: 2000,
    });
  };
  
  // Reset de filtros
  const resetFilters = () => {
    setPriceRange([0, 150]);
    setSelectedCategories([]);
    setSelectedTags([]);
    setMinRating(0);
    setShowOffers(false);
  };

  // Função para renderizar um card de produto
  const renderProductCard = (product: Product) => (
    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-40">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
        {product.oldPrice && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
            Oferta
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center mb-2">
          <div className="flex items-center mr-2">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm ml-1">{product.rating}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {CATEGORIES.find(c => c.id === product.category)?.name}
          </Badge>
        </div>
        <h3 className="font-medium line-clamp-2 mb-1">{product.name}</h3>
        <div className="flex justify-between items-end mt-2">
          <div>
            <p className="font-bold text-lg text-element-blue-dark">R$ {product.price.toFixed(2)}</p>
            {product.oldPrice && (
              <p className="text-sm text-element-gray-dark/60 line-through">
                R$ {product.oldPrice.toFixed(2)}
              </p>
            )}
          </div>
          <Button 
            onClick={() => addToCart(product)} 
            variant="outline" 
            size="icon" 
            className="rounded-full hover:bg-element-blue-neon hover:text-white"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
  
  return (
    <div className="min-h-screen bg-element-gray-light">
      <ClientSidebar />
      
      <div className="lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Header e busca avançada */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark mb-4 md:mb-0">
              Busca Avançada
            </h1>
            
            <div className="flex items-center space-x-3">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-element-gray-dark/60" />
                <Input
                  type="text"
                  placeholder="Busque produtos por nome ou descrição..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filtrar Produtos</SheetTitle>
                  </SheetHeader>
                  
                  <div className="py-6 space-y-6">
                    {/* Filtro de preço */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Faixa de Preço</h3>
                      <div className="space-y-4">
                        <Slider
                          defaultValue={[0, 150]}
                          max={150}
                          step={5}
                          value={priceRange}
                          onValueChange={setPriceRange}
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-sm">R$ {priceRange[0]}</p>
                          <p className="text-sm">R$ {priceRange[1]}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Filtro de categorias */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Categorias</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {CATEGORIES.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category.id}`}
                              checked={selectedCategories.includes(category.id)}
                              onCheckedChange={(checked) => {
                                setSelectedCategories(prev => 
                                  checked 
                                    ? [...prev, category.id] 
                                    : prev.filter(id => id !== category.id)
                                );
                              }}
                            />
                            <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Filtro de tags */}
                    <div>
                      <h3 className="text-sm font-medium mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {TAGS.map((tag) => (
                          <Badge 
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedTags(prev => 
                                prev.includes(tag) 
                                  ? prev.filter(t => t !== tag) 
                                  : [...prev, tag]
                              );
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Outros filtros */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="show-offers"
                          checked={showOffers}
                          onCheckedChange={(checked) => setShowOffers(!!checked)}
                        />
                        <Label htmlFor="show-offers">Mostrar apenas ofertas</Label>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Avaliação mínima</Label>
                        <div className="flex items-center mt-2">
                          {[0, 1, 2, 3, 4, 5].map((rating) => (
                            <Button
                              key={rating}
                              variant={rating <= minRating ? "default" : "outline"}
                              size="sm"
                              className="mr-1 h-8 w-8 p-0"
                              onClick={() => setMinRating(rating)}
                            >
                              {rating}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <SheetFooter>
                    <Button variant="outline" onClick={resetFilters}>
                      Limpar Filtros
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          
          {/* Resultados da busca */}
          <div className="mb-8">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Nenhum produto encontrado com os filtros selecionados</p>
                <Button onClick={resetFilters}>
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map(renderProductCard)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSearch;
