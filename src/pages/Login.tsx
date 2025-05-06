
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoginForm from '@/components/LoginForm';

const Login = () => {
  const location = useLocation();
  const isAdmin = location.pathname === '/login-admin';
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-12 bg-element-gray-light">
        <div className="element-container">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex justify-center">
              <div className="bg-white rounded-full px-6 py-3 shadow-md">
                <Link 
                  to="/login" 
                  className={`px-4 py-2 rounded-full transition-colors ${!isAdmin ? 'bg-element-blue-neon text-element-gray-dark' : 'text-element-gray-dark hover:bg-element-gray-light'}`}
                >
                  Cliente
                </Link>
                <Link 
                  to="/login-admin" 
                  className={`px-4 py-2 rounded-full transition-colors ${isAdmin ? 'bg-element-blue-dark text-white' : 'text-element-gray-dark hover:bg-element-gray-light'}`}
                >
                  Administrador
                </Link>
              </div>
            </div>
            
            <LoginForm type={isAdmin ? 'admin' : 'customer'} />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
