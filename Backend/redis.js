const redis = require('redis');
// IMPORTANT: Ensure dotenv is loaded if this file is run independently
require('dotenv').config(); 

const redisClient = redis.createClient({
    // CHANGE THIS LINE: Use the environment variable!
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' 
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
    // This helps you see if it's still trying to hit 127.0.0.1
});

redisClient.on('connect', () => console.log('✅ Redis Search Cache: Connected'));

// Added a property to check status in your controllers later
redisClient.isReadyStatus = false;
redisClient.on('ready', () => {
    redisClient.isReadyStatus = true;
});

redisClient.connect().catch(console.error);

module.exports = redisClient;