import { Brand } from '../models/brand.js';
import { Category } from '../models/category.js'; // Importar o modelo Category
import '../models/review.js'; // Apenas registra o modelo no Mongoose
import { Sneaker } from '../models/sneaker.js';
import { SneakerVariant } from '../models/sneakerVariant.js';
import logger from '../utils/logger.js';

export const getSneakers = async (req, res, next) => {
  try {
    let filter = { isActive: true }; // Por padrão, retornar apenas produtos ativos

    // Filtro por texto (busca em nome ou marca)
    if (req.query.search) {
      // Função para remover acentos para melhorar a busca
      const removeAccents = (str) => {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      };

      // Termo de busca normalizado (sem acentos)
      const normalizedSearch = removeAccents(
        req.query.search.trim()
      ).toLowerCase();

      // Criar regex para busca parcial - busca por qualquer parte da palavra
      const escapeRegex = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };
      const searchRegex = new RegExp(escapeRegex(normalizedSearch), 'i');

      // Procurar marcas que correspondem ao termo de busca
      const matchingBrands = await Brand.find({
        $or: [{ name: searchRegex }, { slug: searchRegex }],
      });

      // Extrair IDs das marcas encontradas
      const brandIds = matchingBrands.map((brand) => brand._id);

      // Construir filtro OR para nome de produto, slug, ou marca
      const orConditions = [
        // Busca por nome do produto
        { name: searchRegex },
        // Busca por slug (que geralmente não tem acentos)
        { slug: searchRegex },
        // Busca por descrição curta
        { shortDescription: searchRegex },
      ];

      // Adicionar condição para marcas se encontramos alguma
      if (brandIds.length > 0) {
        orConditions.push({ brand: { $in: brandIds } });
      }

      // Aplicar o filtro OR
      filter.$or = orConditions;
    }

    // Resto do filtro por marca permanece igual
    if (req.query.brand) {
      const brandIds = await getBrandIds(req.query.brand.split(','));
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

    const [result] = await Sneaker.aggregate([
      { $match: filter },
      {
        $facet: {
          metadata: [
            { $count: 'total' },
            {
              $addFields: {
                page,
                limit,
                totalPages: { $ceil: { $divide: ['$total', limit] } },
              },
            },
          ],
          sneakers: [
            { $skip: skip },
            { $limit: limit },
            { $sort: sortOptions },
            {
              $lookup: {
                from: 'brands', // Nome da coleção no MongoDB
                localField: 'brand',
                foreignField: '_id',
                as: 'brand',
              },
            },
            // Converter o array brand em objeto único (primeiro elemento)
            {
              $addFields: {
                brand: { $arrayElemAt: ['$brand', 0] },
              },
            },
            // Lookup para popular o campo category
            {
              $lookup: {
                from: 'categories', // Nome da coleção no MongoDB
                localField: 'category',
                foreignField: '_id',
                as: 'category',
              },
            },
            // Converter o array category em objeto único (primeiro elemento)
            {
              $addFields: {
                category: { $arrayElemAt: ['$category', 0] },
              },
            },
          ],
        },
      },
    ]);

    const total = result.metadata[0]?.total || 0;
    const sneakers = result.sneakers;

    return res.status(200).json({
      success: true,
      data: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        sneakers,
      },
    });
  } catch (error) {
    logger.error(`Erro ao buscar tênis: ${error.message}`);
    next(error); // Usar middleware global de erro
  }
};

// Função simples para capitalizar a primeira letra
function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// Função para obter cores disponíveis
const getAvailableColors = (variants) => {
  return [
    ...new Set(
      variants.filter((v) => v.stock > 0).map((v) => v.color?.toLowerCase())
    ),
  ];
};

// Função para determinar a cor selecionada
const determineSelectedColor = (requestedColor, availableColors) => {
  if (
    requestedColor &&
    availableColors.includes(requestedColor.toLowerCase())
  ) {
    return capitalizeFirstLetter(requestedColor);
  }
  return availableColors.length > 0
    ? capitalizeFirstLetter(availableColors[0])
    : null;
};

// Exemplo: Extrair lógica de busca por marca
const getBrandIds = async (brandNames) => {
  const brandQueries = brandNames.map((brandName) => ({
    $or: [
      { name: new RegExp(brandName, 'i') },
      { slug: new RegExp(brandName, 'i') },
    ],
  }));

  const brands = await Brand.find({ $or: brandQueries });
  return brands.map((brand) => brand._id);
};

export const getSneakerBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { color } = req.query;

    const sneaker = await Sneaker.findOne({ slug })
      .populate('brand')
      .populate('category')
      .populate({
        path: 'reviews',
        match: { isVerified: true },
        select: 'rating comment user date',
        options: { sort: { date: -1 }, limit: 5 },
        // Adicionar populate aninhado para trazer os dados do usuário
        populate: {
          path: 'user',
          select: 'name',
        },
      })
      .select('-isFeatured');

    if (!sneaker) {
      return res
        .status(404)
        .json({ success: false, message: 'Tênis não encontrado' });
    }

    const variants = await SneakerVariant.find({
      sneaker: sneaker._id,
      isActive: true,
    }).select('color size stock price discount finalPrice');

    let selectedColor = null;

    const colorsInStock = getAvailableColors(variants);

    selectedColor = determineSelectedColor(color, colorsInStock);

    // Filtrar imagens para a cor selecionada
    const colorImages =
      sneaker.colorImages?.find(
        (ci) => ci.color.toLowerCase() === selectedColor?.toLowerCase()
      )?.images || sneaker.coverImage;

    // Obter variantes da cor selecionada com os preços corretos
    const sizesInStock = variants
      .filter((v) => v.color === selectedColor && v.stock > 0)
      .map((v) => ({
        id: v._id,
        size: v.size,
        stock: v.stock,
        price: v.price || sneaker.basePrice,
        discount: v.discount !== undefined ? v.discount : sneaker.baseDiscount,
        finalPrice:
          v.finalPrice ||
          (v.price || sneaker.basePrice) *
            (1 -
              (v.discount !== undefined ? v.discount : sneaker.baseDiscount) /
                100),
        isAvailable: true,
      }))
      .sort((a, b) => a.size - b.size);

    let relatedSneakers = [];
    if (sneaker.relatedSneakers && sneaker.relatedSneakers.length > 0) {
      relatedSneakers = await Sneaker.find({
        _id: { $in: sneaker.relatedSneakers },
        isActive: true,
      })
        .select(
          'name basePrice coverImage slug baseDiscount finalPrice brand rating'
        )
        .populate('brand');
    }

    // Resposta formatada
    const response = {
      ...sneaker.toObject(),
      selectedColor,
      sizesInStock,
      colorsInStock,
      colorImages,
      relatedSneakers,
    };

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error(`Erro ao buscar detalhes do tênis: ${error.message}`);
    next(error);
  }
};

