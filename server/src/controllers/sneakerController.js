import { Brand } from '../models/brand.js';
import { Category } from '../models/category.js';
import '../models/review.js';
import { Sneaker } from '../models/sneaker.js';
import { SneakerVariant } from '../models/sneakerVariant.js';
import logger from '../utils/logger.js';

function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

const getAvailableColors = (variants) => {
  return [
    ...new Set(
      variants.filter((v) => v.stock > 0).map((v) => v.color?.toLowerCase())
    ),
  ];
};

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

export const getSneakers = async (req, res, next) => {
  try {
    let filter = { isActive: true };

    if (req.query.search) {
      const removeAccents = (str) => {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      };

      const normalizedSearch = removeAccents(
        req.query.search.trim()
      ).toLowerCase();

      const escapeRegex = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };
      const searchRegex = new RegExp(escapeRegex(normalizedSearch), 'i');

      const matchingBrands = await Brand.find({
        $or: [{ name: searchRegex }, { slug: searchRegex }],
      });

      const brandIds = matchingBrands.map((brand) => brand._id);

      const orConditions = [
        { name: searchRegex },
        { slug: searchRegex },
        { shortDescription: searchRegex },
      ];

      if (brandIds.length > 0) {
        orConditions.push({ brand: { $in: brandIds } });
      }

      filter.$or = orConditions;
    }

    if (req.query.brand) {
      const brandIds = await getBrandIds(req.query.brand.split(','));
      if (brandIds.length > 0) {
        filter.brand = { $in: brandIds };
      }
    }

    if (req.query.category) {
      const categoryNames = req.query.category.split(',');

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

    if (req.query.sizes) {
      const sizes = req.query.sizes.split(',').map((size) => parseInt(size));
      filter.availableSizes = { $in: sizes };
    }

    if (req.query.colors) {
      const colors = req.query.colors.split(',');
      filter['availableColors.color'] = {
        $in: colors.map((color) => new RegExp(color, 'i')),
      };
    }

    if (req.query.gender) {
      const genders = req.query.gender.split(',');
      filter.gender = { $in: genders };
    }

    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      filter.tags = { $in: tags };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.finalPrice = {};

      if (req.query.minPrice) {
        filter.finalPrice.$gte = parseFloat(req.query.minPrice);
      }

      if (req.query.maxPrice) {
        filter.finalPrice.$lte = parseFloat(req.query.maxPrice);
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortOptions = {};
    if (req.query.sort) {
      const sortFields = req.query.sort.split(',');

      for (const field of sortFields) {
        if (field.startsWith('-')) {
          const fieldName = field.substring(1);
          if (fieldName === 'price' || fieldName === 'basePrice') {
            sortOptions.finalPrice = -1;
          } else {
            sortOptions[fieldName] = -1;
          }
        } else {
          if (field === 'price' || field === 'basePrice') {
            sortOptions.finalPrice = 1;
          } else {
            sortOptions[field] = 1;
          }
        }
      }
    } else {
      sortOptions.isFeatured = -1;
    }

    const [result] = await Sneaker.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $addFields: {
          brand: { $arrayElemAt: ['$brand', 0] },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$category', 0] },
        },
      },
      { $sort: sortOptions },
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
          sneakers: [{ $skip: skip }, { $limit: limit }],
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
    next(error);
  }
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

    const colorImages =
      sneaker.colorImages?.find(
        (ci) => ci.color.toLowerCase() === selectedColor?.toLowerCase()
      )?.images || sneaker.coverImage;

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
          'name basePrice coverImage defaultColor slug baseDiscount finalPrice brand rating'
        )
        .populate('brand');
    }

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

    const newSneaker = new Sneaker(sneakerData);
    await newSneaker.save();

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
    next(error);
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

    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        if (variant._id) {
          await SneakerVariant.findByIdAndUpdate(
            variant._id,
            { ...variant, sneaker: sneakerId },
            { runValidators: true, new: true }
          );
        } else {
          const newVariant = new SneakerVariant({
            ...variant,
            sneaker: sneakerId,
          });
          await newVariant.save();
        }
      }
    }

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
    next(error);
  }
};

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
    next(error);
  }
};

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
    next(error);
  }
};
