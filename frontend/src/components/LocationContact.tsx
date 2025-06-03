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
                  Av. Antonio Carlos Benjamin dos Santos, 1663<br />
                  Jardim São Bernardo - São Paulo, SP<br />
                  04844-445
                </p>
              }
            />
            
            <ContactItem 
              icon={<Phone className="h-6 w-6 text-element-blue-dark" />}
              title="Telefone"
              content={
                <p className="text-element-gray-dark">
                  <a href="tel:+5511958668304" className="element-link">(11) 95866-8304</a>
                </p>
              }
            />
            
            <ContactItem 
              icon={<Clock className="h-6 w-6 text-element-blue-dark" />}
              title="Horário de Funcionamento"
              content={
                <p className="text-element-gray-dark">
                  SEG A QUI 18:00 AS 00:00<br />
                  SAB E DOM 12:00 AS 00:00
                </p>
              }
            />
            
            <ContactItem 
              icon={<Truck className="h-6 w-6 text-element-blue-dark" />}
              title="Entrega"
              content={
                <p className="text-element-gray-dark">
                  Máx 5 km
                </p>
              }
            />
          </div>
          
          <div className="rounded-lg overflow-hidden shadow-lg h-[500px]">
            <iframe 
              src="https://www.google.com/maps?q=Av.+Antonio+Carlos+Benjamin+dos+Santos,+1663+-+Jardim+S%C3%A3o+Bernardo,+S%C3%A3o+Paulo+-+SP,+04844-445&output=embed"
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
