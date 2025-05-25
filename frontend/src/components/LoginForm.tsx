import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/login', {
        email,
        password,
      });

      const { user, token } = response.data;
      
      login(user, token);
      
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo à Element Adega!"
      });
      
      if (user.role === 'ADMIN') {
        navigate('/admin-dashboard');
      } else if (user.role === 'MOTOBOY') {
        navigate('/motoboy');
      } else {
        navigate('/cliente-dashboard');
      }
    } catch (error) {
      toast({
        title: "Erro de login",
        description: "Por favor, verifique seu email e senha.",
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
        
        <h2 className="element-heading text-center">Área de Acesso</h2>
        <p className="text-element-gray-dark/70 text-center mt-2">
          Faça login para acessar sua conta
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
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
          <label htmlFor="password" className="block text-element-gray-dark font-medium mb-2">
            Senha
          </label>
          <input
            id="password"
            type="password"
            className="element-input w-full"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              className="rounded border-element-gray-light mr-2"
            />
            <label htmlFor="remember" className="text-sm text-element-gray-dark">
              Lembrar-me
            </label>
          </div>
          
          <a href="#" className="text-sm element-link">
            Esqueceu a senha?
          </a>
        </div>
        
        <Button
          type="submit"
          className="w-full element-btn-primary"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
        
        <div className="text-center mt-6">
          <p className="text-element-gray-dark">
            Não tem uma conta?{" "}
            <a href="/cadastro" className="element-link font-medium">
              Cadastre-se
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
