import { Coupon } from '../models/coupon.js';
import { User } from '../models/user.js';
import logger from '../utils/logger.js';

// Listar cupons (com filtros) - apenas para admins
export const getCoupons = async (req, res, next) => {
  try {
    // Verificar permissões - apenas admin pode listar todos os cupons
    if (req.user.userType !== 'Admin') {
      return res.status(403).json({
        success: false,
        message:
          'Permissão negada. Apenas administradores podem listar cupons.',
      });
    }

    // Construir filtros
    let filter = {};

    // Filtrar por código
    if (req.query.code) {
      filter.code = new RegExp(req.query.code, 'i');
    }

    // Filtrar por status (ativo/inativo)
    if (req.query.isActive) {
      filter.isActive = req.query.isActive === 'true';
    }

    // Filtrar por tipo de desconto
    if (req.query.discountType) {
      filter.discountType = req.query.discountType;
    }

    // Filtrar por tipo de usuário
    if (req.query.userType) {
      filter.userType = req.query.userType;
    }

    // Filtrar por data de validade (cupons válidos)
    if (req.query.valid === 'true') {
      const now = new Date();
      filter = {
        ...filter,
        startDate: { $lte: now },
        $or: [
          { endDate: { $gte: now } },
          { endDate: { $exists: false } },
          { endDate: null },
        ],
      };
    }

    // Paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Ordenação
    const sort = {};
    if (req.query.sort) {
      const sortField = req.query.sort;
      sort[sortField.startsWith('-') ? sortField.substring(1) : sortField] =
        sortField.startsWith('-') ? -1 : 1;
    } else {
      sort.createdAt = -1; // Ordenação padrão: mais recentes primeiro
    }

    // Executar query
    const [result] = await Coupon.aggregate([
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
          coupons: [
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
            // Não expor dados sensíveis ou desnecessários
            {
              $project: {
                code: 1,
                description: 1,
                discountType: 1,
                discountValue: 1,
                maxDiscountValue: 1,
                minimumPurchase: 1,
                maxUses: 1,
                usesCount: 1,
                isActive: 1,
                startDate: 1,
                endDate: 1,
                userType: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
        },
      },
    ]);

    const total = result.metadata[0]?.total || 0;
    const coupons = result.coupons;

    return res.status(200).json({
      success: true,
      data: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        coupons,
      },
    });
  } catch (error) {
    logger.error(`Erro ao buscar cupons: ${error.message}`);
    next(error);
  }
};

// Obter cupom por código
export const getCouponByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    // Admin pode ver qualquer cupom, usuário comum só vê cupons ativos
    const filter = { code: new RegExp(`^${code}$`, 'i') };

    if (req.user?.userType !== 'Admin') {
      filter.isActive = true;

      const now = new Date();
      filter.startDate = { $lte: now };
      filter.$or = [
        { endDate: { $gte: now } },
        { endDate: { $exists: false } },
        { endDate: null },
      ];
    }

    const coupon = await Coupon.findOne(filter);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não encontrado ou expirado',
      });
    }

    // Para admins, mostra detalhes completos
    if (req.user?.userType === 'Admin') {
      return res.status(200).json({
        success: true,
        data: coupon,
      });
    }

    // Para usuários comuns, mostra apenas informações relevantes
    return res.status(200).json({
      success: true,
      data: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minimumPurchase: coupon.minimumPurchase,
        endDate: coupon.endDate,
      },
    });
  } catch (error) {
    logger.error(`Erro ao buscar cupom: ${error.message}`);
    next(error);
  }
};

// Criar novo cupom (apenas admin)
export const createCoupon = async (req, res, next) => {
  try {
    // Verificar permissões
    if (req.user.userType !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Permissão negada. Apenas administradores podem criar cupons.',
      });
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscountValue,
      minimumPurchase,
      maxUses,
      maxUsesPerUser,
      isActive,
      canBeCombined,
      userType,
      startDate,
      endDate,
      applicableCategories,
      applicableSneakers,
      excludedSneakers,
    } = req.body;

    // Validações básicas
    if (!code || !description || !discountType || discountValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Código, descrição, tipo de desconto e valor são obrigatórios',
      });
    }

    // Verificar se o código já existe
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Este código de cupom já existe',
      });
    }

    // Validar valor de desconto
    if (
      discountType === 'percentage' &&
      (discountValue <= 0 || discountValue > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Desconto percentual deve estar entre 1 e 100',
      });
    }

    if (discountType === 'fixed_amount' && discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valor de desconto fixo deve ser positivo',
      });
    }

    // Criar o cupom
    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      maxDiscountValue,
      minimumPurchase: minimumPurchase || 0,
      maxUses,
      maxUsesPerUser: maxUsesPerUser || 1,
      isActive: isActive !== undefined ? isActive : true,
      canBeCombined: canBeCombined || false,
      userType: userType || 'all',
      startDate: startDate || new Date(),
      endDate,
      applicableCategories,
      applicableSneakers,
      excludedSneakers,
    });

    await newCoupon.save();

    res.status(201).json({
      success: true,
      message: 'Cupom criado com sucesso',
      data: newCoupon,
    });
  } catch (error) {
    logger.error(`Erro ao criar cupom: ${error.message}`);
    next(error);
  }
};

