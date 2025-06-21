import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Tag, Package, Search, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface Product {
  id: string;
  name: string;
  price: number;
  category?: {
    id: string;
    name: string;
  };
  isFractioned?: boolean;
  totalVolume?: number;
  unitVolume?: number;
}

interface ComboItem {
  id: string;
  productId: string;
  isChoosable?: boolean;
  allowFlavorSelection?: boolean;
  product: Product;
  quantity?: number;
}

interface Combo {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  active: boolean;
  items: ComboItem[];
}

interface Promotion {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  originalPrice: number;
  active: boolean;
  products: Product[];
}

interface DoseItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
}

interface Dose {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  active: boolean;
  items: DoseItem[];
}

const AdminPromotionsAndCombos = () => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [doses, setDoses] = useState<Dose[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productTypes, setProductTypes] = useState<Record<string, 'fixed' | 'choosable'>>({});
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [editingDose, setEditingDose] = useState<Dose | null>(null);
  const [isComboDialogOpen, setIsComboDialogOpen] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isDoseDialogOpen, setIsDoseDialogOpen] = useState(false);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [choosableCategories, setChoosableCategories] = useState<Record<string, string>>({});
  const [choosableQuantities, setChoosableQuantities] = useState<Record<string, number>>({});
  const [discountBy, setDiscountBy] = useState<Record<string, 'unit' | 'volume'>>({});
  const [comboCategoryId, setComboCategoryId] = useState<string>('');
  const [doseCategoryId, setDoseCategoryId] = useState<string>('');
  const [choosableNameFilters, setChoosableNameFilters] = useState<Record<string, string>>({});
  const [volumeToDiscount, setVolumeToDiscount] = useState<Record<string, number>>({});

  const fetchData = async () => {
    try {
      const [combosRes, promotionsRes, productsRes, dosesRes] = await Promise.all([
        api.get('/admin/combos'),
        api.get('/admin/promotions'),
        api.get('/admin/products'),
        api.get('/admin/doses')
      ]);
      setCombos(combosRes.data);
      setPromotions(promotionsRes.data);
      setProducts(productsRes.data);
      setDoses(dosesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Buscar categorias para combos escolhíveis
    api.get('/admin/categories').then(res => setCategories(res.data));
  }, []);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        setProductQuantities(q => { const copy = { ...q }; delete copy[productId]; return copy; });
        return prev.filter(id => id !== productId);
      }
      setProductQuantities(q => ({ ...q, [productId]: 1 }));
      return [...prev, productId];
    });
  };

  const resetForm = () => {
    setSelectedProducts([]);
    setProductTypes({});
    setEditingCombo(null);
    setEditingPromotion(null);
    setEditingDose(null);
  };

  const handleEditCombo = (combo: Combo) => {
    setEditingCombo(combo);
    setSelectedProducts(combo.items.map(item => item.productId));
    setProductTypes(
      combo.items.reduce((acc, item) => ({
        ...acc,
        [item.productId]: item.allowFlavorSelection ? 'choosable' : 'fixed'
      }), {})
    );
    setProductQuantities(
      combo.items.reduce((acc, item) => ({
        ...acc,
        [item.productId]: item.quantity || 1
      }), {})
    );
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setSelectedProducts(promotion.products.map(product => product.id));
  };

  const handleEditDose = (dose: Dose) => {
    setEditingDose(dose);
    setSelectedProducts(dose.items.map(item => item.productId));
    setProductQuantities(
      dose.items.reduce((acc, item) => ({
        ...acc,
        [item.productId]: item.quantity
      }), {})
    );
  };

  const handleUpdateCombo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCombo) return;
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto para o combo');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const imageFile = formData.get('image') as File;
      let imageUrl = editingCombo.image;

      if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const comboData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: Number(formData.get('price')),
        image: imageUrl,
        categoryId: comboCategoryId,
        items: selectedProducts.map(productId => ({
          productId,
          quantity: productQuantities[productId] || 1,
          allowFlavorSelection: productTypes[productId] === 'choosable',
          choosableCategoryId: choosableCategories[productId],
          choosableNameFilter: choosableNameFilters[productId],
          choosableQuantity: choosableQuantities[productId],
          volumeToDiscount: volumeToDiscount[productId],
          discountBy: discountBy[productId] || 'unit'
        }))
      };

      await api.put(`/admin/combos/${editingCombo.id}`, comboData);
      toast.success('Combo atualizado com sucesso!');
      setIsComboDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar combo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePromotion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPromotion) return;
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto para a promoção');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const imageFile = formData.get('image') as File;
      let imageUrl = editingPromotion.image;

      if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const promotionData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: Number(formData.get('price')),
        originalPrice: Number(formData.get('originalPrice')),
        image: imageUrl,
        productIds: selectedProducts
      };

      await api.put(`/admin/promotions/${editingPromotion.id}`, promotionData);
      toast.success('Promoção atualizada com sucesso!');
      setIsPromotionDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar promoção');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDose = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDose) return;
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto para a dose');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const imageFile = formData.get('image') as File;
      let imageUrl = editingDose.image;

      if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const doseData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: Number(formData.get('price')),
        image: imageUrl,
        categoryId: doseCategoryId,
        items: selectedProducts.map(productId => ({
          productId,
          quantity: productQuantities[productId] || 1
        }))
      };

      await api.put(`/admin/doses/${editingDose.id}`, doseData);
      toast.success('Dose atualizada com sucesso!');
      setIsDoseDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar dose');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCombo = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este combo?')) {
      try {
        await api.delete(`/admin/combos/${id}`);
        toast.success('Combo excluído com sucesso!');
        fetchData();
      } catch (error) {
        toast.error('Erro ao excluir combo');
      }
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta promoção?')) {
      try {
        await api.delete(`/admin/promotions/${id}`);
        toast.success('Promoção excluída com sucesso!');
        fetchData();
      } catch (error) {
        toast.error('Erro ao excluir promoção');
      }
    }
  };

  const handleDeleteDose = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta dose?')) {
      try {
        await api.delete(`/admin/doses/${id}`);
        toast.success('Dose excluída com sucesso!');
        fetchData();
      } catch (error) {
        toast.error('Erro ao excluir dose');
      }
    }
  };

  const handleProductTypeChange = (productId: string, type: 'fixed' | 'choosable') => {
    setProductTypes(prev => ({ ...prev, [productId]: type }));
    if (type === 'fixed') {
      setChoosableCategories(prev => { const copy = { ...prev }; delete copy[productId]; return copy; });
      setChoosableQuantities(prev => { const copy = { ...prev }; delete copy[productId]; return copy; });
      setChoosableNameFilters(prev => { const copy = { ...prev }; delete copy[productId]; return copy; });
      setVolumeToDiscount(prev => { const copy = { ...prev }; delete copy[productId]; return copy; });
    }
  };

  const handleCreateCombo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto para o combo');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const imageFile = formData.get('image') as File;
      let imageUrl = '';

      if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const comboData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: Number(formData.get('price')),
        image: imageUrl,
        categoryId: comboCategoryId,
        items: selectedProducts.map(productId => ({
          productId,
          quantity: productQuantities[productId] || 1,
          allowFlavorSelection: productTypes[productId] === 'choosable',
          choosableCategoryId: choosableCategories[productId],
          choosableNameFilter: choosableNameFilters[productId],
          choosableQuantity: choosableQuantities[productId],
          volumeToDiscount: volumeToDiscount[productId],
          discountBy: discountBy[productId] || 'unit'
        }))
      };

      await api.post('/admin/combos', comboData);
      toast.success('Combo criado com sucesso!');
      setIsComboDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar combo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePromotion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto para a promoção');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const imageFile = formData.get('image') as File;
      let imageUrl = '';

      if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const promotionData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: Number(formData.get('price')),
        originalPrice: Number(formData.get('originalPrice')),
        image: imageUrl,
        productIds: selectedProducts
      };

      await api.post('/admin/promotions', promotionData);
      toast.success('Promoção criada com sucesso!');
      setIsPromotionDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar promoção');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDose = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto para a dose');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const imageFile = formData.get('image') as File;
      let imageUrl = '';

      if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const doseData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: Number(formData.get('price')),
        image: imageUrl,
        categoryId: doseCategoryId,
        items: selectedProducts.map(productId => ({
          productId,
          quantity: productQuantities[productId] || 1
        }))
      };

      await api.post('/admin/doses', doseData);
      toast.success('Dose criada com sucesso!');
      setIsDoseDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar dose');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenComboDialog = (open: boolean) => {
    setIsComboDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleOpenDoseDialog = (open: boolean) => {
    setIsDoseDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-element-blue-dark mx-auto"></div>
            <p className="mt-4 text-element-gray-dark">Carregando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark">
          Promoções e Combos
        </h1>
        
        <div className="flex flex-col items-center p-4 sm:p-8">
          <div className="w-full max-w-6xl">
            <Tabs defaultValue="combos" className="w-full">
              <div className="flex justify-between items-center mb-8">
                <TabsList>
                  <TabsTrigger value="combos" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Combos
                  </TabsTrigger>
                  <TabsTrigger value="promocoes" className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Promoções
                  </TabsTrigger>
                  <TabsTrigger value="doses" className="flex items-center gap-2">
                    <Package className="w-4 h-4 rotate-45" />
                    Doses
                  </TabsTrigger>
                </TabsList>
                <Button className="flex items-center gap-2" onClick={() => { resetForm(); setIsComboDialogOpen(true); }}>
                  <Plus className="w-4 h-4" />
                  Adicionar Combo
                </Button>
              </div>
              
              <TabsContent value="combos">
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                  {(combos || []).map((combo) => (
                    <Card key={combo.id} className="min-h-[180px]">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{combo.name}</CardTitle>
                            <CardDescription>{combo.description}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditCombo(combo)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteCombo(combo.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="font-semibold text-lg">
                            {formatPrice(combo.price)}
                          </p>
                          <div className="space-y-1">
                            {combo.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-2 text-sm">
                                <span>{item.product.name}</span>
                                <span className="text-gray-500">
                                  ({item.allowFlavorSelection ? 'Escolhível' : 'Fixo'})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={combo.active}
                            onCheckedChange={async (checked) => {
                              try {
                                await api.patch(`/admin/combos/${combo.id}/active`, {
                                  active: checked,
                                });
                                fetchData();
                              } catch (error) {
                                toast.error('Erro ao atualizar status do combo');
                              }
                            }}
                          />
                          <span>{combo.active ? 'Ativo' : 'Inativo'}</span>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="promocoes">
                <div className="grid gap-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h2 className="text-2xl font-bold">Gerenciar Promoções</h2>
                    <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Adicionar Promoção
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl p-2 sm:p-6 max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Criar Nova Promoção</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreatePromotion} className="space-y-6">
                          <div className="grid gap-4">
                            <div>
                              <Label htmlFor="name">Nome da Promoção</Label>
                              <Input id="name" name="name" required className="w-full" />
                            </div>
                            <div>
                              <Label htmlFor="description">Descrição</Label>
                              <Textarea id="description" name="description" className="w-full" />
                            </div>
                            <div>
                              <Label htmlFor="price">Preço Promocional</Label>
                              <Input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                required
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label htmlFor="originalPrice">Preço Original</Label>
                              <Input
                                id="originalPrice"
                                name="originalPrice"
                                type="number"
                                step="0.01"
                                required
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label htmlFor="image">Imagem</Label>
                              {editingPromotion?.image && (
                                <img src={editingPromotion.image} alt="Imagem atual" className="h-24 mb-2 rounded object-contain border" />
                              )}
                              <Input
                                id="image"
                                name="image"
                                type="file"
                                accept="image/*"
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label>Produtos em Promoção</Label>
                              <div className="flex items-center gap-2 mb-4">
                                <Search className="w-4 h-4 text-gray-500" />
                                <Input
                                  placeholder="Buscar produtos..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="flex-1 w-full"
                                />
                              </div>
                              <ScrollArea className="h-[350px] border rounded-md p-4">
                                <div className="space-y-4">
                                  {filteredProducts.map((product) => (
                                    <div
                                      key={product.id}
                                      className="flex items-center justify-between p-2 hover:bg-gray-100 rounded"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          checked={selectedProducts.includes(product.id)}
                                          onCheckedChange={() => handleProductSelect(product.id)}
                                        />
                                        <span>{product.name} - {formatPrice(product.price)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="submit"
                              disabled={isSubmitting || selectedProducts.length === 0}
                            >
                              {isSubmitting ? 'Salvando...' : 'Criar Promoção'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {(promotions || []).map((promotion) => (
                      <Card key={promotion.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{promotion.name}</CardTitle>
                              <CardDescription>{promotion.description}</CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditPromotion(promotion)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeletePromotion(promotion.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="font-semibold text-lg text-green-600">
                              {formatPrice(promotion.price)}
                            </p>
                            <p className="text-sm text-gray-500 line-through">
                              {formatPrice(promotion.originalPrice)}
                            </p>
                            <div className="space-y-1">
                              {promotion.products.map((product) => (
                                <div key={product.id} className="text-sm">
                                  {product.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={promotion.active}
                              onCheckedChange={async (checked) => {
                                try {
                                  await api.patch(`/admin/promotions/${promotion.id}/active`, {
                                    active: checked,
                                  });
                                  fetchData();
                                } catch (error) {
                                  toast.error('Erro ao atualizar status da promoção');
                                }
                              }}
                            />
                            <span>{promotion.active ? 'Ativa' : 'Inativa'}</span>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="doses">
                <div className="flex justify-end mb-4">
                  <Button className="flex items-center gap-2" onClick={() => { resetForm(); setIsDoseDialogOpen(true); }}>
                    <Plus className="w-4 h-4" />
                    Adicionar Dose
                  </Button>
                </div>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                  {(doses || []).map((dose) => (
                    <Card key={dose.id} className="min-h-[180px]">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{dose.name}</CardTitle>
                            <CardDescription>{dose.description}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => { setEditingDose(dose); setIsDoseDialogOpen(true); }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteDose(dose.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="font-semibold text-lg">
                            {formatPrice(dose.price)}
                          </p>
                          <div className="space-y-1">
                            {dose.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-2 text-sm">
                                <span>{item.product.name}</span>
                                <span className="text-gray-500">
                                  ({item.quantity}ml)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={dose.active}
                            onCheckedChange={async (checked) => {
                              try {
                                await api.patch(`/admin/doses/${dose.id}/active`, {
                                  active: checked,
                                });
                                fetchData();
                              } catch (error) {
                                toast.error('Erro ao atualizar status da dose');
                              }
                            }}
                          />
                          <span>{dose.active ? 'Ativo' : 'Inativo'}</span>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Modal de criação/edição de combo */}
        <Dialog open={isComboDialogOpen} onOpenChange={handleOpenComboDialog}>
          <DialogContent className="w-full max-w-2xl p-2 sm:p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCombo ? 'Editar Combo' : 'Criar Novo Combo'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={editingCombo ? handleUpdateCombo : handleCreateCombo} className="space-y-6">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Nome do Combo</Label>
                  <Input id="name" name="name" defaultValue={editingCombo?.name || ''} required className="w-full" />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" defaultValue={editingCombo?.description || ''} className="w-full" />
                </div>
                <div>
                  <Label htmlFor="price">Preço</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingCombo?.price || ''}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="image">Imagem</Label>
                  {editingCombo?.image && (
                    <img src={editingCombo.image} alt="Imagem atual" className="h-24 mb-2 rounded object-contain border" />
                  )}
                  <Input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="combo-category">Categoria</Label>
                  <Select
                    value={comboCategoryId}
                    onValueChange={setComboCategoryId}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Produtos do Combo</Label>
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 w-full"
                  />
                </div>
                <ScrollArea className="h-[350px] border rounded-md p-4">
                  <div className="space-y-4">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-100 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => handleProductSelect(product.id)}
                          />
                          <span>{product.name} - {formatPrice(product.price)}</span>
                        </div>
                        {selectedProducts.includes(product.id) && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Select
                              value={productTypes[product.id] || 'fixed'}
                              onValueChange={(value) => handleProductTypeChange(product.id, value as 'fixed' | 'choosable')}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">Fixo</SelectItem>
                                <SelectItem value="choosable">Escolhível</SelectItem>
                              </SelectContent>
                            </Select>
                            {productTypes[product.id] === 'choosable' && (
                              <>
                                <Select
                                  value={choosableCategories[product.id] || ''}
                                  onValueChange={value => setChoosableCategories(prev => ({ ...prev, [product.id]: value }))}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Categoria" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map(category => (
                                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="text"
                                  value={choosableNameFilters?.[product.id] || ''}
                                  onChange={e => setChoosableNameFilters(prev => ({ ...prev, [product.id]: e.target.value }))}
                                  className="w-32"
                                  placeholder="Filtro nome (opcional)"
                                />
                                {product.isFractioned ? (
                                  <Input
                                    type="number"
                                    min={1}
                                    value={volumeToDiscount?.[product.id] || ''}
                                    onChange={e => setVolumeToDiscount(prev => ({ ...prev, [product.id]: Number(e.target.value) }))}
                                    className="w-32"
                                    placeholder="Volume a descontar (ml)"
                                  />
                                ) : (
                                  <Input
                                    type="number"
                                    min={1}
                                    value={choosableQuantities[product.id] || 1}
                                    onChange={e => setChoosableQuantities(q => ({ ...q, [product.id]: Number(e.target.value) }))}
                                    className="w-16"
                                    placeholder="Qtd"
                                  />
                                )}
                              </>
                            )}
                            <Select
                              value={discountBy[product.id] || (product.isFractioned ? 'volume' : 'unit')}
                              onValueChange={value => setDiscountBy(prev => ({ ...prev, [product.id]: value as 'unit' | 'volume' }))}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unit">Descontar por unidade</SelectItem>
                                <SelectItem value="volume">Descontar por volume (ml)</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Volume (ml ou un)"
                              value={productQuantities[product.id] || ''}
                              onChange={e => setProductQuantities(q => ({ ...q, [product.id]: Number(e.target.value) }))}
                              className="w-24"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting || selectedProducts.length === 0}
                >
                  {isSubmitting ? 'Salvando...' : (editingCombo ? 'Salvar Alterações' : 'Criar Combo')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de criação/edição de dose */}
        <Dialog open={isDoseDialogOpen} onOpenChange={handleOpenDoseDialog}>
          <DialogContent className="w-full max-w-2xl p-2 sm:p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDose ? 'Editar Dose' : 'Criar Nova Dose'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={editingDose ? handleUpdateDose : handleCreateDose} className="space-y-4">
              <Input name="name" placeholder="Nome da Dose" defaultValue={editingDose?.name || ''} required className="w-full" />
              <Textarea name="description" placeholder="Descrição" defaultValue={editingDose?.description || ''} className="w-full" />
              <Input name="price" placeholder="Preço (R$)" type="number" step="0.01" defaultValue={editingDose?.price || ''} required className="w-full" />
              
              <div>
                <Label htmlFor="image">Imagem</Label>
                {editingDose?.image && (
                  <img src={editingDose.image} alt="Imagem atual" className="h-24 mb-2 rounded object-contain border" />
                )}
                <Input
                  name="image"
                  type="file"
                  accept="image/*"
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="dose-category">Categoria</Label>
                <Select
                  value={doseCategoryId || ''}
                  onValueChange={setDoseCategoryId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Produtos e volumes da dose</Label>
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 w-full"
                  />
                </div>
                <ScrollArea className="h-40 border rounded p-2 mt-2">
                  {(products || []).filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                    <div key={product.id} className="flex flex-col gap-1 mb-2 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => handleProductSelect(product.id)}
                        />
                        <span>{product.name}</span>
                      </div>
                      {selectedProducts.includes(product.id) && (
                        <Input
                          type="number"
                          min={1}
                          placeholder="Volume (ml)"
                          value={productQuantities[product.id] || ''}
                          onChange={e => setProductQuantities(q => ({ ...q, [product.id]: Number(e.target.value) }))}
                          className="w-24"
                        />
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </div>
              
              <DialogFooter>
                <Button type="submit">{editingDose ? 'Salvar Alterações' : 'Criar Dose'}</Button>
                <Button type="button" variant="outline" onClick={() => { setIsDoseDialogOpen(false); resetForm(); }}>Cancelar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPromotionsAndCombos; 