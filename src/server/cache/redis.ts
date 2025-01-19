import Redis from 'ioredis';
import { GraphQLResolveInfo } from 'graphql';

// Create Redis client
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    // If you need authentication:
    // password: process.env.REDIS_PASSWORD,
});

// Default cache duration (1 hour)
const DEFAULT_EXPIRATION = 3600; // in seconds

// Interface for cache options
interface CacheOptions {
    duration?: number;      // Cache duration in seconds
    keyPrefix?: string;     // Prefix for cache keys
}

/**
 * Generate a cache key based on operation and arguments
 * @param operation - The GraphQL operation name
 * @param args - The arguments passed to the resolver
 * @returns A unique cache key
 */
export function generateCacheKey(operation: string, args: any): string {
    return `graphql:${operation}:${JSON.stringify(args)}`;
}

/**
 * Cache middleware for GraphQL resolvers
 * @param resolver - The original resolver function
 * @param options - Caching options
 */
export function withCache(
    resolver: Function,
    options: CacheOptions = {}
) {
    const { duration = DEFAULT_EXPIRATION, keyPrefix = '' } = options;

    return async (parent: any, args: any, context: any, info: GraphQLResolveInfo) => {
        // Generate cache key
        const operationName = info.fieldName;
        const cacheKey = keyPrefix + generateCacheKey(operationName, args);

        try {
            // Try to get data from cache
            const cachedData = await redis.get(cacheKey);
            
            if (cachedData) {
                console.log(`Cache hit for ${cacheKey}`);
                return JSON.parse(cachedData);
            }

            // If not in cache, execute resolver
            console.log(`Cache miss for ${cacheKey}`);
            const result = await resolver(parent, args, context, info);

            // Store in cache
            await redis.setex(
                cacheKey,
                duration,
                JSON.stringify(result)
            );

            return result;
        } catch (error) {
            console.error('Cache error:', error);
            // If cache fails, just execute resolver
            return resolver(parent, args, context, info);
        }
    };
}

/**
 * Clear cache for a specific operation
 * @param operation - The operation name
 * @param args - The arguments (optional)
 */
export async function clearCache(operation: string, args?: any): Promise<void> {
    const pattern = args 
        ? generateCacheKey(operation, args)
        : `graphql:${operation}:*`;
    
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Cleared cache for ${pattern}`);
    }
}

// Export Redis client for direct use if needed
export { redis };
