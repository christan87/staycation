import { redis } from './redis';

async function testRedisConnection() {
    try {
        // Test setting a value
        await redis.set('test-key', 'Hello from Staycation!');
        console.log('Successfully set test key');

        // Test getting the value
        const value = await redis.get('test-key');
        console.log('Retrieved value:', value);

        // Test deleting the value
        await redis.del('test-key');
        console.log('Successfully deleted test key');

        console.log('Redis connection test completed successfully! 🎉');
    } catch (error) {
        console.error('Redis connection test failed:', error);
    } finally {
        // Close the Redis connection
        await redis.quit();
    }
}

// Run the test
testRedisConnection();