// Atualizar cupom existente (apenas admin)
export const updateCoupon = async (req, res, next) => {
  try {
    const { couponId } = req.params;

    // Verificar permissões
    if (req.user.userType !== 'Admin') {
      return res.status(403).json({
        success: false,
        message:
          'Permissão negada. Apenas administradores podem modificar cupons.',
      });
    }

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não encontrado',
      });
    }

    // Se estiver alterando o código, verificar se já existe
    if (req.body.code && req.body.code !== coupon.code) {
      const existingCode = await Coupon.findOne({
        code: req.body.code.toUpperCase(),
        _id: { $ne: couponId },
      });

      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Este código de cupom já está em uso',
        });
      }

      // Converter para maiúsculo
      req.body.code = req.body.code.toUpperCase();
    }

    // Validações adicionais se necessário
    if (
      req.body.discountType === 'percentage' &&
      req.body.discountValue > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Desconto percentual não pode exceder 100%',
      });
    }

    // Atualizar o cupom
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cupom atualizado com sucesso',
      data: updatedCoupon,
    });
  } catch (error) {
    logger.error(`Erro ao atualizar cupom: ${error.message}`);
    next(error);
  }
};

// Desativar cupom (exclusão lógica) - apenas admin
export const deleteCoupon = async (req, res, next) => {
  try {
    const { couponId } = req.params;

    // Verificar permissões
    if (req.user.userType !== 'Admin') {
      return res.status(403).json({
        success: false,
        message:
          'Permissão negada. Apenas administradores podem excluir cupons.',
      });
    }

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { isActive: false },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cupom desativado com sucesso',
    });
  } catch (error) {
    logger.error(`Erro ao desativar cupom: ${error.message}`);
    next(error);
  }
};

// Validar cupom para um carrinho
export const validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { cartTotal, cartItems } = req.body;

    if (!code || !cartTotal) {
      return res.status(400).json({
        success: false,
        message: 'Código de cupom e valor do carrinho são obrigatórios',
      });
    }

    const coupon = await Coupon.findOne({
      code: new RegExp(`^${code}$`, 'i'),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não encontrado ou inválido',
      });
    }

    // Verificar se o cupom está dentro do prazo de validade
    const now = new Date();
    if (now < coupon.startDate || (coupon.endDate && now > coupon.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Cupom fora do período de validade',
      });
    }

    // Verificar limite de usos
    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'Cupom atingiu o limite máximo de usos',
      });
    }

    // Verificar valor mínimo
    if (cartTotal < coupon.minimumPurchase) {
      return res.status(400).json({
        success: false,
        message: `Valor mínimo para este cupom: R$ ${coupon.minimumPurchase.toFixed(
          2
        )}`,
        minimumPurchase: coupon.minimumPurchase,
      });
    }

    // Verificar uso por usuário
    if (req.user && coupon.maxUsesPerUser > 0) {
      const userUsage = coupon.usedByUsers.filter(
        (usage) => usage.userId.toString() === req.user._id.toString()
      ).length;

      if (userUsage >= coupon.maxUsesPerUser) {
        return res.status(400).json({
          success: false,
          message: 'Você já atingiu o limite de uso deste cupom',
        });
      }
    }

    // Verificar tipo de usuário (vip, novo, etc.)
    if (req.user && coupon.userType !== 'all') {
      // Obter dados completos do usuário se necessário
      const user = await User.findById(req.user._id);

      if (coupon.userType === 'new' && user.orderCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Este cupom é válido apenas para novos clientes',
        });
      }

      if (coupon.userType === 'returning' && user.orderCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Este cupom é válido apenas para clientes recorrentes',
        });
      }

      // Implementar lógica para VIP conforme suas regras de negócio
      if (coupon.userType === 'vip' && !user.isVip) {
        return res.status(400).json({
          success: false,
          message: 'Este cupom é exclusivo para clientes VIP',
        });
      }
    }

    // Verificar restrições de produtos (se aplicável)
    if (
      cartItems &&
      (coupon.applicableCategories.length > 0 ||
        coupon.applicableSneakers.length > 0 ||
        coupon.excludedSneakers.length > 0)
    ) {
      const validationResult = coupon.isValid(req.user, cartTotal, cartItems);

      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: validationResult.message,
        });
      }
    }

    // Calcular o desconto
    const discountResult = coupon.applyDiscount(cartTotal);

    res.status(200).json({
      success: true,
      data: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discountResult.discountAmount,
        totalAfterDiscount: discountResult.total,
        canBeCombined: coupon.canBeCombined,
      },
    });
  } catch (error) {
    logger.error(`Erro ao validar cupom: ${error.message}`);
    next(error);
  }
};

// Registrar o uso de um cupom (chamado quando uma ordem é finalizada)
export const redeemCoupon = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { orderId } = req.body;

    if (!code || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Código de cupom e ID do pedido são obrigatórios',
      });
    }

    const coupon = await Coupon.findOne({ code: new RegExp(`^${code}$`, 'i') });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não encontrado',
      });
    }

    // Incrementar contagem de uso
    coupon.usesCount += 1;

    // Registrar uso pelo usuário atual
    if (req.user) {
      coupon.usedByUsers.push({
        userId: req.user._id,
        orderId,
        usedAt: new Date(),
      });
    }

    await coupon.save();

    res.status(200).json({
      success: true,
      message: 'Uso de cupom registrado com sucesso',
      data: {
        usesCount: coupon.usesCount,
        remainingUses: coupon.maxUses
          ? coupon.maxUses - coupon.usesCount
          : 'Ilimitado',
      },
    });
  } catch (error) {
    logger.error(`Erro ao registrar uso de cupom: ${error.message}`);
    next(error);
  }
};

export default {
  getCoupons,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  redeemCoupon,
};
