import { Favorite } from '../models/favoriteModel.js';
import { Sneakers } from '../models/sneakersModel.js';

// Adicionar um tênis aos favoritos
export const addFavorite = async (req, res) => {
  try {
    const { sneakerId } = req.body;

    // Verifica se o usuário está autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const existingSneaker = await Sneakers.findById(sneakerId);

    if (!existingSneaker) {
      return res.status(404).json({ message: 'Sneaker not found' });
    }

    const userId = req.user.id;

    let favorite = await Favorite.findOne({ user: userId });

    if (!favorite) {
      favorite = new Favorite({ user: userId, sneakers: [sneakerId] });
    } else {
      if (!favorite.sneakers.includes(sneakerId)) {
        favorite.sneakers.push(sneakerId);
      }
    }

    await favorite.save();

    res.status(200).json(favorite);
  } catch (error) {
    res.status(500).json({ message: 'Error adding to favorites', error });
  }
};

// Obtém todos os favoritos

export const getAllFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find();

    if (!favorites) {
      return res.status(404).json({ message: 'No favorites found' });
    }

    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorites', error });
  }
};

// Obtém os favoritos do usuário
export const getFavoritesById = async (req, res) => {
  try {
    const favorite = await Favorite.find({ user: req.user.id });

    if (!favorite) {
      return res.status(404).json({ message: 'No favorites found' });
    }

    res.status(200).json(favorite);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorites', error });
  }
};

// Remover um tênis dos favoritos
export const removeFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    const favorite = await Favorite.findOne({ user: req.user.id });

    if (!favorite) {
      return res.status(404).json({ message: 'No favorites found' });
    }

    const index = favorite.sneakers.indexOf(id);
    if (index === -1) {
      return res.status(404).json({ message: 'Sneaker not in favorites' });
    }

    favorite.sneakers.splice(index, 1);

    if (favorite.sneakers.length === 0) {
      await Favorite.deleteOne({ _id: favorite._id });
      return res
        .status(200)
        .json({ message: 'Favorite list deleted as it was empty' });
    }

    await favorite.save();

    res.status(200).json(favorite);
  } catch (error) {
    res.status(500).json({ message: 'Error removing from favorites', error });
  }
};
