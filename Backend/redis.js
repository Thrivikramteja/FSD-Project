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
redisClient.isReady = false;

redisClient.on('error', (err) => {
    redisClient.isReadyStatus = false;
    redisClient.isReady = false;
    if (process.env.NODE_ENV !== 'test') {
        console.error('❌ Redis Client Error:', err.message);
    }
});

redisClient.on('connect', () => {
    if (process.env.NODE_ENV !== 'test') {
        console.log('⏳ Redis: Connection initiated...');
    }
});

redisClient.on('ready', () => {
    redisClient.isReadyStatus = true;
    redisClient.isReady = true;
    if (process.env.NODE_ENV !== 'test') {
        console.log('✅ Redis Cache: Connected and Ready');
    }
});

redisClient.on('end', () => {
    redisClient.isReadyStatus = false;
    redisClient.isReady = false;
    if (process.env.NODE_ENV !== 'test') {
        console.log('🔌 Redis: Connection closed');
    }
});

/**
 * ASYNC CONNECTION INITIALIZER
 * This prevents "Client is closed" errors by ensuring the connect()
 * is called only once and handled correctly.
 * In test runs without a Redis server configured, skip the connection attempt
 * to avoid hanging the suite on a localhost timeout.
 */
const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (err) {
        if (process.env.NODE_ENV !== 'test') {
            console.error('❌ Redis Connection Failed:', err);
        }
    }
};

const shouldSkipRedisInTest = process.env.NODE_ENV === 'test' && !process.env.REDIS_URL;
if (!shouldSkipRedisInTest) {
    connectRedis();
}

module.exports = redisClient;