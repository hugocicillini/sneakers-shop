import { Sneakers } from '../models/sneakersModel.js';
import { SneakersVariant } from '../models/sneakersVariantModel.js';

import '../models/reviewModel.js'; // Apenas registra o modelo no Mongoose

export const getSneakers = async (req, res) => {
  try {
    let filter = { isActive: true }; // Por padrão, retornar apenas produtos ativos

    // Filtro por texto (busca em nome ou marca)
    if (req.query.search && req.query.search !== 'All') {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter = {
        $or: [{ brand: searchRegex }, { name: searchRegex }],
      };
    }

    // Filtro específico por marca
    if (req.query.brand) {
      filter.brand = new RegExp(req.query.brand, 'i');
    }

    // Filtro por tamanhos
    if (req.query.sizes) {
      const sizes = req.query.sizes.split(',').map((size) => parseInt(size));
      filter.sizes = { $in: sizes };
    }

    // Filtro por cores
    if (req.query.colors) {
      const colors = req.query.colors.split(',');
      filter.colors = { $in: colors };
    }

    // Novo filtro por gênero
    if (req.query.gender) {
      const genders = req.query.gender.split(',');
      filter.gender = { $in: genders };
    }

    // Novo filtro por tags
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      filter.tags = { $in: tags };
    }

    // Filtro por faixa de preço
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};

      if (req.query.minPrice) {
        filter.price.$gte = parseFloat(req.query.minPrice);
      }

      if (req.query.maxPrice) {
        filter.price.$lte = parseFloat(req.query.maxPrice);
      }
    }

    // Adicionar opção para exibir produtos inativos para admins
    if (req.query.showInactive === 'true' && req.user?.isAdmin) {
      delete filter.isActive;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Opções de ordenação
    const sortOptions = {};
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case 'price_asc':
          sortOptions.price = 1;
          break;
        case 'price_desc':
          sortOptions.price = -1;
          break;
        case 'newest':
          sortOptions.createdAt = -1;
          break;
        case 'popular':
          sortOptions.rating = -1;
          break;
        case 'discount_desc':
          sortOptions.discount = -1; // Ordem decrescente para maiores descontos primeiro
          break;
        case 'relevance': // Nova opção de relevância para o padrão
          sortOptions.isFeatured = -1; // Primeiro produtos em destaque
          sortOptions.rating = -1; // Depois por melhor avaliação
          break;
        default:
          sortOptions.createdAt = -1;
      }
    }

    const total = await Sneakers.countDocuments(filter);
    const sneakers = await Sneakers.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('-description'); // Excluir descrição completa para economizar largura de banda

    return res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: sneakers,
    });
  } catch (error) {
    console.error('Erro ao buscar sneakers:', error);
    res.status(500).json({ message: 'Error fetching sneakers', error });
  }
};

export const getSneakerById = async (req, res) => {
  try {
    const { id } = req.params;


    const sneaker = await Sneakers.findById(id)
      .populate({
        path: 'variants',
        select: '-createdAt -updatedAt',
        match: { isActive: true },
      })
      .populate({
        path: 'reviews',
        select: 'rating comment user date',
        options: { sort: { date: -1 }, limit: 5 },
      });

    if (!sneaker) {
      return res.status(404).json({ message: 'Sneaker not found!' });
    }

    return res.status(200).json(sneaker);
  } catch (error) {
    console.error('Erro ao buscar sneaker:', error);
    res.status(500).json({ message: 'Error fetching sneaker', error });
  }
};

