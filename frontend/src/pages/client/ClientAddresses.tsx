import React from 'react';
import ClientSidebar from '@/components/client/ClientSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MapPin,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import api from '@/lib/axios';

// Types
interface Address {
  id: string;
  title: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  isDefault: boolean;
}

// Função para buscar lat/lng pelo endereço
async function getLatLngFromAddress(address: string): Promise<{ lat: number, lng: number } | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
  const data = await response.json();
  if (data.status === 'OK') {
    return data.results[0].geometry.location;
  }
  return null;
}

const ClientAddresses = () => {
  const { toast } = useToast();
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [currentAddress, setCurrentAddress] = React.useState<Address | null>(null);
  const [addressToDelete, setAddressToDelete] = React.useState<string | null>(null);
  
  const handleAddNewClick = () => {
    setCurrentAddress(null);
    setIsDialogOpen(true);
  };
  
  const handleEditAddress = (address: Address) => {
    setCurrentAddress(address);
    setIsDialogOpen(true);
  };
  
  const handleDeleteClick = (id: string) => {
    setAddressToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (addressToDelete) {
      try {
        await api.delete(`/addresses/${addressToDelete}`);
        toast({
          title: 'Endereço removido',
          description: 'O endereço foi removido com sucesso.',
          duration: 3000,
        });
        setIsDeleteDialogOpen(false);
        setAddressToDelete(null);
        // Recarregar endereços do backend
        const res = await api.get('/addresses');
        setAddresses(res.data);
      } catch (error: any) {
        toast({
          title: 'Erro ao remover endereço',
          description: error?.response?.data?.message || 'Tente novamente.',
          variant: 'destructive',
          duration: 3000,
        });
      }
    }
  };
  
  const handleSetDefault = async (id: string) => {
    try {
      await api.put(`/addresses/${id}`, { isDefault: true });
      toast({
        title: 'Endereço padrão definido',
        description: 'Seu endereço padrão foi atualizado com sucesso.',
        duration: 3000,
      });
      // Recarregar endereços do backend
      const res = await api.get('/addresses');
      setAddresses(res.data);
    } catch (error: any) {
      toast({
        title: 'Erro ao definir padrão',
        description: error?.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };
  
  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAddress: Partial<Address> = {
      title: formData.get('title') as string,
      street: formData.get('street') as string,
      number: formData.get('number') as string,
      complement: formData.get('complement') as string,
      neighborhood: formData.get('neighborhood') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zipcode: formData.get('zipcode') as string,
      isDefault: formData.get('isDefault') === 'on'
    };
    // Montar endereço completo para geocodificação
    const fullAddress = `${newAddress.street}, ${newAddress.number}, ${newAddress.neighborhood}, ${newAddress.city}, ${newAddress.state}, ${newAddress.zipcode}`;
    const latLng = await getLatLngFromAddress(fullAddress);
    if (!latLng) {
      toast({
        title: 'Erro ao localizar endereço',
        description: 'Não foi possível obter a localização. Verifique o endereço digitado.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }
    try {
      if (currentAddress) {
        // Editar endereço existente
        await api.put(`/addresses/${currentAddress.id}`, { ...newAddress, lat: latLng.lat, lng: latLng.lng });
        toast({
          title: 'Endereço atualizado',
          description: 'O endereço foi atualizado com sucesso.',
          duration: 3000,
        });
      } else {
        // Criar novo endereço
        await api.post('/addresses', { ...newAddress, lat: latLng.lat, lng: latLng.lng });
        toast({
          title: 'Endereço adicionado',
          description: 'O novo endereço foi adicionado com sucesso.',
          duration: 3000,
        });
      }
      setIsDialogOpen(false);
      // Recarregar endereços do backend
      const res = await api.get('/addresses');
      setAddresses(res.data);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar endereço',
        description: error?.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  // Buscar endereços reais do backend ao carregar a página
  React.useEffect(() => {
    api.get('/addresses').then(res => {
      setAddresses(res.data);
    }).catch(() => {
      toast({
        title: 'Erro ao carregar endereços',
        description: 'Não foi possível carregar seus endereços.',
        variant: 'destructive',
        duration: 3000,
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-element-gray-light">
      <ClientSidebar />
      
      <div className="lg:pl-64 min-h-screen pl-24 md:pl-24 lg:pl-64 transition-all duration-300">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark">Meus Endereços</h1>
            <Button 
              onClick={handleAddNewClick}
              className="bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Endereço
            </Button>
          </div>
          
          {addresses.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <MapPin className="h-16 w-16 text-gray-300" />
                <h3 className="text-xl font-medium">Nenhum endereço cadastrado</h3>
                <p className="text-gray-500 mb-4">
                  Você ainda não possui nenhum endereço cadastrado. Adicione um endereço para facilitar suas entregas.
                </p>
                <Button onClick={handleAddNewClick}>
                  Adicionar Endereço
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addresses.map((address) => (
                <Card key={address.id} className={address.isDefault ? "border-element-blue-neon" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{address.title}</CardTitle>
                      {address.isDefault && (
                        <Badge variant="default" className="bg-element-blue-neon text-element-gray-dark">
                          Padrão
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <p>{address.street}, {address.number}</p>
                      {address.complement && <p>{address.complement}</p>}
                      <p>{address.neighborhood}</p>
                      <p>{address.city} - {address.state}</p>
                      <p>CEP: {address.zipcode}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditAddress(address)}
                      >
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDeleteClick(address.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Excluir
                      </Button>
                    </div>
                    {!address.isDefault && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        Definir como padrão
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          {/* Add/Edit Address Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{currentAddress ? 'Editar Endereço' : 'Novo Endereço'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveAddress}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-4">
                      <Label htmlFor="title">Nome do Endereço</Label>
                      <Input 
                        id="title" 
                        name="title" 
                        defaultValue={currentAddress?.title} 
                        placeholder="Ex: Casa, Trabalho"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor="street">Rua</Label>
                      <Input 
                        id="street" 
                        name="street" 
                        defaultValue={currentAddress?.street} 
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor="number">Número</Label>
                      <Input 
                        id="number" 
                        name="number" 
                        defaultValue={currentAddress?.number} 
                        required
                      />
                    </div>
                    <div className="col-span-4">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input 
                        id="complement" 
                        name="complement" 
                        defaultValue={currentAddress?.complement} 
                        placeholder="Apto, bloco, referência (opcional)"
                      />
                    </div>
                    <div className="col-span-4">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input 
                        id="neighborhood" 
                        name="neighborhood" 
                        defaultValue={currentAddress?.neighborhood} 
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input 
                        id="city" 
                        name="city" 
                        defaultValue={currentAddress?.city} 
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input 
                        id="state" 
                        name="state" 
                        defaultValue={currentAddress?.state} 
                        maxLength={2}
                        required
                      />
                    </div>
                    <div className="col-span-4">
                      <Label htmlFor="zipcode">CEP</Label>
                      <Input 
                        id="zipcode" 
                        name="zipcode" 
                        defaultValue={currentAddress?.zipcode} 
                        placeholder="00000-000"
                        required
                      />
                    </div>
                    <div className="col-span-4 flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        name="isDefault"
                        className="h-4 w-4"
                        defaultChecked={currentAddress?.isDefault}
                      />
                      <Label htmlFor="isDefault" className="font-normal">
                        Definir como endereço padrão
                      </Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover Endereço</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover este endereço? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteConfirm}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default ClientAddresses;
