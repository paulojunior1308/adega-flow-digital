import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ScrollArea,
} from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductSelect } from '@/components/admin/ProductSelect';
import api from '@/lib/axios';
import { uploadToCloudinary } from '@/lib/upload';

interface Dose {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  active: boolean;
  items: DoseItem[];
}

interface DoseItem {
  id: string;
  productId: string;
  quantity: number;
  isChoosable: boolean;
  maxChoices: number;
  categoryId: string | null;
  product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
  };
}

export default function AdminDoses() {
  const [doses, setDoses] = useState<Dose[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<{productId: string, quantity: number, isChoosable: boolean, maxChoices: number, categoryId: string | null}[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoses();
  }, []);

  const fetchDoses = async () => {
    try {
      const response = await api.get('/admin/doses');
      setDoses(response.data);
    } catch (error) {
      console.error('Erro ao buscar doses:', error);
      toast({
        title: "Erro ao carregar doses",
        description: "Não foi possível carregar a lista de doses.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDose = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    let imageUrl = '';
    const imageFile = formData.get('image') as File;
    
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadToCloudinary(imageFile);
    }

    const doseData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: formData.get('price'),
      image: imageUrl,
      items: selectedProducts
    };

    try {
      await api.post('/admin/doses', doseData);
      toast({
        title: "Dose criada com sucesso!",
        description: `${doseData.name} foi adicionada ao menu.`,
      });
      fetchDoses();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro ao criar dose",
        description: error?.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedProducts([]);
  };

  const handleProductSelect = (productId: string, quantity: number, isChoosable: boolean, maxChoices: number, categoryId: string | null) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.productId === productId);
      if (exists) {
        return prev.filter(p => p.productId !== productId);
      }
      return [...prev, { productId, quantity, isChoosable, maxChoices, categoryId }];
    });
  };

  const filteredDoses = doses.filter(dose =>
    dose.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-element-gray-light flex">
      <AdminSidebar />
      
      <div className="flex-1 p-8 ml-0 lg:ml-64">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-element-blue-dark">Doses</h1>
            <p className="text-element-gray-dark">
              Gerencie as doses disponíveis no menu.
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-element-blue-dark hover:bg-element-blue-dark/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Dose
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Buscar doses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          <div className="divide-y">
            {filteredDoses.map((dose) => (
              <div key={dose.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {dose.image ? (
                    <img
                      src={dose.image}
                      alt={dose.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-gray-400">Sem imagem</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{dose.name}</h3>
                    <p className="text-sm text-gray-500">{dose.description}</p>
                    <p className="text-sm font-medium text-element-blue-dark">
                      R$ {dose.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin-doses/${dose.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Nova Dose</DialogTitle>
            <DialogDescription>
              Adicione uma nova dose ao menu.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDose} className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Nome da Dose</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" name="description" />
              </div>
              <div>
                <Label htmlFor="price">Preço</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <Label htmlFor="image">Imagem</Label>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                />
              </div>
              <div>
                <Label>Produtos da Dose</Label>
                <div className="mt-4 space-y-4">
                  {selectedProducts.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded">
                      <div className="flex-1">
                        <ProductSelect
                          name={`product-${index}`}
                          defaultValue={[item.productId]}
                          required
                        />
                      </div>
                      <div className="w-32">
                        <Label>Quantidade (ml)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => {
                            const newProducts = [...selectedProducts];
                            newProducts[index].quantity = parseFloat(e.target.value);
                            setSelectedProducts(newProducts);
                          }}
                          required
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`choosable-${index}`}
                          checked={item.isChoosable}
                          onCheckedChange={(checked) => {
                            const newProducts = [...selectedProducts];
                            newProducts[index].isChoosable = checked as boolean;
                            setSelectedProducts(newProducts);
                          }}
                        />
                        <Label htmlFor={`choosable-${index}`}>Escolhível</Label>
                      </div>
                      {item.isChoosable && (
                        <div className="w-32">
                          <Label>Máx. Escolhas</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.maxChoices}
                            onChange={(e) => {
                              const newProducts = [...selectedProducts];
                              newProducts[index].maxChoices = parseInt(e.target.value);
                              setSelectedProducts(newProducts);
                            }}
                            required
                          />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProducts(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedProducts(prev => [...prev, {
                        productId: '',
                        quantity: 0,
                        isChoosable: false,
                        maxChoices: 1,
                        categoryId: null
                      }]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting || selectedProducts.length === 0}
              >
                {isSubmitting ? 'Criando...' : 'Criar Dose'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 