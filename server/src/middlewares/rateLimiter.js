import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

const limiter = rateLimit({
  windowMs: (parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // Converte minutos para milissegundos
  max: parseInt(process.env.API_RATE_LIMIT) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Muitas requisições. Por favor, tente novamente mais tarde.',
    });
  },
});

export default limiter;
