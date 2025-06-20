import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { profileSchema } from '@/schemas/profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Edit, Mail, Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

const ProfileDialog = ({ onUserUpdated, userData }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
    mode: 'onChange',
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty, isValid },
  } = form;

  useEffect(() => {
    if (userData?.data && open) {
      const profileData = {
        name: userData.data.name || '',
        email: userData.data.email || '',
        phone: userData.data.phone || '',
      };
      reset(profileData);
    }
  }, [userData, open, reset]);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        if (userData?.data) {
          reset({
            name: userData.data.name || '',
            email: userData.data.email || '',
            phone: userData.data.phone || '',
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, userData, reset]);

  const formatPhone = (value) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      console.log('📝 Dados do formulário:', data);

      const result = await onUserUpdated(data);

      if (result !== false) {
        setOpen(false);

        toast({
          title: 'Perfil atualizado!',
          description: 'Suas informações foram atualizadas com sucesso.',
        });
      } else {
        toast({
          title: 'Erro ao atualizar',
          description: 'Não foi possível atualizar suas informações.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);

      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData?.data) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Edit size={16} className="mr-2" />
        Carregando...
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-blue-50 hover:text-blue-700 transition-colors"
        >
          <Edit size={16} className="mr-2" />
          Editar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            Editar Perfil
          </DialogTitle>
          <DialogDescription>
            Atualize suas informações pessoais. Os campos marcados com * são
            obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Nome */}
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User size={16} className="text-gray-500" />
                    Nome completo *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Seu nome completo"
                      {...field}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-500" />
                    Email *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      {...field}
                      disabled
                      className="bg-gray-50 cursor-not-allowed"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <AlertCircle size={12} />O email não pode ser alterado após
                    o cadastro
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Telefone */}
            <FormField
              control={control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-500" />
                    Telefone
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(XX) XXXXX-XXXX"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        field.onChange(formatted);
                      }}
                      maxLength={15}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status de validação */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 text-sm font-medium mb-2">
                  <AlertCircle size={16} />
                  Corrija os erros abaixo:
                </div>
                <ul className="text-red-600 text-sm space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field} className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full" />
                      {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter className="gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !isDirty || !isValid}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Salvando...
                  </div>
                ) : (
                  'Salvar alterações'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
