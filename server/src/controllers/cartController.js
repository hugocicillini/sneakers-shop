import { Cart } from '../models/cartModel.js';
import { Sneakers } from '../models/sneakersModel.js';

// Adicionar item ao carrinho
export const addToCart = async (req, res) => {
  try {
    const { sneakerId, quantity } = req.body;

    const sneaker = await Sneakers.findById(sneakerId);
    if (!sneaker) {
      return res.status(404).json({ message: 'Sneaker not found' });
    }

    if (!req.user) {
      return res.status(200).json({
        message: 'Item added to cart (local storage)',
        sneakerId,
        quantity,
      });
    }

    // Usuário autenticado: salva no banco
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.sneaker.toString() === sneakerId
    );

    if (existingItem) {
      existingItem.quantity = quantity;
    } else {
      cart.items.push({ sneaker: sneakerId, quantity });
    }

    // Atualiza o preço total
    let total = 0;
    for (const item of cart.items) {
      const sneakerItem = await Sneakers.findById(item.sneaker);
      if (sneakerItem) {
        total += sneakerItem.price * item.quantity;
      }
    }
    cart.totalPrice = total;

    await cart.save();

    // Popula os dados do sneaker para resposta mais rica
    await cart.populate('items.sneaker');

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error adding to cart', error });
  }
};

// Obter itens do carrinho
export const getCart = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json({ message: 'Cart is managed locally' });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error });
  }
};

// Remover item do carrinho
export const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;

    // Lógica para usuários não logados
    if (!req.user) {
      return res.status(200).json({
        message: 'Item removed from cart (local storage)',
        itemId: id,
      });
    }

    // Lógica para usuários logados
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.sneaker.toString() === id
    );
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1); // Remove o item do array

    if (cart.items.length === 0) {
      const removeCart = await Cart.deleteOne({ user: req.user.id });
      return res.status(200).json({ message: 'Cart removed', removeCart });
    }

    // Atualiza o preço total
    let total = 0;
    for (const item of cart.items) {
      const sneakerItem = await Sneakers.findById(item.sneaker);
      if (sneakerItem) {
        total += sneakerItem.price * item.quantity;
      }
    }
    cart.totalPrice = total;

    await cart.save();
    await cart.populate('items.sneaker');

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Error removing from cart', error });
  }
};
