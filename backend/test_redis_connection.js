const Redis = require('ioredis');

async function testRedis() {
    const redis = new Redis({
        host: 'localhost',
        port: 6379,
        password: 'careermate_redis_pass' // Default from docker-compose
    });

    try {
        await redis.set('test_key', 'Hello Redis');
        const value = await redis.get('test_key');
        console.log('Retrieved value:', value);

        if (value === 'Hello Redis') {
            console.log('Redis connection successful!');
        } else {
            console.error('Value mismatch!');
            process.exit(1);
        }

        await redis.del('test_key');
        process.exit(0);
    } catch (error) {
        console.error('Redis connection failed:', error);
        process.exit(1);
    }
}

testRedis();
