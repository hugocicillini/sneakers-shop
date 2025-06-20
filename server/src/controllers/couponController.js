import { Coupon } from '../models/coupon.js';
import { User } from '../models/user.js';
import logger from '../utils/logger.js';

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

    const now = new Date();
    if (now < coupon.startDate || (coupon.endDate && now > coupon.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Cupom fora do período de validade',
      });
    }

    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'Cupom atingiu o limite máximo de usos',
      });
    }

    if (cartTotal < coupon.minimumPurchase) {
      return res.status(400).json({
        success: false,
        message: `Valor mínimo para este cupom: R$ ${coupon.minimumPurchase.toFixed(
          2
        )}`,
        minimumPurchase: coupon.minimumPurchase,
      });
    }

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

    if (req.user && coupon.userType !== 'all') {
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

      if (coupon.userType === 'vip' && !user.isVip) {
        return res.status(400).json({
          success: false,
          message: 'Este cupom é exclusivo para clientes VIP',
        });
      }
    }

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

export default validateCoupon;
