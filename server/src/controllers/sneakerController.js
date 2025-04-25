import { Sneaker } from '../models/sneakerModel.js';
import { SneakerVariant } from '../models/sneakerVariantModel.js';

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

    const total = await Sneaker.countDocuments(filter);
    const sneakers = await Sneaker.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select(
        'name slug basePrice baseDiscount shortDescription coverImage brand rating reviewCount defaultColor isFeatured'
      ); // Excluir descrição completa para economizar largura de banda

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

// Quando buscar detalhes de um sneaker específico, limitar a 5 reviews iniciais
export const getSneakerBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { color } = req.query; // Cor opcional na URL

    // Buscar o tênis completo
    const sneaker = await Sneaker.findOne({ slug })
      .populate('brand')
      .populate('category')
      .populate({
        path: 'reviews',
        select: 'rating comment user date',
        options: { sort: { date: -1 }, limit: 5 },
      });

    if (!sneaker) {
      return res.status(404).json({ message: 'Tênis não encontrado!' });
    }

    // Buscar variantes com uma única consulta para evitar múltiplas chamadas ao banco
    const variants = await SneakerVariant.find({
      sneaker: sneaker._id,
      isActive: true,
    });

    const availableColors = [
      ...new Set(variants.filter((v) => v.stock > 0).map((v) => v.color)),
    ];

    // Determinar a cor a ser usada e verificar disponibilidade
    let selectedColor;
    let colorChangeMessage = null;

    if (color) {
      if (availableColors.includes(color)) {
        // A cor solicitada está disponível
        selectedColor = color;
      } else {
        // A cor solicitada não está disponível, buscar alternativa
        const defaultColor = sneaker.getDefaultColor();

        if (availableColors.includes(defaultColor)) {
          selectedColor = defaultColor;
        } else if (availableColors.length > 0) {
          selectedColor = availableColors[0];
        } else {
          // Caso extremo: nenhuma cor tem estoque
          selectedColor = color; // Manter a cor solicitada mesmo sem estoque
        }

        colorChangeMessage = `A cor ${color} não está disponível. Mostrando ${selectedColor} como alternativa.`;
      }
    } else {
      // Nenhuma cor foi especificada, usar a padrão
      const defaultColor = sneaker.getDefaultColor();

      if (availableColors.includes(defaultColor)) {
        selectedColor = defaultColor;
      } else if (availableColors.length > 0) {
        selectedColor = availableColors[0];
      } else {
        selectedColor = sneaker.availableColors[0]?.color || 'default';
      }
    }

    // Organizar os dados para a resposta
    // Buscar imagens específicas da cor selecionada
    const selectedColorImages = sneaker.getImagesByColor(selectedColor);

    // Filtrar variantes da cor selecionada que tenham estoque
    const availableSizes = variants
      .filter((v) => v.color === selectedColor && v.stock > 0)
      .map((v) => ({
        size: v.size,
        stock: v.stock,
        price: v.price || sneaker.basePrice,
        discount: v.discount !== undefined ? v.discount : sneaker.baseDiscount,
        id: v._id,
      }))
      .sort((a, b) => a.size - b.size);

    // Preparar informações de cores disponíveis
    const colorVariants = sneaker.availableColors.map((c) => ({
      ...(c.toObject ? c.toObject() : c),
      isSelected: c.color === selectedColor,
      hasStock: variants.some((v) => v.color === c.color && v.stock > 0),
    }));

    // Buscar tênis relacionados se existirem
    let relatedSneakers = [];
    if (sneaker.relatedSneakers && sneaker.relatedSneakers.length > 0) {
      relatedSneakers = await Sneaker.find({
        _id: { $in: sneaker.relatedSneakers },
        isActive: true,
      }).select('name basePrice coverImage slug baseDiscount brand');
    }

    // Resposta formatada
    const response = {
      ...sneaker.toObject(),
      selectedColor,
      colorImages: selectedColorImages,
      availableSizes,
      colorVariants,
      relatedSneakers,
      colorChangeMessage,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Erro ao buscar detalhes do tênis:', error);
    res.status(500).json({
      message: 'Erro ao carregar detalhes do tênis',
      error: error.message,
    });
  }
};

export const createSneakers = async (req, res) => {
  try {
    const { sneakerData, variants } = req.body;

    // Criar o tênis principal
    const newSneaker = new Sneaker(sneakerData);
    await newSneaker.save();

    // Criar variantes se existirem
    if (variants && Array.isArray(variants)) {
      const variantPromises = variants.map((variant) => {
        const newVariant = new SneakerVariant({
          ...variant,
          sneaker: newSneaker._id,
        });
        return newVariant.save();
      });

      await Promise.all(variantPromises);
    }

    // Recuperar o tênis com as variantes para retornar na resposta
    const createdSneaker = await Sneaker.findById(newSneaker._id).populate(
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
    const updatedSneaker = await Sneaker.findByIdAndUpdate(id, sneakerData, {
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
          await SneakerVariant.findByIdAndUpdate(
            variant._id,
            { ...variant, sneaker: id },
            { runValidators: true }
          );
        } else {
          // Criar nova variante
          const newVariant = new SneakerVariant({
            ...variant,
            sneaker: id,
          });
          await newVariant.save();
        }
      }
    }

    // Retornar o tênis atualizado com suas variantes
    const result = await Sneaker.findById(id).populate('variants');

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
    const sneaker = await Sneaker.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!sneaker) {
      return res.status(404).json({ message: 'Sneaker not found' });
    }

    // Também marcar todas as variantes como inativas
    await SneakerVariant.updateMany({ sneaker: id }, { isActive: false });

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

    const variants = await SneakerVariant.find({
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

    const variant = await SneakerVariant.findByIdAndUpdate(
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
