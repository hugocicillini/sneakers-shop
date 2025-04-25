import { Brand } from '../models/brandModel.js';
import { Category } from '../models/categoryModel.js'; // Importar o modelo Category
import '../models/reviewModel.js'; // Apenas registra o modelo no Mongoose
import { Sneaker } from '../models/sneakerModel.js';
import { SneakerVariant } from '../models/sneakerVariantModel.js';

export const getSneakers = async (req, res) => {
  try {
    let filter = { isActive: true }; // Por padrão, retornar apenas produtos ativos

    // Filtro por texto (busca em nome ou marca)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: searchRegex }, { brand: searchRegex }];
    }

    // Filtro específico por marca
    if (req.query.brand) {
      const brandNames = req.query.brand.split(',');

      // Primeiro encontrar os IDs das marcas pelo nome ou slug
      const brandQueries = brandNames.map((brandName) => ({
        $or: [
          { name: new RegExp(brandName, 'i') },
          { slug: new RegExp(brandName, 'i') },
        ],
      }));

      const brands = await Brand.find({ $or: brandQueries });
      const brandIds = brands.map((brand) => brand._id);

      if (brandIds.length > 0) {
        filter.brand = { $in: brandIds };
      }
    }

    // Filtro por categoria - nova funcionalidade
    if (req.query.category) {
      const categoryNames = req.query.category.split(',');

      // Buscar categorias pelo nome ou slug, similar ao filtro de marcas
      const categoryQueries = categoryNames.map((categoryName) => ({
        $or: [
          { name: new RegExp(categoryName, 'i') },
          { slug: new RegExp(categoryName, 'i') },
        ],
      }));

      const categories = await Category.find({ $or: categoryQueries });
      const categoryIds = categories.map((category) => category._id);

      if (categoryIds.length > 0) {
        filter.category = { $in: categoryIds };
      }
    }

    // Filtro por tamanhos - usando o campo correto do modelo
    if (req.query.sizes) {
      const sizes = req.query.sizes.split(',').map((size) => parseInt(size));
      filter.availableSizes = { $in: sizes };
    }

    // Filtro por cores - usando a estrutura correta do modelo
    if (req.query.colors) {
      const colors = req.query.colors.split(',');
      filter['availableColors.color'] = {
        $in: colors.map((color) => new RegExp(color, 'i')),
      };
    }

    // Filtro por gênero
    if (req.query.gender) {
      const genders = req.query.gender.split(',');
      filter.gender = { $in: genders };
    }

    // Filtro por tags
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      filter.tags = { $in: tags };
    }

    // Filtro por faixa de preço
    if (req.query.minPrice || req.query.maxPrice) {
      filter.basePrice = {};

      if (req.query.minPrice) {
        filter.basePrice.$gte = parseFloat(req.query.minPrice);
      }

      if (req.query.maxPrice) {
        filter.basePrice.$lte = parseFloat(req.query.maxPrice);
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Opções de ordenação melhoradas
    const sortOptions = {};
    if (req.query.sort) {
      // Suporte para múltiplos campos de ordenação
      const sortFields = req.query.sort.split(',');

      for (const field of sortFields) {
        if (field.startsWith('-')) {
          sortOptions[field.substring(1)] = -1;
        } else {
          sortOptions[field] = 1;
        }
      }
    } else {
      // Ordenação padrão
      sortOptions.isFeatured = -1;
    }

    const total = await Sneaker.countDocuments(filter);
    const sneakers = await Sneaker.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('brand', 'name slug logo') // Populate brand info
      .populate('category', 'name slug') // Populate category info
      .select(
        'name slug basePrice baseDiscount shortDescription coverImage brand category rating reviewCount defaultColor isFeatured'
      );

    return res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: sneakers,
    });
  } catch (error) {
    console.error('Erro ao buscar sneakers:', error);
    res
      .status(500)
      .json({ message: 'Error fetching sneakers', error: error.message });
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
