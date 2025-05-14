import cors from 'cors';
import express from 'express';
import { swaggerDocs, swaggerUi } from './config/swagger.js';
import errorHandler from './middlewares/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// Configuração de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: [
    'Content-Type',
    'Access-Control-Allow-Origin',
    'Authorization',
  ],
};

// Middlewares
app.use(express.json());
app.use(cors());
// app.use(rateLimiter);

// Rota de saúde
app.get('/', (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Server running!',
    timestamp: new Date(),
  });
});

// Documentação Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rotas da API
routes(app);

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

export default app;
