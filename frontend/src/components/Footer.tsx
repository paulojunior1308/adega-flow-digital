import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-element-blue-dark text-white">
      <div className="element-container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <img 
              src="/lovable-uploads/fde6ed06-8df2-4405-b0ed-5e5f59e91ed4.png" 
              alt="Element Adega" 
              className="h-16 bg-white p-1 rounded mb-4" 
            />
            <p className="text-element-gray-light text-center md:text-left">
              Sua adega de confiança com as melhores bebidas, combos e produtos para narguilé.
            </p>
          </div>
          
          <div className="space-y-4 text-center md:text-left">
            <h3 className="text-element-blue-neon font-bold text-xl">Contato</h3>
            <div className="flex flex-col space-y-2">
              <p className="flex items-center justify-center md:justify-start">
                <MapPin className="mr-2 h-5 w-5 text-element-blue-neon" />
                Av. Antônio Carlos Benjamin dos Santos, 1663 - Jardim São Bernardo
              </p>
              <p className="flex items-center justify-center md:justify-start">
                <Phone className="mr-2 h-5 w-5 text-element-blue-neon" />
                (11) 96868-1952
              </p>
              <p className="flex items-center justify-center md:justify-start">
                <Mail className="mr-2 h-5 w-5 text-element-blue-neon" />
                contato@elementadega.com.br
              </p>
            </div>
          </div>
          
          <div className="space-y-4 text-center md:text-left">
            <h3 className="text-element-blue-neon font-bold text-xl">Links Rápidos</h3>
            <div className="flex flex-col space-y-2">
              <Link to="/promocoes" className="hover:text-element-blue-neon transition-colors">Promoções</Link>
              <Link to="/combos" className="hover:text-element-blue-neon transition-colors">Combos</Link>
              <Link to="/narguile" className="hover:text-element-blue-neon transition-colors">Narguilé</Link>
              <Link to="/bebidas" className="hover:text-element-blue-neon transition-colors">Bebidas</Link>
             </div>
          </div>
        </div>
        
        <div className="border-t border-element-gray-light/20 mt-8 pt-6 text-center">
          <p>© {new Date().getFullYear()} Element Adega. Todos os direitos reservados.</p>
          <p className="text-sm text-element-gray-light/60 mt-2">
            Consumo de bebidas alcoólicas é proibido para menores de 18 anos. Beba com moderação.
          </p>
        </div>
      </div>
      <footer className="text-center text-xs text-gray-400 py-4">
        Desenvolvido por <a href="https://www.jrtechnologysolutions.com.br" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Jr Technology Solutions</a>
      </footer>
    </footer>
  );
};

export default Footer;
