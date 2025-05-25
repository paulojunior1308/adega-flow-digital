import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RegistrationForm from '@/components/RegistrationForm';

const Cadastro = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-12 bg-element-gray-light">
        <div className="element-container">
          <div className="max-w-4xl mx-auto">
            <RegistrationForm />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Cadastro;
