import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

const AddToCartDialog = ({
  open,
  onOpenChange,
  sneaker,
  onComplete = () => {},
}) => {
  const { addItem } = useCart();
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Reset selections when sneaker changes
  useEffect(() => {
    if (sneaker) {
      setSelectedColor('');
      setSelectedSize('');
      setQuantity(1);
    }
  }, [sneaker]);

  // Verificar se uma cor está disponível (tem pelo menos um tamanho com estoque)
  const isColorAvailable = (color) => {
    if (!sneaker) return false;

    // Regra simples: cor só está disponível se tiver pelo menos uma variante com estoque
    if (sneaker.variants && sneaker.variants.length > 0) {
      return sneaker.variants.some(
        (v) => v.color === color && v.stock > 0 && v.isActive !== false
      );
    }

    // Se não tem variantes definidas, nenhuma cor está realmente disponível
    return false;
  };

  // Verificar se um tamanho está disponível para a cor selecionada
  const isSizeAvailable = (size) => {
    if (!sneaker || !selectedColor) return false;

    // Regra simples: tamanho só está disponível se existir uma variante
    // com este tamanho, esta cor e com estoque > 0
    if (sneaker.variants && sneaker.variants.length > 0) {
      return sneaker.variants.some(
        (v) =>
          v.color === selectedColor &&
          v.size === parseInt(size, 10) &&
          v.stock > 0 &&
          v.isActive !== false
      );
    }

    // Se não tem variantes definidas, nenhum tamanho está disponível
    return false;
  };

  const handleAddToCartConfirm = () => {
    if (!sneaker) return;

    // Validações
    if (!selectedColor) {
      toast({ title: 'Selecione uma cor', variant: 'destructive' });
      return;
    }
    if (!selectedSize) {
      toast({ title: 'Selecione um tamanho', variant: 'destructive' });
      return;
    }

    // Verificar disponibilidade
    if (!isSizeAvailable(selectedSize)) {
      toast({
        title: 'Tamanho ou estoque indisponível',
        description: 'Este item não está disponível na combinação selecionada',
        variant: 'destructive',
      });
      return;
    }

    // Encontrar variante se existir
    let variantData = null;
    let finalPrice = sneaker.finalPrice;
    let variantId = `${sneaker._id}-${selectedColor}-${selectedSize}`;

    if (sneaker.variants && sneaker.variants.length > 0) {
      variantData = sneaker.variants.find(
        (v) =>
          v.color === selectedColor && v.size === parseInt(selectedSize, 10)
      );

      if (variantData) {
        finalPrice = variantData.finalPrice || sneaker.finalPrice;
        variantId = variantData._id || variantData.id || variantId;
      }
    }

    // Adicionar ao carrinho
    addItem({
      sneakerId: sneaker._id,
      variantId: variantId,
      name: sneaker.name,
      price: finalPrice,
      originalPrice: sneaker.basePrice,
      size: parseInt(selectedSize, 10),
      color: selectedColor,
      colorName: variantData?.colorName || selectedColor,
      quantity: quantity,
      image: sneaker.coverImage?.url,
      brand: sneaker.brand?.name || '',
      slug: sneaker.slug,
    });

    // Feedback e finalização
    toast({
      title: 'Item adicionado ao carrinho',
      description: `${sneaker.name} adicionado ao carrinho`,
    });

    onComplete();
    onOpenChange(false);
  };

  if (!sneaker) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escolha a cor, tamanho e quantidade</DialogTitle>
        </DialogHeader>

        <div>
          {/* Seleção de cor */}
          <div className="mb-4">
            <span className="font-medium">Cor:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {/* Mostrar TODAS as cores disponíveis no modelo */}
              {(sneaker.availableColors || []).map((colorObj) => {
                const color = colorObj.color;
                const available = isColorAvailable(color);

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      if (available) {
                        setSelectedColor(color);
                        setSelectedSize(''); // Reset o tamanho quando mudar de cor
                      }
                    }}
                    disabled={!available}
                    className={`px-4 py-2 rounded-md border relative overflow-hidden ${
                      selectedColor === color
                        ? 'border-primary bg-primary/10 text-primary'
                        : available
                        ? 'border-gray-300 hover:border-gray-400'
                        : 'border-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                    aria-label={`Cor ${colorObj.colorName || color}${
                      !available ? ' (indisponível)' : ''
                    }`}
                  >
                    {!available && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(to right bottom, transparent calc(50% - 1px), #e5e7eb, transparent calc(50% + 1px))',
                        }}
                      />
                    )}
                    <span className="relative z-10">
                      {colorObj.colorName || color}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seleção de tamanho */}
          <div className="mb-4">
            <span className="font-medium">Tamanhos:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {/* Mostrar TODOS os tamanhos disponíveis no modelo */}
              {(sneaker.availableSizes || []).map((size) => {
                const available = selectedColor && isSizeAvailable(size);

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      if (available) {
                        setSelectedSize(String(size));
                      }
                    }}
                    disabled={!available}
                    className={`w-12 h-12 rounded-md border relative overflow-hidden ${
                      selectedSize === String(size)
                        ? 'border-primary bg-primary/10 text-primary'
                        : available
                        ? 'border-gray-300 hover:border-gray-400'
                        : 'border-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                    aria-label={`Tamanho ${size}${
                      !available ? ' (indisponível)' : ''
                    }`}
                  >
                    {(!selectedColor || !available) && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(to right bottom, transparent calc(50% - 1px), #e5e7eb, transparent calc(50% + 1px))',
                        }}
                      />
                    )}
                    <span className="relative z-10">{size}</span>
                  </button>
                );
              })}

              {selectedColor &&
                !sneaker.availableSizes?.some((size) =>
                  isSizeAvailable(size)
                ) && (
                  <p className="text-sm text-gray-500">
                    Nenhum tamanho disponível para esta cor
                  </p>
                )}
            </div>
          </div>

          {/* Quantidade */}
          <div className="mb-4">
            <span className="font-medium">Quantidade:</span>
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Diminuir quantidade"
              >
                -
              </Button>
              <span className="w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Aumentar quantidade"
              >
                +
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAddToCartConfirm}
            disabled={!selectedColor || !selectedSize}
            className="w-full"
          >
            Adicionar ao carrinho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCartDialog;
