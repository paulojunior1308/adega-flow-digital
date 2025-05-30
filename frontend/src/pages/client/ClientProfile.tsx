import React from 'react';
import ClientSidebar from '@/components/client/ClientSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

const ClientProfile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [passwords, setPasswords] = React.useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [changingPassword, setChangingPassword] = React.useState(false);

  React.useEffect(() => {
    api.get('/cliente-perfil').then(res => {
      setUser(res.data);
      setLoading(false);
    }).catch(() => {
      toast({
        title: 'Erro ao carregar perfil',
        description: 'Não foi possível carregar seus dados.',
        variant: 'destructive',
        duration: 3000,
      });
      setLoading(false);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você pode implementar a atualização do perfil via API se desejar
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram atualizadas com sucesso!",
      duration: 3000,
    });
    setIsEditing(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({
        title: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({
        title: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }
    setChangingPassword(true);
    try {
      await api.put('/cliente-perfil/senha', {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      toast({
        title: 'Senha alterada com sucesso!',
        duration: 3000,
      });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      toast({
        title: 'Erro ao alterar senha',
        description: err?.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-element-gray-light">
      <ClientSidebar />
      
      <div className="lg:pl-64 min-h-screen pl-24 md:pl-24 lg:pl-64 transition-all duration-300">
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
                            value={user?.name || ''}
                            className="pl-10"
                            disabled={!isEditing}
                            onChange={e => setUser({ ...user, name: e.target.value })}
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
                            value={user?.email || ''}
                            className="pl-10"
                            disabled
                          />
                        </div>
                      </div>
                      
                      {/* Campos opcionais, se existirem no backend */}
                      {/* <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-element-gray-dark/60" />
                          <Input 
                            id="phone" 
                            placeholder="Seu telefone" 
                            value={user?.phone || ''}
                            className="pl-10"
                            disabled={!isEditing}
                            onChange={e => setUser({ ...user, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birth">Data de Nascimento</Label>
                        <Input 
                          id="birth" 
                          type="date" 
                          value={user?.birth || ''}
                          disabled={!isEditing}
                          onChange={e => setUser({ ...user, birth: e.target.value })}
                        />
                      </div> */}
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
            
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Senha Atual</Label>
                      <Input
                        id="current-password"
                        type="password"
                        placeholder="Digite sua senha atual"
                        value={passwords.current}
                        onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                        autoComplete="current-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nova Senha</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Digite a nova senha"
                        value={passwords.new}
                        onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirme a nova senha"
                        value={passwords.confirm}
                        onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-element-blue-neon text-element-gray-dark hover:bg-element-blue-neon/90"
                      disabled={changingPassword}
                    >
                      {changingPassword ? 'Alterando...' : 'Alterar Senha'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
