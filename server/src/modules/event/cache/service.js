import { redis } from '../../../config/redis.js';


export class CacheService {
  defaultTtl = 3600;
  defaultPrefix = 'cache:';

  async get(key) {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data);
    }
    catch (error) {
      console.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, options = {}) {
    try {
      const ttl = options.ttl || this.defaultTtl;
      const serializedValue = JSON.stringify(value);
      await redis.setex(key, ttl, serializedValue);
      return true;
    }
    catch (error) {
      console.error(`Error setting cache for key ${key}:`, error);
      return false;
    }
  }

  async setMany(items) {
    try {
      const pipeline = redis.pipeline();
      for (const item of items) {
        const ttl = item.ttl || this.defaultTtl;
        const serializedValue = JSON.stringify(item.value);
        pipeline.setex(item.key, ttl, serializedValue);
      }
      await pipeline.exec();
      return true;
    }
    catch (error) {
      console.error(`Error setting multiple cache items:`, error);
      return false;
    }
  }

  async delete(key) {
    try {
      const result = await redis.del(key);
      return result > 0;
    }
    catch (error) {
      console.error(`Error deleting cache for key ${key}:`, error);
      return false;
    }
  }

  async deleteMany(keys) {
    try {
      if (keys.length === 0) return true;
      const result = await redis.del(...keys);
      return result > 0;
    }
    catch (error) {
      console.error(`Error deleting multiple cache items:`, error);
      return false;
    }
  }

  async deletePattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return true;
      const result = await redis.del(...keys);
      return result > 0;
    }
    catch (error) {
      console.error(`Error deleting cache items with pattern ${pattern}:`, error);
      return false;
    }
  }

  async getOrSet(key, fetcher, options = {}) {
    try {
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }
      const data = await fetcher();
      await this.set(key, data, options);
      return data;
    }
    catch (error) {
      throw error;
    }
  }

  async getMany(keys) {
    try {
      const values = await redis.mget(...keys);
      return values.map(val => val ? JSON.parse(val) : null);
    } catch (error) {
      console.error('Cache get many error:', error);
      return keys.map(() => null);
    }
  }

  async exists(key) {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async getTTL(key) {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  }

  async increment(key, amount = 1) {
    try {
      return await redis.incrby(key, amount);
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }


  async expire(key, seconds) {
    try {
      const result = await redis.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  async clearAll() {
    try {
      await redis.flushall();
      console.log('All cache cleared');
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }
}

export const cacheService = new CacheService();