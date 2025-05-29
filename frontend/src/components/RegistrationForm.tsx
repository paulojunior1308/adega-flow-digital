import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const RegistrationForm = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (senha !== confirmarSenha) {
      toast({
        title: "Erro de cadastro",
        description: "As senhas não correspondem.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/register', {
        name: nome,
        email,
        password: senha,
        cpf,
      });
      toast({
        title: "Cadastro realizado com sucesso",
        description: "Bem-vindo à Element Adega!"
      });
      navigate('/login');
    } catch (error: any) {
      let description = "Não foi possível realizar o cadastro.";
      if (error?.response?.data?.error?.includes('CPF já cadastrado')) {
        description = "Já existe um usuário cadastrado com este CPF.";
      }
      toast({
        title: "Erro de cadastro",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="element-card p-8 w-full max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-element-blue-neon rounded-full p-4 mb-4">
          <User className="h-8 w-8 text-element-blue-dark" />
        </div>
        
        <h2 className="element-heading text-center">Crie sua conta</h2>
        <p className="text-element-gray-dark/70 text-center mt-2">
          Preencha os campos abaixo para se cadastrar
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="nome" className="block text-element-gray-dark font-medium mb-2">
            Nome Completo
          </label>
          <input
            id="nome"
            type="text"
            className="element-input w-full"
            placeholder="Seu nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-element-gray-dark font-medium mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="element-input w-full"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="telefone" className="block text-element-gray-dark font-medium mb-2">
            Telefone
          </label>
          <input
            id="telefone"
            type="tel"
            className="element-input w-full"
            placeholder="(XX) XXXXX-XXXX"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="cpf" className="block text-element-gray-dark font-medium mb-2">
            CPF
          </label>
          <input
            id="cpf"
            type="text"
            className="element-input w-full"
            placeholder="XXX.XXX.XXX-XX"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="senha" className="block text-element-gray-dark font-medium mb-2">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            className="element-input w-full"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="confirmarSenha" className="block text-element-gray-dark font-medium mb-2">
            Confirmar Senha
          </label>
          <input
            id="confirmarSenha"
            type="password"
            className="element-input w-full"
            placeholder="••••••••"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
          />
        </div>
        
        <Button
          type="submit"
          className="w-full element-btn-primary"
          disabled={loading}
        >
          {loading ? 'Carregando...' : 'Cadastrar'}
        </Button>
        
        <div className="text-center mt-6">
          <p className="text-element-gray-dark">
            Já tem uma conta?{" "}
            <a href="/login" className="element-link font-medium">
              Faça login
            </a>
          </p>
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o início
        </Button>
      </form>

      <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento via PIX</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-center">
              <p className="font-medium mb-2">Copie a chave PIX abaixo e faça o pagamento no app do seu banco.</p>
              <p className="text-xs text-gray-500 break-all">Chave PIX:</p>
              <input
                value="elementstore516@gmail.com"
                readOnly
                className="mb-2 text-xs w-full text-center border rounded p-2"
                onFocus={e => e.target.select()}
              />
              <Button onClick={() => { navigator.clipboard.writeText('elementstore516@gmail.com'); toast({ title: 'Chave copiada!' }); }} size="sm" variant="outline">Copiar chave</Button>
            </div>
            <div className="mt-4">
              <span className="text-yellow-600 font-semibold">Aguardando pagamento...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegistrationForm;