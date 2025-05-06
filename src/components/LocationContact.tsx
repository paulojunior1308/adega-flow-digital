
import React from 'react';
import { MapPin, Phone, Clock, Mail, Truck } from 'lucide-react';

const ContactItem = ({ icon, title, content }: { icon: React.ReactNode, title: string, content: React.ReactNode }) => {
  return (
    <div className="flex items-start p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="rounded-full bg-element-blue-neon p-3 mr-4">
        {icon}
      </div>
      <div>
        <h3 className="font-bold mb-1 text-element-blue-dark">{title}</h3>
        {content}
      </div>
    </div>
  );
};

const LocationContact = () => {
  return (
    <section className="element-section">
      <div className="element-container">
        <h2 className="element-heading text-center mb-12">Localização & Contato</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <ContactItem 
              icon={<MapPin className="h-6 w-6 text-element-blue-dark" />}
              title="Endereço"
              content={
                <p className="text-element-gray-dark">
                  Av. Principal, 123<br />
                  Vila Nova - São Paulo, SP<br />
                  CEP: 01234-567
                </p>
              }
            />
            
            <ContactItem 
              icon={<Phone className="h-6 w-6 text-element-blue-dark" />}
              title="Telefone"
              content={
                <p className="text-element-gray-dark">
                  <a href="tel:+5511987654321" className="element-link">(11) 98765-4321</a><br />
                  <a href="tel:+551123456789" className="element-link">(11) 2345-6789</a>
                </p>
              }
            />
            
            <ContactItem 
              icon={<Clock className="h-6 w-6 text-element-blue-dark" />}
              title="Horário de Funcionamento"
              content={
                <p className="text-element-gray-dark">
                  Segunda - Sábado: 10h às 22h<br />
                  Domingo: 11h às 20h
                </p>
              }
            />
            
            <ContactItem 
              icon={<Mail className="h-6 w-6 text-element-blue-dark" />}
              title="Email"
              content={
                <p className="text-element-gray-dark">
                  <a href="mailto:contato@elementadega.com.br" className="element-link">
                    contato@elementadega.com.br
                  </a>
                </p>
              }
            />
            
            <ContactItem 
              icon={<Truck className="h-6 w-6 text-element-blue-dark" />}
              title="Entrega"
              content={
                <p className="text-element-gray-dark">
                  Entrega rápida em até 40 minutos<br />
                  Grátis para pedidos acima de R$ 100,00
                </p>
              }
            />
          </div>
          
          <div className="rounded-lg overflow-hidden shadow-lg h-[500px]">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1896436497924!2d-46.6339027!3d-23.5617614!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59aa91e77201%3A0x7c38a423931953d5!2sAv.%20Paulista%2C%20S%C3%A3o%20Paulo%20-%20SP!5e0!3m2!1spt-BR!2sbr!4v1714582903052!5m2!1spt-BR!2sbr" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy"
              title="Mapa da Localização"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationContact;
