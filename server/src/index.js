import app from './app.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;

// Função para iniciar o servidor
const startServer = async () => {
  try {
    // Conectar ao MongoDB
    await connectDB();

    // Iniciar o servidor Express
    app.listen(PORT, () => {
      logger.info(`Server started on: http://localhost:${PORT}`);
      logger.info(`Documentation available at: http://localhost:${PORT}/docs`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Lidar com erros não tratados
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled error: ${err.message}`);
  process.exit(1);
});

startServer();
