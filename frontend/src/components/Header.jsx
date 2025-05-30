import { useLocation } from 'react-router-dom';

const location = useLocation();
const hideCartButton = [
  '/',
  '/promocoes',
  '/combos',
  '/narguile',
  '/bebidas',
  '/login',
].includes(location.pathname);

{!hideCartButton && (
  // ... código do botão de carrinho ...
)} 