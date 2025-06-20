import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LayoutBase from '@/layout/LayoutBase';
import { forgotPasswordSchema } from '@/schemas/auth';
import { requestPasswordReset } from '@/services/users.service';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  RotateCcw,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
    },
  });

  const watchedEmail = watch('email');
  useEffect(() => {
    if (isDirty && submitError) {
      setSubmitError('');
    }
  }, [watchedEmail, isDirty, submitError]);

  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && isSuccess) {
      navigate('/login');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown, isSuccess, navigate]);

  const onSubmit = async (data) => {
    setSubmitError('');
    setSuccessMessage('');

    try {
      const result = await requestPasswordReset(data.email);

      if (result.success) {
        setIsSuccess(true);
        setSuccessMessage(
          'Email de recuperação enviado com sucesso! Verifique sua caixa de entrada e spam.'
        );
        setCountdown(30);
        reset();
      } else {
        if (result.field === 'email') {
          setSubmitError(
            result.message || 'Email não encontrado em nossa base de dados.'
          );
        } else {
          setSubmitError(
            result.message || 'Não foi possível enviar o email de recuperação.'
          );
        }
      }
    } catch (error) {
      console.error('Erro na recuperação de senha:', error);
      setSubmitError(
        'Erro de conexão. Verifique sua internet e tente novamente.'
      );
    }
  };

  const handleTryAgain = useCallback(() => {
    setSubmitError('');
    setSuccessMessage('');
    setIsSuccess(false);
    setCountdown(0);
    reset();
  }, [reset]);

  if (isSuccess && successMessage) {
    return (
      <LayoutBase>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4 bg-gray-50">
          <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
            {/* Success Icon */}
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>

            {/* Success Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Email Enviado!
            </h1>

            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <Mail className="h-4 w-4" />
                <AlertDescription className="text-sm font-medium">
                  {successMessage}
                </AlertDescription>
              </Alert>

              <div className="text-sm text-gray-600 space-y-2">
                <p>📧 Verifique sua caixa de entrada</p>
                <p>📁 Não esqueça de conferir a pasta de spam</p>
                <p>⏰ O link expira em 24 horas</p>
              </div>

              {/* Countdown */}
              {countdown > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <Clock className="h-4 w-4" />
                  <span>Redirecionando para login em {countdown}s...</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-4">
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                Ir para Login
              </Button>

              <Button
                onClick={handleTryAgain}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Enviar Novamente
              </Button>
            </div>
          </div>
        </div>
      </LayoutBase>
    );
  }

  // Formulário principal
  return (
    <LayoutBase>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Esqueceu sua senha?
            </h1>
            <p className="text-gray-600">
              Não se preocupe! Enviaremos um link de recuperação para seu email
            </p>
          </div>

          {/* Error Alert */}
          {submitError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm font-medium">
                {submitError}
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email cadastrado
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  autoFocus
                  className={`pl-10 transition-colors ${
                    errors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'focus:border-primary focus:ring-primary'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 mt-0.5">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Como funciona:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Enviamos um link seguro para seu email</li>
                    <li>• Clique no link para criar uma nova senha</li>
                    <li>• O link expira em 24 horas por segurança</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-black hover:bg-gray-800 active:bg-gray-900 text-white font-medium transition-all duration-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando email...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Link de Recuperação
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500 font-medium">
                ou
              </span>
            </div>
          </div>

          {/* Back to Login */}
          <div className="text-center space-y-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline font-medium transition-colors focus:outline-none focus:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </Link>

            <p className="text-xs text-gray-500">
              Não tem uma conta?{' '}
              <Link
                to="/register"
                className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </LayoutBase>
  );
};

export default ForgotPassword;
