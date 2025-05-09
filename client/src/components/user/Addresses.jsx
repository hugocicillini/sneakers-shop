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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, MapPin, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const [formData, setFormData] = useState({
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
  });

  // Carregar endereço existente se estiver em modo de edição
  useEffect(() => {
    if (isEditing && address) {
      const isDefaultValue =
        address.isDefault === true || address.isDefault === 'true';

      setFormData({
        type: address.type || 'Residencial',
        isDefault: isDefaultValue,
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
      });
    }
  }, [address, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      isDefault: checked,
    }));
  };

  // Função para buscar CEP
  const fetchAddressByCep = async (cep) => {
    if (cep.length < 8) return;

    try {
      setIsLoading(true);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleZipCodeChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      zipCode: value,
    }));

    // Se tem 8 dígitos (CEP completo), busca automaticamente
    if (value.replace(/\D/g, '').length === 8) {
      fetchAddressByCep(value.replace(/\D/g, ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Chamar a função de callback fornecida pelo componente pai
      isEditing
        ? await onAddressUpdated(address._id, formData, isEditing)
        : await onAddressUpdated(null, formData, isEditing);

      // Fechar o diálogo após o sucesso
      setOpen(false);
      setFormData({
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
      });
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      toast({
        title: 'Erro',
        description: `Não foi possível ${
          isEditing ? 'atualizar' : 'adicionar'
        } o endereço. ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!address || !address._id) return;

    setIsLoading(true);
    try {
      // Chamar a função de callback de exclusão fornecida pelo componente pai
      await onAddressDeleted(address._id);

      // Fechar o diálogo de confirmação
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      toast({
        title: 'Erro',
        description: `Não foi possível excluir o endereço. ${error.message}`,
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

        <DialogContent className="sm:max-w-[600px]">
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

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Nome do destinatário</Label>
                <Input
                  id="recipient"
                  name="recipient"
                  value={formData.recipient}
                  onChange={handleChange}
                  placeholder="Nome de quem receberá"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Telefone de contato</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="(XX) XXXXX-XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleZipCodeChange}
                  placeholder="00000-000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de endereço</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Residencial">Residencial</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  name="street"
                  disabled
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="Nome da rua"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  placeholder="123"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  name="complement"
                  value={formData.complement}
                  onChange={handleChange}
                  placeholder="Apto, Bloco, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  name="neighborhood"
                  disabled
                  value={formData.neighborhood}
                  onChange={handleChange}
                  placeholder="Nome do bairro"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  name="city"
                  disabled
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Nome da cidade"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  name="state"
                  disabled
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="UF"
                  required
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Ponto de referência</Label>
                <Input
                  id="reference"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  placeholder="Próximo a..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isDefault"
                checked={Boolean(formData.isDefault)}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="isDefault">Definir como endereço padrão</Label>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar endereço'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Botão de exclusão (apenas visível no modo de edição) */}
      {isEditing && (
        <>
          {!isInCheckout ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </Button>
          ) : null}

          {/* Diálogo de confirmação para exclusão */}
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
