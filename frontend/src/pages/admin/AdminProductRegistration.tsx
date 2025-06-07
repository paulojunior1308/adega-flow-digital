import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { 
  Package,
  Save, 
  Upload, 
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/axios';

interface Category {
  id: string;
  name: string;
}

interface ProductFormValues {
  name: string;
  category: string;
  price: string;
  costPrice: string;
  stock: string;
  description: string;
  image: FileList | null;
  unit: string;
  quantityPerUnit: string;
  canSellByUnit: boolean;
  canSellByDose: boolean;
}

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  return data.secure_url;
}

const AdminProductRegistration = () => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  
  const form = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      category: "",
      price: "",
      costPrice: "",
      stock: "",
      description: "",
      image: null,
      unit: "ml",
      quantityPerUnit: "",
      canSellByUnit: true,
      canSellByDose: false,
    }
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/admin/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (id) {
      api.get(`/admin/products/${id}`).then(response => {
        const product = response.data;
        setProduct(product);
        form.reset({
          name: product.name,
          category: product.categoryId,
          price: product.price.toString(),
          costPrice: product.costPrice.toString(),
          stock: product.stock.toString(),
          description: product.description || '',
          image: null,
          unit: product.unit,
          quantityPerUnit: product.quantityPerUnit,
          canSellByUnit: product.canSellByUnit,
          canSellByDose: product.canSellByDose,
        });
        if (product.image) {
          setPreviewImage(product.image);
        }
      });
    }
  }, [id, form]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      form.setValue("image", e.target.files as FileList);
    }
  };

  const clearImage = () => {
    setPreviewImage(null);
    form.setValue("image", null);
  };

  const onSubmit = async (data: ProductFormValues) => {
    // Formata o preço para garantir que seja um número válido
    const price = parseFloat(data.price.replace(',', '.'));
    const costPrice = parseFloat(data.costPrice.replace(',', '.'));
    
    if (isNaN(price) || isNaN(costPrice)) {
      toast({
        title: "Erro no preço",
        description: "Por favor, insira preços válidos",
        variant: 'destructive',
      });
      return;
    }
    let imageUrl = '';
    if (data.image?.[0]) {
      imageUrl = await uploadToCloudinary(data.image[0]);
    }

    try {
      const token = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token;
      const payload = {
        name: data.name,
        categoryId: data.category,
        price,
        costPrice,
        stock: data.stock,
        description: data.description || '',
        image: imageUrl || product?.image || '',
        unit: data.unit,
        quantityPerUnit: data.quantityPerUnit,
        canSellByUnit: data.canSellByUnit,
        canSellByDose: data.canSellByDose,
      };
      if (id) {
        await api.put(`/admin/products/${id}`, payload, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        toast({
          title: "Produto atualizado com sucesso!",
          description: `${data.name} foi atualizado.`,
        });
      } else {
        await api.post('/admin/products', payload, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        toast({
          title: "Produto cadastrado com sucesso!",
          description: `${data.name} foi adicionado ao estoque.`,
        });
      }
      setTimeout(() => {
        navigate('/admin-estoque');
      }, 2000);
    } catch (error: any) {
      toast({
        title: id ? "Erro ao atualizar produto" : "Erro ao cadastrar produto",
        description: error?.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-element-gray-light flex">
      <AdminSidebar />
      
      <div className="flex-1 p-8 ml-0 lg:ml-64">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-element-blue-dark">Cadastro de Produtos</h1>
          <p className="text-element-gray-dark">
            Cadastre novos produtos para o estoque da Element Adega.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto*</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Cerveja Heineken Lata 350ml" {...field} required />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          required
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Venda (R$)*</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            placeholder="0,00"
                            {...field}
                            required
                            onChange={(e) => {
                              // Permite apenas números e vírgula/ponto
                              const value = e.target.value.replace(/[^\d.,]/g, '');
                              // Substitui múltiplos pontos/vírgulas por um único
                              const formattedValue = value.replace(/[.,].*[.,]/g, '.');
                              field.onChange(formattedValue);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Custo (R$)*</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            placeholder="0,00"
                            {...field}
                            required
                            onChange={(e) => {
                              // Permite apenas números e vírgula/ponto
                              const value = e.target.value.replace(/[^\d.,]/g, '');
                              // Substitui múltiplos pontos/vírgulas por um único
                              const formattedValue = value.replace(/[.,].*[.,]/g, '.');
                              field.onChange(formattedValue);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Inicial*</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="0" 
                            {...field} 
                            required
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade do Produto*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} required>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ml">ml</SelectItem>
                            <SelectItem value="unidade">Unidade</SelectItem>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="quantityPerUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade por Unidade*</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="Ex: 900 para 900ml" {...field} required />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-4 items-center">
                    <FormField
                      control={form.control}
                      name="canSellByUnit"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-2">
                          <FormControl>
                            <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                          </FormControl>
                          <FormLabel>Permitir venda por unidade</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="canSellByDose"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-2">
                          <FormControl>
                            <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                          </FormControl>
                          <FormLabel>Permitir venda por dose</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição do Produto</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva o produto..." 
                            className="min-h-[120px]" 
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormLabel>Imagem do Produto</FormLabel>
                  <div className="mt-2">
                    {previewImage ? (
                      <div className="relative w-full">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-full h-48 object-contain"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <label
                            htmlFor="image-upload"
                            className="cursor-pointer bg-element-blue-dark text-white px-4 py-2 rounded-md hover:bg-element-blue-dark/90 inline-flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            <span>Upload de Imagem</span>
                          </label>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                          <p className="mt-2 text-xs text-gray-500">
                            PNG, JPG ou GIF (max. 2MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium text-blue-800">Dicas para cadastro:</h3>
                <ul className="mt-2 text-sm text-blue-600 space-y-1 list-disc pl-5">
                  <li>Use nomes descritivos para facilitar a busca</li>
                  <li>Inclua a quantidade (ml, L, g, kg) no nome do produto</li>
                  <li>Adicione imagens de qualidade para melhorar a visualização</li>
                  <li>Mantenha as informações de estoque atualizadas</li>
                </ul>
              </div>
              
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin-estoque')}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-element-blue-dark flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Salvar Produto</span>
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default AdminProductRegistration;
