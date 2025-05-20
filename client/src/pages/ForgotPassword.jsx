import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import LayoutBase from '@/layout/LayoutBase';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      // Considerando que requestPasswordReset é uma função do contexto Auth
      // Se ela não existir, você precisará implementá-la no AuthContext
      const result = await requestPasswordReset(email);

      if (result.success) {
        setSuccessMessage('Enviamos um link de recuperação para seu email.');
        // Limpar o campo de email após o sucesso
        setEmail('');
        // Opcionalmente, redirecione após alguns segundos
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } else {
        setError(
          result.message || 'Não foi possível enviar o email de recuperação.'
        );
      }
    } catch (err) {
      setError(
        'Ocorreu um erro ao processar sua solicitação. Tente novamente.'
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LayoutBase>
      <div className="min-h-[calc(100vh-250px)] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Recuperar Senha
          </h1>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="text-sm text-gray-600 mb-2">
              Informe o email associado à sua conta. Enviaremos um link para
              redefinir sua senha.
            </div>

            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Email de Recuperação'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">
              Lembrou sua senha?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:underline font-semibold"
              >
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </LayoutBase>
  );
};

export default ForgotPassword;
