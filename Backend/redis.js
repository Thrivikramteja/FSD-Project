const redis = require('redis');

/**
 * REDIS CONFIGURATION
 * Uses REDIS_URL from your .env for Cloud Redis.
 * Falls back to local 127.0.0.1 if the environment variable is missing.
 */
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) return new Error('Redis connection failed permanently');
            return Math.min(retries * 100, 3000); // Retry logic for Cloud stability
        }
    }
});

// --- Lifecycle Tracking ---
redisClient.isReadyStatus = false;

redisClient.on('error', (err) => {
    redisClient.isReadyStatus = false;
    console.error('❌ Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
    console.log('⏳ Redis: Connection initiated...');
});

redisClient.on('ready', () => {
    redisClient.isReadyStatus = true;
    console.log('✅ Redis Cache: Connected and Ready');
});

redisClient.on('end', () => {
    redisClient.isReadyStatus = false;
    console.log('🔌 Redis: Connection closed');
});

/**
 * ASYNC CONNECTION INITIALIZER
 * This prevents "Client is closed" errors by ensuring the connect() 
 * is called only once and handled correctly.
 */
const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (err) {
        console.error('❌ Redis Connection Failed:', err);
    }
};

connectRedis();

module.exports = redisClient;