export const createSneaker = async (req, res, next) => {
  try {
    const { sneakerData, variants } = req.body;

    const { name, basePrice, brand } = sneakerData;

    if (!name || !basePrice || !brand) {
      return res.status(400).json({
        success: false,
        message: 'Nome, preço base e marca são obrigatórios',
      });
    }

    if (req.user.userType !== 'Admin') {
      return res.status(403).json({
        success: false,
        message:
          'Permissão negada. Apenas administradores podem criar produtos.',
      });
    }

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
    const createdVariants = await SneakerVariant.find({
      sneaker: newSneaker._id,
    });

    const response = {
      ...newSneaker.toObject(),
      variants: createdVariants,
    };

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error(`Erro ao criar tênis: ${error.message}`);
    next(error); // Usar middleware global de erro
  }
};

export const updateSneaker = async (req, res, next) => {
  try {
    const { sneakerId } = req.params;
    const { sneakerData, variants } = req.body;

    if (req.user.userType !== 'Admin') {
      return res.status(403).json({
        success: false,
        message:
          'Permissão negada. Apenas administradores podem modificar produtos.',
      });
    }

    if (sneakerData) {
      const { name, basePrice } = sneakerData;
      if (name === '') {
        return res.status(400).json({
          success: false,
          message: 'Nome não pode ser vazio',
        });
      }
      if (basePrice !== undefined && basePrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Preço base deve ser maior que zero',
        });
      }
    }

    // Atualizar dados do tênis
    const updatedSneaker = await Sneaker.findByIdAndUpdate(
      sneakerId,
      sneakerData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedSneaker) {
      return res.status(404).json({
        success: false,
        message: 'Tênis não encontrado',
      });
    }

    // Atualizar variantes existentes e adicionar novas
    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        if (variant._id) {
          // Atualizar variante existente
          await SneakerVariant.findByIdAndUpdate(
            variant._id,
            { ...variant, sneaker: sneakerId },
            { runValidators: true, new: true }
          );
        } else {
          // Criar nova variante
          const newVariant = new SneakerVariant({
            ...variant,
            sneaker: sneakerId,
          });
          await newVariant.save();
        }
      }
    }

    // Retornar o tênis atualizado com suas variantes
    const result = await Sneaker.findById(sneakerId).populate('variants');

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error(`Erro ao atualizar sneaker: ${error.message}`);
    next(error);
  }
};

export const deleteSneaker = async (req, res, next) => {
  try {
    const { sneakerId } = req.params;

    if (req.user.userType !== 'Admin') {
      return res.status(403).json({
        success: false,
        message:
          'Permissão negada. Apenas administradores podem modificar produtos.',
      });
    }

    // Marcar como inativo em vez de excluir fisicamente
    const sneaker = await Sneaker.findByIdAndUpdate(
      sneakerId,
      { isActive: false },
      { new: true }
    );

    if (!sneaker) {
      return res
        .status(404)
        .json({ success: false, message: 'Tênis não encontrado' });
    }

    // Também marcar todas as variantes como inativas
    await SneakerVariant.updateMany(
      { sneaker: sneakerId },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: 'Tênis deletado com sucesso',
    });
  } catch (error) {
    logger.error(`Erro ao deletar sneaker: ${error.message}`);
    next(error); // Usar middleware global de erro
  }
};

// Endpoint para buscar variantes de um tênis específico
export const getSneakerVariants = async (req, res, next) => {
  try {
    const { sneakerId } = req.params;

    const variants = await SneakerVariant.find({
      sneaker: sneakerId,
      isActive: true,
    }).sort({ size: 1 });

    res.status(200).json({
      success: true,
      data: variants,
    });
  } catch (error) {
    logger.error(`Erro ao buscar variantes: ${error.message}`);
    next(error); // Usar middleware global de erro
  }
};

// Endpoint para gerenciar o estoque de uma variante
export const updateVariantStock = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const { stock } = req.body;

    if (req.user.userType !== 'Admin') {
      return res.status(403).json({
        success: false,
        message:
          'Permissão negada. Apenas administradores podem modificar produtos.',
      });
    }

    const variant = await SneakerVariant.findByIdAndUpdate(
      variantId,
      { stock },
      { new: true, runValidators: true }
    );

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variante não encontrada',
      });
    }

    res.status(200).json({
      success: true,
      data: variant,
    });
  } catch (error) {
    logger.error(
      `Erro ao atualizar estoque da variant ${variantId}: ${error.message}`
    );
    next(error); // Usar middleware global de erro
  }
};
