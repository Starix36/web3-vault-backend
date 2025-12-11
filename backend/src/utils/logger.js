// This is a simple wrapper so your code stops complaining
const logger = {
    info: (message) => console.log(`ℹ️  [INFO]: ${message}`),
    error: (message) => console.error(`❌ [ERROR]: ${message}`),
    warn: (message) => console.warn(`⚠️  [WARN]: ${message}`)
};

module.exports = logger;