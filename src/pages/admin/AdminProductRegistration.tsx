
import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';

// Categorias disponíveis
const categories = [
  "Cervejas",
  "Destilados",
  "Vinhos",
  "Energéticos",
  "Água",
  "Narguilé",
  "Acessórios"
];

// Fornecedores disponíveis
const suppliers = [
  "Distribuidora Sul",
  "Importadora Primavera",
  "Distribuidora Central",
  "Vinícola Sul",
  "Distribuidora Oriental"
];

interface ProductFormValues {
  name: string;
  category: string;
  price: string;
  stock: string;
  supplier: string;
  description: string;
  image: FileList | null;
}

const AdminProductRegistration = () => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      category: "",
      price: "",
      stock: "",
      supplier: "",
      description: "",
      image: null
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue("image", e.target.files as FileList);
    }
  };

  const clearImage = () => {
    setPreviewImage(null);
    form.setValue("image", null);
  };

  const onSubmit = (data: ProductFormValues) => {
    // Em um cenário real, aqui enviaríamos os dados para uma API
    console.log("Produto para cadastrar:", data);
    
    toast({
      title: "Produto cadastrado com sucesso!",
      description: `${data.name} foi adicionado ao estoque.`,
    });
    
    // Redirecionar para a página de estoque após o cadastro
    setTimeout(() => {
      navigate('/admin-estoque');
    }, 2000);
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fornecedor*</FormLabel>
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
                              {suppliers.map((supplier) => (
                                <SelectItem key={supplier} value={supplier}>
                                  {supplier}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço (R$)*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0" 
                              placeholder="0,00" 
                              {...field} 
                              required
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
                  </div>
                  
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
                </div>
                
                <div className="space-y-4">
                  <FormLabel>Imagem do Produto</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
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
                  
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h3 className="font-medium text-blue-800">Dicas para cadastro:</h3>
                    <ul className="mt-2 text-sm text-blue-600 space-y-1 list-disc pl-5">
                      <li>Use nomes descritivos para facilitar a busca</li>
                      <li>Inclua a quantidade (ml, L, g, kg) no nome do produto</li>
                      <li>Adicione imagens de qualidade para melhorar a visualização</li>
                      <li>Mantenha as informações de estoque atualizadas</li>
                    </ul>
                  </div>
                </div>
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