// Quando buscar detalhes de um sneaker específico, limitar a 5 reviews iniciais
export const getSneakerBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Usar o populate para carregar variantes e reviews
    const sneaker = await Sneakers.findOne({ slug: slug }) // Corrigido: passando um objeto de consulta
      .populate({
        path: 'variants', // Corrigido de 'variant' para 'variants'
        select: '-createdAt -updatedAt', // Excluir campos desnecessários
        match: { isActive: true }, // Apenas variantes ativas
      })
      .populate({
        path: 'reviews', // Corrigido de 'review' para 'reviews'
        select: 'rating comment user date',
        options: { sort: { date: -1 }, limit: 5 }, // Limita a 5 reviews iniciais
      });

    if (!sneaker) {
      return res.status(404).json({ message: 'Sneaker not found!' });
    }

    return res.status(200).json(sneaker);
  } catch (error) {
    console.error('Erro ao buscar sneaker:', error);
    res.status(500).json({ message: 'Error fetching sneaker', error });
  }
};

export const createSneakers = async (req, res) => {
  try {
    const { sneakerData, variants } = req.body;

    // Criar o tênis principal
    const newSneaker = new Sneakers(sneakerData);
    await newSneaker.save();

    // Criar variantes se existirem
    if (variants && Array.isArray(variants)) {
      const variantPromises = variants.map((variant) => {
        const newVariant = new SneakersVariant({
          ...variant,
          sneaker: newSneaker._id,
        });
        return newVariant.save();
      });

      await Promise.all(variantPromises);
    }

    // Recuperar o tênis com as variantes para retornar na resposta
    const createdSneaker = await Sneakers.findById(newSneaker._id).populate(
      'variants'
    );

    res.status(201).json(createdSneaker);
  } catch (error) {
    console.error('Erro ao criar sneaker:', error);
    res.status(500).send({
      message: error.message,
      success: false,
    });
  }
};

export const updateSneaker = async (req, res) => {
  try {
    const { id } = req.params;
    const { sneakerData, variants } = req.body;

    // Atualizar dados do tênis
    const updatedSneaker = await Sneakers.findByIdAndUpdate(id, sneakerData, {
      new: true,
      runValidators: true,
    });

    if (!updatedSneaker) {
      return res.status(404).json({ message: 'Sneaker not found' });
    }

    // Atualizar variantes existentes e adicionar novas
    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        if (variant._id) {
          // Atualizar variante existente
          await SneakersVariant.findByIdAndUpdate(
            variant._id,
            { ...variant, sneaker: id },
            { runValidators: true }
          );
        } else {
          // Criar nova variante
          const newVariant = new SneakersVariant({
            ...variant,
            sneaker: id,
          });
          await newVariant.save();
        }
      }
    }

    // Retornar o tênis atualizado com suas variantes
    const result = await Sneakers.findById(id).populate('variants');

    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao atualizar sneaker:', error);
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export const deleteSneaker = async (req, res) => {
  try {
    const { id } = req.params;

    // Marcar como inativo em vez de excluir fisicamente
    const sneaker = await Sneakers.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!sneaker) {
      return res.status(404).json({ message: 'Sneaker not found' });
    }

    // Também marcar todas as variantes como inativas
    await SneakersVariant.updateMany({ sneaker: id }, { isActive: false });

    res.status(200).json({
      message: 'Sneaker successfully deactivated',
      success: true,
    });
  } catch (error) {
    console.error('Erro ao deletar sneaker:', error);
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

// Endpoint para buscar variantes de um tênis específico
export const getSneakerVariants = async (req, res) => {
  try {
    const { id } = req.params;

    const variants = await SneakersVariant.find({
      sneaker: id,
      isActive: true,
    }).sort({ size: 1 });

    res.status(200).json(variants);
  } catch (error) {
    console.error('Erro ao buscar variantes:', error);
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

// Endpoint para gerenciar o estoque de uma variante
export const updateVariantStock = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { stock } = req.body;

    const variant = await SneakersVariant.findByIdAndUpdate(
      variantId,
      { stock },
      { new: true, runValidators: true }
    );

    if (!variant) {
      return res.status(404).json({
        message: 'Variant not found',
        success: false,
      });
    }

    res.status(200).json({
      variant,
      success: true,
    });
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};
