import Wishlist from '../models/wishlist.js';
import logger from '../utils/logger.js';

export const getUserWishlist = async (req, res, next) => {
  try {
    const userId = req.user._id;

    let wishlist = await Wishlist.findOne({ user: userId })
      .populate({
        path: 'sneakers.sneaker',
        model: 'Sneaker',
        select: '-relatedSneakers -category -tags ',
        populate: [
          {
            path: 'variants',
            model: 'SneakerVariant',
          },
          {
            path: 'brand',
            model: 'Brand',
            select: 'name',
          },
        ],
      })
      .select('-__v -createdAt -updatedAt -user');

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        data: { sneakers: [] },
      });
    }

    res.status(200).json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    logger.error(`Erro ao buscar wishlist: ${error.message}`);
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { sneakerId } = req.body;

    if (!sneakerId) {
      return res.status(400).json({
        success: false,
        message: 'ID do tênis é obrigatório',
      });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        sneakers: [{ sneaker: sneakerId }],
      });
      await wishlist.save();
      logger.info(`Nova wishlist criada para usuário ${userId}`);
    } else {
      await wishlist.addSneaker(sneakerId);
      logger.info(
        `Tênis ${sneakerId} adicionado à wishlist do usuário ${userId}`
      );
    }

    wishlist = await Wishlist.findOne({ user: userId }).populate(
      'sneakers.sneaker'
    );

    res.status(200).json({
      success: true,
      message: 'Tênis adicionado à wishlist com sucesso',
      data: wishlist,
    });
  } catch (error) {
    logger.error(`Erro ao adicionar à wishlist: ${error.message}`);
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { sneakerId } = req.params;

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist não encontrada',
      });
    }

    await wishlist.removeSneaker(sneakerId);
    logger.info(`Tênis ${sneakerId} removido da wishlist do usuário ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Tênis removido da wishlist com sucesso',
    });
  } catch (error) {
    logger.error(`Erro ao remover da wishlist: ${error.message}`);
    next(error);
  }
};

export const clearWishlist = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist não encontrada',
      });
    }

    wishlist.sneakers = [];
    await wishlist.save();
    logger.info(`Wishlist do usuário ${userId} foi esvaziada`);

    res.status(200).json({
      success: true,
      message: 'Wishlist esvaziada com sucesso',
    });
  } catch (error) {
    logger.error(`Erro ao limpar wishlist: ${error.message}`);
    next(error);
  }
};
