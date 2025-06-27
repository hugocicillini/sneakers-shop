import rateLimit from 'express-rate-limit';
import logger from './logger.js';

// Rate limiter geral - Alinhado com grandes e-commerces
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.API_RATE_LIMIT) || 300, // 300 requests/15min (20/min)
  message: {
    success: false,
    error: 'Muitas tentativas. Tente novamente em alguns minutos.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚨 RATE LIMIT EXCEDIDO:`);
    console.log(`   IP: ${req.ip}`);
    console.log(`   Limite: 300 requests / 15 min (20/min)`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    logger.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      error: 'Muitas tentativas. Tente novamente em alguns minutos.',
      retryAfter: 900,
      limit: 300,
      window: '15 minutos',
    });
  },
  skip: (req) => {
    // Pular para desenvolvimento local
    const isLocalhost = req.ip === '::1' || req.ip === '127.0.0.1';
    const isDevelopment = process.env.NODE_ENV === 'development';

    return (
      (isDevelopment && isLocalhost) ||
      req.path === '/' ||
      req.path === '/health' ||
      req.path === '/docs'
    );
  },
});

// Auth - Padrão da indústria
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos (mais rigoroso)
  max: 5, // 5 tentativas de login
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 10 minutos.',
    retryAfter: 600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🔐 AUTH LIMIT EXCEDIDO:`);
    console.log(`   IP: ${req.ip}`);
    console.log(`   Limite: 5 tentativas / 10 min`);

    logger.warn(
      `Auth rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`
    );
    res.status(429).json({
      success: false,
      error: 'Muitas tentativas de login. Tente novamente em 10 minutos.',
      retryAfter: 600,
    });
  },
});

// Busca - Mais liberal (como Amazon/ML)
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // 60 buscas/min (1 por segundo)
  message: {
    success: false,
    error: 'Muitas buscas simultâneas. Aguarde um momento.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Usuários autenticados têm limite maior
    return !!req.user;
  },
});

// Carrinho/Checkout - Crítico para vendas
export const cartLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 operações/min no carrinho
  message: {
    success: false,
    error: 'Muitas operações no carrinho. Aguarde um momento.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Criação de recursos - Moderado
export const createLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // 20 criações/min
  message: {
    success: false,
    error: 'Muitas criações simultâneas. Aguarde um momento.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload - Restritivo (por ser custoso)
export const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // 10 uploads/min
  message: {
    success: false,
    error: 'Muitos uploads simultâneos. Aguarde um momento.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Pagamento - Muito restritivo (segurança)
export const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3, // Máximo 3 tentativas de pagamento em 5min
  message: {
    success: false,
    error: 'Muitas tentativas de pagamento. Aguarde 5 minutos.',
    retryAfter: 300,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`💳 PAYMENT LIMIT EXCEDIDO:`);
    console.log(`   IP: ${req.ip}`);
    console.log(`   CRÍTICO: Possível fraude!`);

    logger.error(
      `Payment rate limit exceeded for IP: ${req.ip} - POTENTIAL FRAUD`
    );
    res.status(429).json({
      success: false,
      error: 'Muitas tentativas de pagamento. Aguarde 5 minutos.',
      retryAfter: 300,
    });
  },
});

export default generalLimiter;
