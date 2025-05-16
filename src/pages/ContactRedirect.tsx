
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const ContactRedirect = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect to home page with hash to scroll to contact section
    navigate('/#contato', { replace: true });
    
    // Show a toast notification
    toast({
      title: "Redirecionando para contatos",
      description: "Você será direcionado para a seção de contatos",
    });
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecionando para a seção de contatos...</p>
    </div>
  );
};

export default ContactRedirect;
