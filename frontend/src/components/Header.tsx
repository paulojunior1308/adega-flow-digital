import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const hideCartButton = [
    '/',
    '/promocoes',
    '/combos',
    '/narguile',
    '/bebidas',
    '/login',
  ].includes(location.pathname);

  // Função para scroll suave até a seção de contato
  const scrollToContato = () => {
    const section = document.getElementById('contato');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContatoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      scrollToContato();
    } else {
      navigate('/');
      setTimeout(() => {
        scrollToContato();
      }, 400); // tempo para garantir que a home carregue
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white sticky top-0 z-50 shadow-md">
      <div className="element-container flex items-center justify-between py-4">
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/fde6ed06-8df2-4405-b0ed-5e5f59e91ed4.png" 
            alt="Element Adega" 
            className="h-12 md:h-16"
          />
        </Link>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/promocoes" className="element-link font-medium">Promoções</Link>
          <Link to="/combos" className="element-link font-medium">Combos</Link>
          <Link to="/narguile" className="element-link font-medium">Narguilé</Link>
          <Link to="/bebidas" className="element-link font-medium">Bebidas</Link>
          <button onClick={handleContatoClick} className="element-link font-medium bg-transparent border-none cursor-pointer">Contato</button>
          <Link to="/login" className="element-btn-primary flex items-center">
            <User className="mr-2 h-5 w-5" /> Entrar
          </Link>
          {!hideCartButton && (
            <Link to="/carrinho" className="element-btn-secondary flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" /> Carrinho
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white animate-fade-in border-t">
          <div className="element-container py-4 flex flex-col space-y-4">
            <Link 
              to="/promocoes" 
              className="element-link font-medium p-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Promoções
            </Link>
            <Link 
              to="/combos" 
              className="element-link font-medium p-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Combos
            </Link>
            <Link 
              to="/narguile" 
              className="element-link font-medium p-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Narguilé
            </Link>
            <Link 
              to="/bebidas" 
              className="element-link font-medium p-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Bebidas
            </Link>
            <button onClick={handleContatoClick} className="element-link font-medium p-2 bg-transparent border-none cursor-pointer w-full text-left">Contato</button>
            <div className="flex space-x-2 pt-2">
              <Link 
                to="/login" 
                className="element-btn-primary flex-1 flex justify-center items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="mr-2 h-5 w-5" /> Entrar
              </Link>
              {!hideCartButton && (
                <Link 
                  to="/carrinho" 
                  className="element-btn-secondary flex-1 flex justify-center items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Carrinho
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
