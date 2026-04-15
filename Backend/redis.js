const redis = require('redis');

const redisClient = redis.createClient({
    // Use the explicit IPv4 address to avoid 'ECONNREFUSED' on some Windows setups
    url: 'redis://127.0.0.1:6379' 
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err.message));

// Log when it successfully connects
redisClient.on('connect', () => console.log('✅ Redis Search Cache: Connected'));

redisClient.connect();

module.exports = redisClient;