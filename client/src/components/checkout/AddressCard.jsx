import { motion } from 'framer-motion';
import { CheckCircle, Loader2, MapPin, Pencil } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import AddressDialog from '../user/Addresses';

const AddressCard = ({
  address,
  loading,
  onAddressUpdated,
  onNavigateToAccount,
  isInCheckout,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, duration: 0.3 }}
    className="bg-white p-6 rounded-lg shadow-sm border"
  >
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <MapPin size={18} className="text-primary" />
        Endereço de entrega
      </h2>
    </div>

    {loading ? (
      <div className="h-32 flex flex-col items-center justify-center p-8">
        <Loader2 size={24} className="animate-spin text-primary mb-2" />
        <p className="text-sm text-gray-500">Carregando seu endereço...</p>
      </div>
    ) : !address ? (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-gray-600 font-medium">
          Nenhum endereço configurado
        </p>
        <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1 mb-4">
          Adicione um endereço para continuar com a compra
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <AddressDialog
            address={null}
            onAddressUpdated={onAddressUpdated}
            isEditing={false}
            isInCheckout={isInCheckout}
            customButton={
              <Button className="bg-primary hover:bg-primary/90">
                <MapPin size={16} className="mr-2" />
                Adicionar endereço
              </Button>
            }
          />
          <Button variant="outline" onClick={onNavigateToAccount}>
            Ir para minha conta
          </Button>
        </div>
      </div>
    ) : (
      <div className="border rounded-lg p-5 bg-primary/5 relative">
        <div className="flex justify-between">
          <div className="flex-grow pr-4">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-medium">
                {address.type || 'Endereço de Entrega'}
              </h3>
              <Badge
                variant="outline"
                className="bg-primary/20 border-primary/30"
              >
                Padrão
              </Badge>
            </div>

            <div className="space-y-1 text-sm">
              <p>
                {address.street}, {address.number}
                {address.complement && ` - ${address.complement}`}
              </p>
              <p>{address.neighborhood}</p>
              <p>
                {address.city} - {address.state}
              </p>
              <p className="text-gray-500">CEP: {address.zipCode}</p>
            </div>

            <div className="mt-4 flex items-center">
              <CheckCircle size={14} className="text-green-500 mr-2" />
              <span className="text-xs text-gray-600">
                Endereço válido para entrega
              </span>
            </div>
          </div>

          <AddressDialog
            address={address}
            onAddressUpdated={onAddressUpdated}
            isEditing={true}
            isInCheckout={isInCheckout}
            customButton={
              <Button variant="outline" size="sm" className="text-xs gap-1 h-8">
                <Pencil size={14} />
                Editar
              </Button>
            }
          />
        </div>
      </div>
    )}
  </motion.div>
);

export default AddressCard;
