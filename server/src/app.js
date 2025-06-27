import cors from 'cors';
import express from 'express';
import { swaggerDocs, swaggerUi } from './config/swagger.js';
import errorHandler from './middlewares/errorHandler.js';
import routes from './routes/index.js';
import rateLimiter from './utils/rate-limiter.js';

const app = express();

if (process.env.NODE_ENV !== 'development') {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', 'loopback');
}

// Configuração de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors(corsOptions));
app.use(rateLimiter);

// Rota de saúde
app.get('/', (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Sneakers Shop API - Server running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    clientIP: req.ip,
    forwardedFor: req.get('X-Forwarded-For'),
  });
});

// Documentação Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rotas da API
routes(app);

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

export default app;
