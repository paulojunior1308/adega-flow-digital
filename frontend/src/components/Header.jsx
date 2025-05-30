import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// Se você não tiver os ícones, remova ou substitua por texto ou outros ícones
// import { Menu, X, ShoppingCart, User } from 'lucide-react';
// import { Button } from "@/components/ui/button";

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

  const scrollToContato = () => {
    const section = document.getElementById('contato');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContatoClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      scrollToContato();
    } else {
      navigate('/');
      setTimeout(() => {
        scrollToContato();
      }, 400);
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

        {/* Botão do menu mobile (pode substituir por texto se não tiver ícone) */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? 'Fechar' : 'Menu'}
        </button>

        {/* Navegação Desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/promocoes" className="element-link font-medium">Promoções</Link>
          <Link to="/combos" className="element-link font-medium">Combos</Link>
          <Link to="/narguile" className="element-link font-medium">Narguilé</Link>
          <Link to="/bebidas" className="element-link font-medium">Bebidas</Link>
          <button onClick={handleContatoClick} className="element-link font-medium bg-transparent border-none cursor-pointer">Contato</button>
          <Link to="/login" className="element-btn-primary flex items-center">
            Entrar
          </Link>
          {!hideCartButton && (
            <Link to="/carrinho" className="element-btn-secondary flex items-center">
              Carrinho
            </Link>
          )}
        </nav>
      </div>

      {/* Navegação Mobile */}
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
                Entrar
              </Link>
              {!hideCartButton && (
                <Link 
                  to="/carrinho" 
                  className="element-btn-secondary flex-1 flex justify-center items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Carrinho
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