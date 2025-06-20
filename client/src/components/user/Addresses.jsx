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
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, MapPin, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addressSchema } from '@/schemas/address';

const AddressDialog = ({
  address,
  onAddressUpdated,
  onAddressDeleted,
  customButton,
  isEditing = false,
  isInCheckout = false,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const form = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: 'Residencial',
      isDefault: false,
      recipient: '',
      phoneNumber: '',
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      reference: '',
    },
  });

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = form;

  const watchedZipCode = watch('zipCode');

  useEffect(() => {
    if (isEditing && address) {
      const addressData = {
        type: address.type || 'Residencial',
        isDefault: address.isDefault === true || address.isDefault === 'true',
        recipient: address.recipient || '',
        phoneNumber: address.phoneNumber || '',
        zipCode: address.zipCode || '',
        street: address.street || '',
        number: address.number || '',
        complement: address.complement || '',
        neighborhood: address.neighborhood || '',
        city: address.city || '',
        state: address.state || '',
        reference: address.reference || '',
      };
      reset(addressData);
    }
  }, [address, isEditing, reset]);

  useEffect(() => {
    if (!open && !isEditing) {
      reset();
    }
  }, [open, isEditing, reset]);

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatZipCode = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const fetchAddressByCep = async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      setIsFetchingCep(true);
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCep}/json/`
      );
      const data = await response.json();

      if (!data.erro) {
        if (data.logradouro) setValue('street', data.logradouro);
        if (data.bairro) setValue('neighborhood', data.bairro);
        if (data.localidade) setValue('city', data.localidade);
        if (data.uf) setValue('state', data.uf);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: 'Erro ao buscar CEP',
        description: 'Tente novamente ou preencha manualmente.',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingCep(false);
    }
  };

  useEffect(() => {
    if (watchedZipCode) {
      const cleanCep = watchedZipCode.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        fetchAddressByCep(cleanCep);
      }
    }
  }, [watchedZipCode]);

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const result = isEditing
        ? await onAddressUpdated(address._id, data, isEditing)
        : await onAddressUpdated(null, data, isEditing);

      if (result !== false) {
        setOpen(false);
        toast({
          title: isEditing ? 'Endereço atualizado!' : 'Endereço adicionado!',
          description: `Endereço ${
            isEditing ? 'atualizado' : 'adicionado'
          } com sucesso.`,
        });

        if (!isEditing) {
          reset();
        }
      }
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      toast({
        title: 'Erro',
        description: `Não foi possível ${
          isEditing ? 'atualizar' : 'adicionar'
        } o endereço.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!address?._id) return;

    setIsLoading(true);
    try {
      const result = await onAddressDeleted(address._id);

      if (result !== false) {
        setDeleteDialogOpen(false);
        toast({
          title: 'Endereço excluído!',
          description: 'Endereço removido com sucesso.',
        });
      }
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o endereço.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="max-sm:p-0" asChild>
          {customButton ? (
            customButton
          ) : isEditing ? (
            <Button variant="ghost" size="sm">
              <Edit size={16} />
            </Button>
          ) : (
            <Button variant="ghost" size="sm">
              <MapPin size={16} />
              Adicionar
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Endereço' : 'Adicionar Novo Endereço'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Atualize as informações do endereço selecionado.'
                : 'Preencha os dados para adicionar um novo endereço de entrega.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
              {/* Linha 1: Destinatário e Telefone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do destinatário *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome de quem receberá" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone de contato *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(XX) XXXXX-XXXX"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            field.onChange(formatted);
                          }}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Linha 2: CEP e Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="00000-000"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatZipCode(e.target.value);
                              field.onChange(formatted);
                            }}
                            maxLength={9}
                          />
                          {isFetchingCep && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de endereço</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Residencial">
                            Residencial
                          </SelectItem>
                          <SelectItem value="Comercial">Comercial</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Linha 3: Rua e Número */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={control}
                  name="street"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Rua *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome da rua"
                          {...field}
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número *</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Linha 4: Complemento e Bairro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="complement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Apto, Bloco, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome do bairro"
                          {...field}
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Linha 5: Cidade e Estado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Cidade *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome da cidade"
                          {...field}
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="UF"
                          {...field}
                          maxLength={2}
                          className="bg-gray-50 uppercase"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Linha 6: Referência */}
              <FormField
                control={control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ponto de referência</FormLabel>
                    <FormControl>
                      <Input placeholder="Próximo a..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checkbox Endereço Padrão */}
              <FormField
                control={control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Definir como endereço padrão</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Este endereço será usado por padrão nas suas compras.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || isFetchingCep}>
                  {isLoading ? 'Salvando...' : 'Salvar endereço'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Botão de exclusão */}
      {isEditing && !isInCheckout && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 size={16} />
          </Button>

          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente
                  este endereço.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isLoading ? 'Excluindo...' : 'Sim, excluir endereço'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
};

export default AddressDialog;
