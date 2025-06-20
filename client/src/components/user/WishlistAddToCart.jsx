import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import {
  Minus,
  Package,
  Palette,
  Plus,
  Ruler,
  ShoppingCart,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
  const [maxQuantity, setMaxQuantity] = useState(1);

  const availableColors = useMemo(() => {
    if (!sneaker?.availableColors) return [];
    return sneaker.availableColors.filter((colorObj) => {
      const color = colorObj.color || colorObj;
      return sneaker.variants?.some(
        (v) => v.color === color && v.stock > 0 && v.isActive !== false
      );
    });
  }, [sneaker]);

  const availableSizesForColor = useMemo(() => {
    if (!sneaker?.availableSizes || !selectedColor) return [];
    return sneaker.availableSizes.filter((size) => {
      return sneaker.variants?.some(
        (v) =>
          v.color === selectedColor &&
          v.size === parseInt(size, 10) &&
          v.stock > 0 &&
          v.isActive !== false
      );
    });
  }, [sneaker, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (!sneaker?.variants || !selectedColor || !selectedSize) return null;
    return sneaker.variants.find(
      (v) => v.color === selectedColor && v.size === parseInt(selectedSize, 10)
    );
  }, [sneaker, selectedColor, selectedSize]);

  const resetSelections = useCallback(() => {
    setSelectedColor('');
    setSelectedSize('');
    setQuantity(1);
    setMaxQuantity(1);
  }, []);

  useEffect(() => {
    if (sneaker) {
      resetSelections();
    }
  }, [sneaker, resetSelections]);

  useEffect(() => {
    if (selectedVariant) {
      const maxStock = Math.min(selectedVariant.stock, 10);
      setMaxQuantity(maxStock);
      setQuantity((prev) => Math.min(prev, maxStock));
    }
  }, [selectedVariant]);

  useEffect(() => {
    if (selectedColor) {
      setSelectedSize('');
      setQuantity(1);
    }
  }, [selectedColor]);

  const handleColorSelect = useCallback((color) => {
    setSelectedColor(color);
  }, []);

  const handleSizeSelect = useCallback((size) => {
    setSelectedSize(String(size));
  }, []);

  const handleQuantityChange = useCallback(
    (delta) => {
      setQuantity((prev) => {
        const newQuantity = prev + delta;
        return Math.min(Math.max(1, newQuantity), maxQuantity);
      });
    },
    [maxQuantity]
  );

  const handleAddToCartConfirm = useCallback(() => {
    if (!sneaker) {
      toast({
        title: 'Erro',
        description: 'Produto não encontrado',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedColor) {
      toast({
        title: 'Selecione uma cor',
        description: 'Escolha uma cor disponível para continuar',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedSize) {
      toast({
        title: 'Selecione um tamanho',
        description: 'Escolha um tamanho disponível para continuar',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedVariant) {
      toast({
        title: 'Combinação indisponível',
        description: 'Esta combinação de cor e tamanho não está disponível',
        variant: 'destructive',
      });
      return;
    }

    if (quantity > selectedVariant.stock) {
      toast({
        title: 'Quantidade indisponível',
        description: `Apenas ${selectedVariant.stock} unidades em estoque`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const itemData = {
        sneakerId: sneaker._id,
        variantId:
          selectedVariant._id ||
          selectedVariant.id ||
          `${sneaker._id}-${selectedColor}-${selectedSize}`,
        name: sneaker.name,
        price:
          selectedVariant.finalPrice || sneaker.finalPrice || sneaker.basePrice,
        originalPrice: selectedVariant.basePrice || sneaker.basePrice,
        size: parseInt(selectedSize, 10),
        color: selectedColor,
        colorName: selectedVariant.colorName || selectedColor,
        quantity: quantity,
        image: sneaker.coverImage?.url || '/placeholder-image.jpg',
        brand: sneaker.brand?.name || '',
        slug: sneaker.slug,
        stock: selectedVariant.stock,
      };

      addItem(itemData);

      toast({
        title: 'Adicionado ao carrinho! 🛒',
        description: `${quantity}x ${sneaker.name} (${selectedColor}, tam. ${selectedSize})`,
      });

      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast({
        title: 'Erro ao adicionar',
        description: 'Não foi possível adicionar o item ao carrinho',
        variant: 'destructive',
      });
    }
  }, [
    sneaker,
    selectedColor,
    selectedSize,
    selectedVariant,
    quantity,
    addItem,
    onComplete,
    onOpenChange,
  ]);

  if (!sneaker) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Produto não encontrado</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isValid = selectedColor && selectedSize && selectedVariant;
  const finalPrice =
    selectedVariant?.finalPrice || sneaker.finalPrice || sneaker.basePrice;
  const hasDiscount = selectedVariant?.basePrice > finalPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Adicionar ao Carrinho
          </DialogTitle>
          <DialogDescription>
            Escolha cor, tamanho e quantidade para{' '}
            <strong>{sneaker.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Imagem e preço */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <img
              src={sneaker.coverImage?.url || '/placeholder-image.jpg'}
              alt={sneaker.name}
              className="w-16 h-16 object-cover rounded-lg"
              loading="lazy"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 line-clamp-1">
                {sneaker.name}
              </h4>
              <p className="text-sm text-gray-500">{sneaker.brand?.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-bold text-lg text-primary">
                  R$ {finalPrice?.toFixed(2).replace('.', ',') || '0,00'}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-gray-500 line-through">
                    R${' '}
                    {selectedVariant.basePrice?.toFixed(2).replace('.', ',') ||
                      '0,00'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Seleção de cor */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Cor:</span>
              {selectedColor && (
                <Badge variant="secondary" className="text-xs">
                  {availableColors.find((c) => (c.color || c) === selectedColor)
                    ?.colorName || selectedColor}
                </Badge>
              )}
            </div>

            {availableColors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableColors.map((colorObj) => {
                  const color = colorObj.color || colorObj;
                  const colorName = colorObj.colorName || color;
                  const isSelected = selectedColor === color;

                  return (
                    <Button
                      key={color}
                      variant="outline"
                      onClick={() => handleColorSelect(color)}
                      className={`${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      aria-label={`Selecionar cor ${colorName}`}
                    >
                      {colorName}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-2">
                Nenhuma cor disponível
              </p>
            )}
          </div>

          {/* Seleção de tamanho */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Ruler className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Tamanho:</span>
              {selectedSize && (
                <Badge variant="secondary" className="text-xs">
                  {selectedSize}
                </Badge>
              )}
            </div>

            {selectedColor ? (
              availableSizesForColor.length > 0 ? (
                <div className="grid grid-cols-6 gap-2">
                  {availableSizesForColor.map((size) => {
                    const isSelected = selectedSize === String(size);
                    const variant = sneaker.variants?.find(
                      (v) =>
                        v.color === selectedColor &&
                        v.size === parseInt(size, 10)
                    );
                    const stock = variant?.stock || 0;

                    return (
                      <Button
                        key={size}
                        variant="outline"
                        onClick={() => handleSizeSelect(size)}
                        className={`${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        aria-label={`Selecionar tamanho ${size}`}
                        title={`Tamanho ${size} - ${stock} em estoque`}
                      >
                        <div className="flex flex-col items-center justify-center p-2">
                          <span className="font-medium">{size}</span>
                          {stock <= 3 && (
                            <span className="text-xs text-orange-500">
                              {stock}
                            </span>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">
                  Nenhum tamanho disponível para esta cor
                </p>
              )
            ) : (
              <p className="text-sm text-gray-400 py-2">
                Selecione uma cor primeiro
              </p>
            )}
          </div>

          {/* Seleção de quantidade */}
          {selectedVariant && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Quantidade:</span>
                <Badge variant="outline" className="text-xs">
                  {selectedVariant.stock} disponível
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <div className="flex items-center justify-center w-16 h-10 border border-gray-200 rounded-md">
                  <span className="font-medium">{quantity}</span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= maxQuantity}
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="h-4 w-4" />
                </Button>

                <span className="text-sm text-gray-500">
                  (máx: {maxQuantity})
                </span>
              </div>
            </div>
          )}

          {/* Resumo */}
          {isValid && (
            <div className="bg-primary/5 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="text-xl font-bold text-primary">
                  R$ {(finalPrice * quantity).toFixed(2).replace('.', ',')}
                </span>
              </div>
              {quantity > 1 && (
                <p className="text-sm text-gray-600 mt-1">
                  {quantity}x R$ {finalPrice.toFixed(2).replace('.', ',')}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddToCartConfirm}
            disabled={!isValid}
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCartDialog;
