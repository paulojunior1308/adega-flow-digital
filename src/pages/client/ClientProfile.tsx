
import React from 'react';
import ClientSidebar from '@/components/client/ClientSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ClientProfile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would save the data to a backend
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram atualizadas com sucesso!",
      duration: 3000,
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-element-gray-light">
      <ClientSidebar />
      
      <div className="lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-element-blue-dark mb-6">Meu Perfil</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-element-gray-dark/60" />
                          <Input 
                            id="name" 
                            placeholder="Seu nome" 
                            defaultValue="João Silva" 
                            className="pl-10"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-element-gray-dark/60" />
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="Seu email" 
                            defaultValue="joao.silva@email.com" 
                            className="pl-10"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-element-gray-dark/60" />
                          <Input 
                            id="phone" 
                            placeholder="Seu telefone" 
                            defaultValue="(11) 98765-4321" 
                            className="pl-10"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="birth">Data de Nascimento</Label>
                        <Input 
                          id="birth" 
                          type="date" 
                          defaultValue="1990-01-01" 
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end space-x-2">
                      {isEditing ? (
                        <>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsEditing(false)}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" className="bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/90">
                            <Save className="mr-2 h-4 w-4" />
                            Salvar
                          </Button>
                        </>
                      ) : (
                        <Button 
                          type="button" 
                          onClick={() => setIsEditing(true)}
                        >
                          Editar Perfil
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Foto de Perfil</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src="https://i.pravatar.cc/300" alt="João Silva" />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                
                <div className="space-y-2 w-full">
                  <Button variant="outline" className="w-full">Alterar foto</Button>
                  <Button variant="outline" className="w-full text-red-500 hover:text-red-600">Remover foto</Button>
                </div>
                
                <div className="text-sm text-gray-500">
                  <p>Formatos permitidos: JPG, PNG</p>
                  <p>Tamanho máximo: 5MB</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Senha Atual</Label>
                      <Input 
                        id="current-password" 
                        type="password" 
                        placeholder="Digite sua senha atual" 
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div className="space-y-0 md:space-y-2">
                      <div className="hidden md:block">
                        <Label htmlFor="spacer">&nbsp;</Label>
                      </div>
                      <Button 
                        variant="outline"
                        className="w-full md:w-auto" 
                        disabled={!isEditing}
                      >
                        Alterar Senha
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
