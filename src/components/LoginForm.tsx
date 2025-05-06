
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, UserRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  type: 'customer' | 'admin';
}

const LoginForm = ({ type }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulating authentication
    setTimeout(() => {
      setLoading(false);
      
      if (email && password) {
        // Success
        toast({
          title: "Login realizado com sucesso",
          description: type === 'customer' 
            ? "Bem-vindo à área do cliente!" 
            : "Bem-vindo à área administrativa!",
        });
        
        // Redirect based on user type
        if (type === 'customer') {
          navigate('/cliente-dashboard');
        } else {
          navigate('/admin-dashboard');
        }
      } else {
        // Error
        toast({
          title: "Erro de login",
          description: "Por favor, verifique seu email e senha.",
          variant: "destructive",
        });
      }
    }, 1500);
  };
  
  return (
    <div className="element-card p-8 w-full max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8">
        {type === 'customer' ? (
          <div className="bg-element-blue-neon rounded-full p-4 mb-4">
            <User className="h-8 w-8 text-element-blue-dark" />
          </div>
        ) : (
          <div className="bg-element-blue-dark rounded-full p-4 mb-4">
            <UserRound className="h-8 w-8 text-white" />
          </div>
        )}
        
        <h2 className="element-heading text-center">
          {type === 'customer' ? 'Área do Cliente' : 'Área Administrativa'}
        </h2>
        <p className="text-element-gray-dark/70 text-center mt-2">
          {type === 'customer' 
            ? 'Faça login para acompanhar pedidos e ver ofertas exclusivas' 
            : 'Acesso restrito aos administradores da Element Adega'}
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
          className={`w-full ${
            type === 'customer' 
              ? 'element-btn-primary' 
              : 'element-btn-secondary'
          }`}
          disabled={loading}
        >
          {loading ? 'Carregando...' : 'Entrar'}
        </Button>
        
        {type === 'customer' && (
          <div className="text-center mt-6">
            <p className="text-element-gray-dark">
              Não tem uma conta?{" "}
              <a href="/cadastro" className="element-link font-medium">
                Cadastre-se
              </a>
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginForm;
