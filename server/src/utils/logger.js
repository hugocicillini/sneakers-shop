const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = process.env.LOG_LEVEL || 'info';

const logger = {
  error: (message) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
  },

  warn: (message) => {
    if (levels[currentLevel] >= levels.warn) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
    }
  },

  info: (message) => {
    if (levels[currentLevel] >= levels.info) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    }
  },

  debug: (message) => {
    if (levels[currentLevel] >= levels.debug) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    }
  },
};

export default logger;
