import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const hideCartButton = [
    '/',
    '/promocoes',
    '/combos',
    '/narguile',
    '/bebidas',
    '/login',
  ].includes(location.pathname);

  return (
    <header>
      {/* ...outros elementos do header... */}
      {!hideCartButton && (
        <Link to="/carrinho">Carrinho</Link>
      )}
    </header>
  );
};

export default Header; 