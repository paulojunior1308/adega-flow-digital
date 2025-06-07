import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Tag, Package, Search, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';
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

export default function AdminPromotionsAndCombos() {
  const [combos, setCombos] = React.useState<Combo[]>([]);
  const [promotions, setPromotions] = React.useState<Promotion[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedProducts, setSelectedProducts] = React.useState<string[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [productTypes, setProductTypes] = React.useState<Record<string, 'fixed' | 'choosable'>>({});
  const [editingCombo, setEditingCombo] = React.useState<Combo | null>(null);
  const [editingPromotion, setEditingPromotion] = React.useState<Promotion | null>(null);
  const [isComboDialogOpen, setIsComboDialogOpen] = React.useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = React.useState(false);
  const [productQuantities, setProductQuantities] = React.useState<Record<string, number>>({});
  const [categories, setCategories] = React.useState<{id: string, name: string}[]>([]);
  const [choosableCategories, setChoosableCategories] = React.useState<Record<string, string>>({});
  const [choosableQuantities, setChoosableQuantities] = React.useState<Record<string, number>>({});
  const [comboType, setComboType] = React.useState<'combo' | 'dose'>('combo');
  const [productUnits, setProductUnits] = React.useState<{ [productId: string]: string }>({});
  const [productAmounts, setProductAmounts] = React.useState<{ [productId: string]: number }>({});

  const fetchData = React.useCallback(async () => {
    try {
      const [combosRes, promotionsRes, productsRes] = await Promise.all([
        api.get('/admin/combos'),
        api.get('/admin/promotions'),
        api.get('/admin/products')
      ]);
      setCombos(combosRes.data);
      setPromotions(promotionsRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
    // Buscar categorias para combos escolhíveis
    api.get('/admin/categories').then(res => setCategories(res.data));
  }, [fetchData]);

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

  const handleUpdateCombo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCombo) return;
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto para o combo');
      return;
    }
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    let imageUrl = editingCombo.image || '';
    const imageFile = formData.get('image') as File;
    console.log('Arquivo de imagem (edição):', imageFile);
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadToCloudinary(imageFile);
      console.log('URL da imagem (Cloudinary, edição):', imageUrl);
    }
    const comboData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: formData.get('price'),
      image: imageUrl,
      items: JSON.stringify(
        selectedProducts.map(productId => {
          if (productTypes[productId] === 'choosable') {
            return {
              productId,
              allowFlavorSelection: true,
              categoryId: choosableCategories[productId],
              quantity: choosableQuantities[productId] || 1
            };
          }
          return {
            productId,
            allowFlavorSelection: false,
            quantity: productQuantities[productId] || 1
          };
        })
      ),
      active: String(editingCombo.active)
    };
    console.log('Payload enviado (edição):', comboData);
    try {
      await api.put(`/admin/combos/${editingCombo.id}`, comboData);
      toast.success('Combo atualizado com sucesso');
      fetchData();
      resetForm();
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
    const form = e.currentTarget;
    const formData = new FormData(form);
    let imageUrl = editingPromotion.image || '';
    const imageFile = formData.get('image') as File;
    console.log('Arquivo de imagem (edição):', imageFile);
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadToCloudinary(imageFile);
      console.log('URL da imagem (Cloudinary, edição):', imageUrl);
    }
    const promoData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: formData.get('price'),
      originalPrice: formData.get('originalPrice'),
      image: imageUrl,
      productIds: JSON.stringify(selectedProducts),
      active: String(editingPromotion.active)
    };
    console.log('Payload enviado (edição):', promoData);
    try {
      await api.put(`/admin/promotions/${editingPromotion.id}`, promoData);
      toast.success('Promoção atualizada com sucesso');
      fetchData();
      resetForm();
    } catch (error) {
      toast.error('Erro ao atualizar promoção');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCombo = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este combo?')) return;

    try {
      await api.delete(`/admin/combos/${id}`);
      toast.success('Combo excluído com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir combo');
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta promoção?')) return;

    try {
      await api.delete(`/admin/promotions/${id}`);
      toast.success('Promoção excluída com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir promoção');
    }
  };

  const handleProductTypeChange = (productId: string, type: 'fixed' | 'choosable') => {
    setProductTypes(prev => ({
      ...prev,
      [productId]: type
    }));
  };

  const handleCreateCombo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto para o combo');
      return;
    }
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    let imageUrl = '';
    const imageFile = formData.get('image') as File;
    console.log('Arquivo de imagem (cadastro):', imageFile);
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadToCloudinary(imageFile);
      console.log('URL da imagem (Cloudinary, cadastro):', imageUrl);
    }
    const comboData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: formData.get('price'),
      image: imageUrl,
      type: comboType,
      items: JSON.stringify(
        selectedProducts.map(productId => {
          if (comboType === 'dose') {
            return {
              productId,
              unit: productUnits[productId] || 'ml',
              amount: productAmounts[productId] || 1,
              allowFlavorSelection: productTypes[productId] === 'choosable',
              categoryId: choosableCategories[productId],
              quantity: choosableQuantities[productId] || productQuantities[productId] || 1
            };
          }
          if (productTypes[productId] === 'choosable') {
            return {
              productId,
              allowFlavorSelection: true,
              categoryId: choosableCategories[productId],
              quantity: choosableQuantities[productId] || 1
            };
          }
          return {
            productId,
            allowFlavorSelection: false,
            quantity: productQuantities[productId] || 1
          };
        })
      )
    };
    console.log('Payload enviado (cadastro):', comboData);
    try {
      await api.post('/admin/combos', comboData);
      toast.success('Combo criado com sucesso');
      fetchData();
      resetForm();
      setIsComboDialogOpen(false);
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
    const form = e.currentTarget;
    const formData = new FormData(form);
    let imageUrl = '';
    const imageFile = formData.get('image') as File;
    console.log('Arquivo de imagem (cadastro):', imageFile);
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadToCloudinary(imageFile);
      console.log('URL da imagem (Cloudinary, cadastro):', imageUrl);
    }
    const promoData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: formData.get('price'),
      originalPrice: formData.get('originalPrice'),
      image: imageUrl,
      productIds: JSON.stringify(selectedProducts)
    };
    console.log('Payload enviado (cadastro):', promoData);
    try {
      await api.post('/admin/promotions', promoData);
      toast.success('Promoção criada com sucesso');
      fetchData();
      resetForm();
      setIsPromotionDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao criar promoção');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col items-center p-4 sm:p-8">
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
              </TabsList>
              <Button className="flex items-center gap-2" onClick={() => setIsComboDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                Adicionar Combo
              </Button>
            </div>
            <TabsContent value="combos">
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {combos.map((combo) => (
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
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Criar Nova Promoção</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreatePromotion} className="space-y-6">
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="name">Nome da Promoção</Label>
                            <Input id="name" name="name" required />
                          </div>
                          <div>
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea id="description" name="description" />
                          </div>
                          <div>
                            <Label htmlFor="price">Preço Promocional</Label>
                            <Input
                              id="price"
                              name="price"
                              type="number"
                              step="0.01"
                              required
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
                            <Label>Produtos em Promoção</Label>
                            <div className="flex items-center gap-2 mb-4">
                              <Search className="w-4 h-4 text-gray-500" />
                              <Input
                                placeholder="Buscar produtos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1"
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
                                          onValueChange={(value) => setProductTypes(prev => ({
                                            ...prev,
                                            [product.id]: value as 'fixed' | 'choosable'
                                          }))}
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
                                              type="number"
                                              min={1}
                                              value={choosableQuantities[product.id] || 1}
                                              onChange={e => setChoosableQuantities(q => ({ ...q, [product.id]: Number(e.target.value) }))}
                                              className="w-16"
                                              placeholder="Qtd"
                                            />
                                          </>
                                        )}
                                        {productTypes[product.id] !== 'choosable' && (
                                          <Input
                                            type="number"
                                            min={1}
                                            value={productQuantities[product.id] || 1}
                                            onChange={e => setProductQuantities(q => ({ ...q, [product.id]: Number(e.target.value) }))}
                                            className="w-16"
                                            placeholder="Qtd"
                                          />
                                        )}
                                      </div>
                                    )}
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
                            {isSubmitting ? 'Criando...' : 'Criar Promoção'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {promotions.map((promotion) => (
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
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold">
                              {formatPrice(promotion.price)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(promotion.originalPrice)}
                            </span>
                          </div>
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
          </Tabs>
        </div>
      </div>
      {/* Modal de edição de combo */}
      <Dialog open={!!editingCombo} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl w-full p-2 sm:p-6">
          <DialogHeader>
            <DialogTitle>Editar Combo</DialogTitle>
          </DialogHeader>
          {editingCombo && (
            <form
              onSubmit={handleUpdateCombo}
              className="space-y-6"
              encType="multipart/form-data"
            >
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Nome do Combo</Label>
                  <Input id="name" name="name" defaultValue={editingCombo.name} required />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" defaultValue={editingCombo.description} />
                </div>
                <div>
                  <Label htmlFor="price">Preço</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingCombo.price}
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
                  <Label>Produtos do Combo</Label>
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
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
                                onValueChange={(value) => setProductTypes(prev => ({
                                  ...prev,
                                  [product.id]: value as 'fixed' | 'choosable'
                                }))}
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
                                    type="number"
                                    min={1}
                                    value={choosableQuantities[product.id] || 1}
                                    onChange={e => setChoosableQuantities(q => ({ ...q, [product.id]: Number(e.target.value) }))}
                                    className="w-16"
                                    placeholder="Qtd"
                                  />
                                </>
                              )}
                              {productTypes[product.id] !== 'choosable' && (
                                <Input
                                  type="number"
                                  min={1}
                                  value={productQuantities[product.id] || 1}
                                  onChange={e => setProductQuantities(q => ({ ...q, [product.id]: Number(e.target.value) }))}
                                  className="w-16"
                                  placeholder="Qtd"
                                />
                              )}
                            </div>
                          )}
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
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Modal de criação de combo */}
      <Dialog open={isComboDialogOpen} onOpenChange={setIsComboDialogOpen}>
        <DialogContent className="max-w-3xl w-full p-2 sm:p-6">
          <DialogHeader>
            <DialogTitle>Criar Novo Combo</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleCreateCombo}
            className="space-y-6"
            encType="multipart/form-data"
          >
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Nome do Combo</Label>
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
                <Label htmlFor="comboType">Tipo do Combo</Label>
                <Select value={comboType} onValueChange={(value) => setComboType(value as 'combo' | 'dose')}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="combo">Combo</SelectItem>
                    <SelectItem value="dose">Dose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Produtos do Combo</Label>
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
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
                              onValueChange={(value) => setProductTypes(prev => ({
                                ...prev,
                                [product.id]: value as 'fixed' | 'choosable'
                              }))}
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
                                  type="number"
                                  min={1}
                                  value={choosableQuantities[product.id] || 1}
                                  onChange={e => setChoosableQuantities(q => ({ ...q, [product.id]: Number(e.target.value) }))}
                                  className="w-16"
                                  placeholder="Qtd"
                                />
                              </>
                            )}
                            {productTypes[product.id] !== 'choosable' && (
                              <Input
                                type="number"
                                min={1}
                                value={productQuantities[product.id] || 1}
                                onChange={e => setProductQuantities(q => ({ ...q, [product.id]: Number(e.target.value) }))}
                                className="w-16"
                                placeholder="Qtd"
                              />
                            )}
                            {/* Campos de unidade e quantidade consumida para combos do tipo dose */}
                            {comboType === 'dose' && (
                              <>
                                <Select
                                  value={productUnits[product.id] || 'ml'}
                                  onValueChange={value => setProductUnits(units => ({ ...units, [product.id]: value }))}
                                >
                                  <SelectTrigger className="w-[80px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ml">ml</SelectItem>
                                    <SelectItem value="unidade">Unidade</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  min={productUnits[product.id] === 'ml' ? 0.01 : 1}
                                  step={productUnits[product.id] === 'ml' ? 0.01 : 1}
                                  value={productAmounts[product.id] || ''}
                                  onChange={e => setProductAmounts(amts => ({ ...amts, [product.id]: Number(e.target.value) }))}
                                  className="w-20"
                                  placeholder="Qtd consumida"
                                />
                              </>
                            )}
                          </div>
                        )}
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
                {isSubmitting ? 'Criando...' : 'Criar Combo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modal de edição de promoção */}
      <Dialog open={!!editingPromotion} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl w-full p-2 sm:p-6">
          <DialogHeader>
            <DialogTitle>Editar Promoção</DialogTitle>
          </DialogHeader>
          {editingPromotion && (
            <form
              onSubmit={handleUpdatePromotion}
              className="space-y-6"
              encType="multipart/form-data"
            >
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Nome da Promoção</Label>
                  <Input id="name" name="name" defaultValue={editingPromotion.name} required />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" defaultValue={editingPromotion.description} />
                </div>
                <div>
                  <Label htmlFor="price">Preço Promocional</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingPromotion.price}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="originalPrice">Preço Original</Label>
                  <Input
                    id="originalPrice"
                    name="originalPrice"
                    type="number"
                    step="0.01"
                    defaultValue={editingPromotion.originalPrice}
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
                  <Label>Produtos da Promoção</Label>
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
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
                            <span>{product.name}</span>
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
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 