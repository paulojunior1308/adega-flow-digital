import React from 'react';
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

export default function AdminPromotionsAndCombos() {
  const [combos, setCombos] = React.useState<Combo[]>([]);
  const [promotions, setPromotions] = React.useState<Promotion[]>([]);
  const [doses, setDoses] = React.useState<Dose[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedProducts, setSelectedProducts] = React.useState<string[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [productTypes, setProductTypes] = React.useState<Record<string, 'fixed' | 'choosable'>>({});
  const [editingCombo, setEditingCombo] = React.useState<Combo | null>(null);
  const [editingPromotion, setEditingPromotion] = React.useState<Promotion | null>(null);
  const [editingDose, setEditingDose] = React.useState<Dose | null>(null);
  const [isComboDialogOpen, setIsComboDialogOpen] = React.useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = React.useState(false);
  const [isDoseDialogOpen, setIsDoseDialogOpen] = React.useState(false);
  const [productQuantities, setProductQuantities] = React.useState<Record<string, number>>({});
  const [categories, setCategories] = React.useState<{id: string, name: string}[]>([]);
  const [choosableCategories, setChoosableCategories] = React.useState<Record<string, string>>({});
  const [choosableQuantities, setChoosableQuantities] = React.useState<Record<string, number>>({});
  const [discountBy, setDiscountBy] = React.useState<Record<string, 'unit' | 'volume'>>({});
  const [comboCategoryId, setComboCategoryId] = React.useState<string>('');
  const [doseCategoryId, setDoseCategoryId] = React.useState<string>('');
  const [choosableNameFilters, setChoosableNameFilters] = React.useState<Record<string, string>>({});
  const [volumeToDiscount, setVolumeToDiscount] = React.useState<Record<string, number>>({});

  const fetchData = React.useCallback(async () => {
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
  }, []);

  React.useEffect(() => {
    fetchData();
    // Buscar categorias para combos escolhíveis
    api.get('/admin/categories?active=true').then(res => setCategories(res.data));
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
              quantity: choosableQuantities[productId] || 1,
              nameFilter: choosableNameFilters[productId] || null
            };
          }
          return {
            productId,
            allowFlavorSelection: false,
            quantity: productQuantities[productId] || 1
          };
        })
      ),
      active: String(editingCombo.active),
      categoryId: comboCategoryId,
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

  const handleUpdateDose = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDose) return;
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto para a dose');
      return;
    }
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    // Montar os items da dose
    const doseItems = selectedProducts.map(productId => {
      const product = products.find(p => p.id === productId);
      if (productTypes[productId] === 'choosable') {
        return {
          productId,
          allowFlavorSelection: true,
          categoryId: choosableCategories[productId],
          quantity: product?.isFractioned ? volumeToDiscount[productId] : (choosableQuantities[productId] || 1),
          discountBy: product?.isFractioned ? 'volume' : 'unit',
          nameFilter: choosableNameFilters[productId] || null,
          volumeToDiscount: product?.isFractioned ? volumeToDiscount[productId] : null
        };
      }
      return {
        productId,
        allowFlavorSelection: false,
        quantity: productQuantities[productId] || 1,
        discountBy: product?.isFractioned ? 'volume' : 'unit'
      };
    });
    formData.set('items', JSON.stringify(doseItems));
    formData.set('active', String(editingDose.active));
    formData.set('categoryId', doseCategoryId || '');
    try {
      await api.put(`/admin/doses/${editingDose.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Dose atualizada com sucesso');
      fetchData();
      resetForm();
    } catch (error) {
      toast.error('Erro ao atualizar dose');
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

  const handleDeleteDose = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta dose?')) return;

    try {
      await api.delete(`/admin/doses/${id}`);
      toast.success('Dose excluída com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir dose');
    }
  };

  const handleProductTypeChange = (productId: string, type: 'fixed' | 'choosable') => {
    setProductTypes(prev => ({ ...prev, [productId]: type }));
    if (type === 'choosable') {
      setChoosableCategories(prev => ({ ...prev, [productId]: '' }));
      setChoosableNameFilters(prev => ({ ...prev, [productId]: '' }));
      setChoosableQuantities(prev => ({ ...prev, [productId]: 1 }));
    } else {
      setChoosableCategories(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
      setChoosableNameFilters(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
      setChoosableQuantities(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }
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
      items: JSON.stringify(
        selectedProducts.map(productId => {
          if (productTypes[productId] === 'choosable') {
            return {
              productId,
              allowFlavorSelection: true,
              categoryId: choosableCategories[productId],
              quantity: choosableQuantities[productId] || 1,
              nameFilter: choosableNameFilters[productId] || null
            };
          }
          return {
            productId,
            allowFlavorSelection: false,
            quantity: productQuantities[productId] || 1
          };
        })
      ),
      categoryId: comboCategoryId,
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

  const handleCreateDose = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto para a dose');
      return;
    }
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    // Montar os items da dose
    const doseItems = selectedProducts.map(productId => {
      const product = products.find(p => p.id === productId);
      if (productTypes[productId] === 'choosable') {
        return {
          productId,
          allowFlavorSelection: true,
          categoryId: choosableCategories[productId],
          quantity: product?.isFractioned ? volumeToDiscount[productId] : (choosableQuantities[productId] || 1),
          discountBy: product?.isFractioned ? 'volume' : 'unit',
          nameFilter: choosableNameFilters[productId] || null,
          volumeToDiscount: product?.isFractioned ? volumeToDiscount[productId] : null
        };
      }
      return {
        productId,
        allowFlavorSelection: false,
        quantity: productQuantities[productId] || 1,
        discountBy: product?.isFractioned ? 'volume' : 'unit'
      };
    });
    formData.set('items', JSON.stringify(doseItems));
    formData.set('active', String(editingDose?.active || true));
    formData.set('categoryId', doseCategoryId || '');
    try {
      await api.post('/admin/doses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Dose cadastrada com sucesso');
      fetchData();
      resetForm();
      setIsDoseDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao cadastrar dose');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenComboDialog = (open: boolean) => {
    setIsComboDialogOpen(open);
    if (open) {
      resetForm();
      setComboCategoryId('');
      setSelectedProducts([]);
      setProductTypes({});
      setChoosableCategories({});
      setChoosableQuantities({});
      setChoosableNameFilters({});
      setProductQuantities({});
    }
    if (!open) {
      resetForm();
      setComboCategoryId('');
      setSelectedProducts([]);
      setProductTypes({});
      setChoosableCategories({});
      setChoosableQuantities({});
      setChoosableNameFilters({});
      setProductQuantities({});
    }
  };

  const handleOpenDoseDialog = (open: boolean) => {
    setIsDoseDialogOpen(open);
    if (open) {
      resetForm();
      setDoseCategoryId('');
      setSelectedProducts([]);
      setProductTypes({});
      setChoosableCategories({});
      setChoosableQuantities({});
      setChoosableNameFilters({});
      setProductQuantities({});
    }
    if (!open) {
      resetForm();
      setDoseCategoryId('');
      setSelectedProducts([]);
      setProductTypes({});
      setChoosableCategories({});
      setChoosableQuantities({});
      setChoosableNameFilters({});
      setProductQuantities({});
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
    <div className="flex min-h-screen w-full bg-gray-100 dark:bg-gray-900">
      <AdminLayout>
      <div className="flex flex-col flex-1 sm:py-4 sm:pl-14 lg:pl-64">
        <main className="flex-1 p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Combos, Promoções e Doses</h1>
            <p className="text-gray-600 dark:text-gray-400">Gerencie combos, promoções e doses do catálogo.</p>
          </div>
          <Tabs defaultValue="combos" className="w-full">
            <TabsList className="w-full overflow-x-auto flex-nowrap whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <TabsTrigger value="combos">Combos</TabsTrigger>
              <TabsTrigger value="promotions">Promoções</TabsTrigger>
              <TabsTrigger value="doses">Doses</TabsTrigger>
            </TabsList>
            <TabsContent value="combos">
              <div className="flex flex-col sm:flex-row sm:justify-end mb-4 gap-2">
                <Button className="flex items-center gap-2 w-full sm:w-auto" onClick={() => { resetForm(); setIsComboDialogOpen(true); }}>
                  <Plus className="w-4 h-4" />
                  Adicionar Combo
                </Button>
              </div>
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {(combos || []).map((combo) => (
                  <Card key={combo.id} className="min-h-[200px] shadow-lg border-2 border-gray-200 dark:border-gray-800 hover:border-primary transition-all group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-primary group-hover:text-primary-700 transition-colors">{combo.name}</CardTitle>
                          <CardDescription className="text-gray-500 dark:text-gray-400 mt-1">{combo.description}</CardDescription>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-primary/10"
                              onClick={() => handleEditCombo(combo)}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-red-100 dark:hover:bg-red-900"
                              onClick={() => handleDeleteCombo(combo.id)}
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          {combo.image && (
                            <img src={combo.image} alt={combo.name} className="w-16 h-16 object-cover rounded shadow-md border border-gray-300 bg-white" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <span className="text-2xl font-extrabold text-green-600 dark:text-green-400">{formatPrice(combo.price)}</span>
                        <div className="space-y-1">
                          {combo.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-200">{item.product.name}</span>
                              <span className="text-gray-400">({item.quantity})</span>
                              {item.allowFlavorSelection && <Tag className="w-3 h-3 text-blue-400" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={combo.active}
                        onCheckedChange={async (checked) => {
                          try {
                            await api.patch(`/admin/combos/${combo.id}/active`, { active: checked });
                            fetchData();
                          } catch (error) {
                            toast.error('Erro ao atualizar status do combo');
                          }
                        }}
                      />
                      <span className={`font-semibold ${combo.active ? 'text-green-600' : 'text-gray-400'}`}>{combo.active ? 'Ativo' : 'Inativo'}</span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="promotions">
              <div className="flex flex-col sm:flex-row sm:justify-end mb-4 gap-2">
                <Button className="flex items-center gap-2 w-full sm:w-auto" onClick={() => { resetForm(); setIsPromotionDialogOpen(true); }}>
                  <Plus className="w-4 h-4" />
                  Adicionar Promoção
                </Button>
              </div>
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {(promotions || []).map((promotion) => (
                  <Card key={promotion.id} className="min-h-[200px] shadow-lg border-2 border-gray-200 dark:border-gray-800 hover:border-primary transition-all group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-primary group-hover:text-primary-700 transition-colors">{promotion.name}</CardTitle>
                          <CardDescription className="text-gray-500 dark:text-gray-400 mt-1">{promotion.description}</CardDescription>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-primary/10"
                              onClick={() => handleEditPromotion(promotion)}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-red-100 dark:hover:bg-red-900"
                              onClick={() => handleDeletePromotion(promotion.id)}
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          {promotion.image && (
                            <img src={promotion.image} alt={promotion.name} className="w-16 h-16 object-cover rounded shadow-md border border-gray-300 bg-white" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-extrabold text-green-600 dark:text-green-400">{formatPrice(promotion.price)}</span>
                          <span className="text-lg text-gray-400 line-through">{formatPrice(promotion.originalPrice)}</span>
                        </div>
                        <div className="space-y-1">
                          {promotion.products.map((product) => (
                            <div key={product.id} className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              {product.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={promotion.active}
                        onCheckedChange={async (checked) => {
                          try {
                            await api.patch(`/admin/promotions/${promotion.id}/active`, { active: checked });
                            fetchData();
                          } catch (error) {
                            toast.error('Erro ao atualizar status da promoção');
                          }
                        }}
                      />
                      <span className={`font-semibold ${promotion.active ? 'text-green-600' : 'text-gray-400'}`}>{promotion.active ? 'Ativa' : 'Inativa'}</span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="doses">
              <div className="flex flex-col sm:flex-row sm:justify-end mb-4 gap-2">
                <Button className="flex items-center gap-2 w-full sm:w-auto" onClick={() => { resetForm(); setIsDoseDialogOpen(true); }}>
                  <Plus className="w-4 h-4" />
                  Adicionar Dose
                </Button>
              </div>
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {(doses || []).map((dose) => (
                  <Card key={dose.id} className="min-h-[200px] shadow-lg border-2 border-gray-200 dark:border-gray-800 hover:border-primary transition-all group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-primary group-hover:text-primary-700 transition-colors">{dose.name}</CardTitle>
                          <CardDescription className="text-gray-500 dark:text-gray-400 mt-1">{dose.description}</CardDescription>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-primary/10"
                              onClick={() => { setEditingDose(dose); setIsDoseDialogOpen(true); }}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-red-100 dark:hover:bg-red-900"
                              onClick={() => handleDeleteDose(dose.id)}
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          {dose.image && (
                            <img src={dose.image} alt={dose.name} className="w-16 h-16 object-cover rounded shadow-md border border-gray-300 bg-white" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <span className="text-2xl font-extrabold text-green-600 dark:text-green-400">{formatPrice(dose.price)}</span>
                        <div className="space-y-1">
                          {dose.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-200">{item.product.name}</span>
                              <span className="text-gray-400">({item.quantity}{item.product.isFractioned ? 'ml' : ''})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={dose.active}
                        onCheckedChange={async (checked) => {
                          try {
                            await api.patch(`/admin/doses/${dose.id}/active`, { active: checked });
                            fetchData();
                          } catch (error) {
                            toast.error('Erro ao atualizar status da dose');
                          }
                        }}
                      />
                      <span className={`font-semibold ${dose.active ? 'text-green-600' : 'text-gray-400'}`}>{dose.active ? 'Ativo' : 'Inativo'}</span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      </AdminLayout>
      {/* Modal de edição de combo */}
      <Dialog open={!!editingCombo} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="w-full max-w-2xl p-2 sm:p-6 max-h-[90vh] overflow-y-auto">
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
                  <Input id="name" name="name" defaultValue={editingCombo.name} required className="w-full" />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" defaultValue={editingCombo.description} className="w-full" />
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
                  <Label htmlFor="combo-category-edit">Categoria</Label>
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
                <div className="md:col-span-2">
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
                <Button type="button" variant="outline" onClick={() => { resetForm(); setIsComboDialogOpen(false); }}>
                  Cancelar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Modal de criação de combo */}
      <Dialog open={isComboDialogOpen} onOpenChange={handleOpenComboDialog}>
        <DialogContent className="w-full max-w-2xl p-2 sm:p-6 max-h-[90vh] overflow-y-auto">
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
                <Input id="name" name="name" required className="w-full" />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" name="description" className="w-full" />
              </div>
              <div>
                <Label htmlFor="price">Preço</Label>
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
                <Label htmlFor="image">Imagem</Label>
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
                <Select value={comboCategoryId} onValueChange={setComboCategoryId} required>
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
                {isSubmitting ? 'Criando...' : 'Criar Combo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modal de criação de promoção */}
      <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
        <DialogContent className="w-full max-w-2xl p-2 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova Promoção</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePromotion} className="space-y-6" encType="multipart/form-data">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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
                <Input id="price" name="price" type="number" step="0.01" required className="w-full" />
              </div>
              <div>
                <Label htmlFor="originalPrice">Preço Original</Label>
                <Input id="originalPrice" name="originalPrice" type="number" step="0.01" required className="w-full" />
              </div>
              <div>
                <Label htmlFor="image">Imagem</Label>
                <Input id="image" name="image" type="file" accept="image/*" className="w-full" />
              </div>
              <div className="md:col-span-2">
                <Label>Produtos da Promoção</Label>
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
                          <span>{product.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || selectedProducts.length === 0}>
                {isSubmitting ? 'Criando...' : 'Criar Promoção'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsPromotionDialogOpen(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modal de edição de dose */}
      <Dialog open={isDoseDialogOpen} onOpenChange={handleOpenDoseDialog}>
        <DialogContent className="w-full max-w-2xl p-2 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDose ? 'Editar Dose' : 'Adicionar Dose'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editingDose ? handleUpdateDose : handleCreateDose} className="space-y-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Nome da Dose</Label>
                <Input name="name" placeholder="Nome da Dose" defaultValue={editingDose?.name || ''} required className="w-full" />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea name="description" placeholder="Descrição" defaultValue={editingDose?.description || ''} className="w-full" />
              </div>
              <div>
                <Label htmlFor="price">Preço (R$)</Label>
                <Input name="price" placeholder="Preço (R$)" type="number" step="0.01" defaultValue={editingDose?.price || ''} required className="w-full" />
              </div>
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
                <Label htmlFor="dose-category-edit">Categoria</Label>
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
              <div className="md:col-span-2">
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
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingDose ? 'Salvar Alterações' : 'Cadastrar Dose'}</Button>
              <Button type="button" variant="outline" onClick={() => { setIsDoseDialogOpen(false); resetForm(); }}>Cancelar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 