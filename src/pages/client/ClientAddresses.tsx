
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

const ClientAddresses = () => {
  const { toast } = useToast();
  const [addresses, setAddresses] = React.useState<Address[]>([
    {
      id: '1',
      title: 'Casa',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 101',
      neighborhood: 'Jardim Primavera',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01234-567',
      isDefault: true
    },
    {
      id: '2',
      title: 'Trabalho',
      street: 'Av. Paulista',
      number: '1000',
      complement: 'Sala 301',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01310-100',
      isDefault: false
    }
  ]);
  
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
  
  const handleDeleteConfirm = () => {
    if (addressToDelete) {
      setAddresses(addresses.filter(address => address.id !== addressToDelete));
      toast({
        title: "Endereço removido",
        description: "O endereço foi removido com sucesso.",
        duration: 3000,
      });
      setIsDeleteDialogOpen(false);
      setAddressToDelete(null);
    }
  };
  
  const handleSetDefault = (id: string) => {
    setAddresses(addresses.map(address => ({
      ...address,
      isDefault: address.id === id
    })));
    toast({
      title: "Endereço padrão definido",
      description: "Seu endereço padrão foi atualizado com sucesso.",
      duration: 3000,
    });
  };
  
  const handleSaveAddress = (e: React.FormEvent<HTMLFormElement>) => {
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
    
    if (currentAddress) {
      // Update existing address
      setAddresses(addresses.map(address => {
        if (address.id === currentAddress.id) {
          if (newAddress.isDefault) {
            // Make sure only one address is default
            return { ...address, ...newAddress, isDefault: true };
          }
          return { ...address, ...newAddress };
        }
        // If the new address is marked as default, unmark others
        if (newAddress.isDefault) {
          return { ...address, isDefault: false };
        }
        return address;
      }));
      
      toast({
        title: "Endereço atualizado",
        description: "O endereço foi atualizado com sucesso.",
        duration: 3000,
      });
    } else {
      // Add new address
      const id = Math.random().toString(36).substring(2, 9);
      
      // If this is the first address, or if it's set as default
      const isDefault = addresses.length === 0 || newAddress.isDefault;
      
      const fullAddress: Address = {
        id,
        title: newAddress.title || '',
        street: newAddress.street || '',
        number: newAddress.number || '',
        complement: newAddress.complement,
        neighborhood: newAddress.neighborhood || '',
        city: newAddress.city || '',
        state: newAddress.state || '',
        zipcode: newAddress.zipcode || '',
        isDefault: isDefault
      };
      
      if (isDefault) {
        // Make sure only one address is default
        setAddresses(addresses.map(address => ({
          ...address,
          isDefault: false
        })).concat(fullAddress));
      } else {
        setAddresses([...addresses, fullAddress]);
      }
      
      toast({
        title: "Endereço adicionado",
        description: "O novo endereço foi adicionado com sucesso.",
        duration: 3000,
      });
    }
    
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-element-gray-light">
      <ClientSidebar />
      
      <div className="lg:pl-64 min-h-screen">
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
