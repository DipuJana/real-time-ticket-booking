import { cacheService } from "../cache/service.js";
import { CacheKeys } from "../cache/utils/cacheKey.js";
import { redis } from "../../../config/redis.js";

export class CacheInvalidationService {
  async invalidateEventCache(eventId) {
    const keys = [
      CacheKeys.event(eventId),
      CacheKeys.eventDetail(eventId),
      CacheKeys.eventsList('*'),
      CacheKeys.eventsSearch('*'),
    ];

    await this.deleteKeysWithWildcard(keys);
    console.log('Invalid caches for event with id: ${eventId}');
  }
  async deleteKeysWithWildcard(keys) {
    const pipeline = redis.pipeline();
    for (const key of keys) {
      if (key.includes('*')) {
        const keys = await redis.keys(key);
        if (keys.length > 0) {
          pipeline.del(...keys);
        }
      }
      else {
        pipeline.del(key);
      }
    }
    await pipeline.exec();
  }
}


export const cacheInvalidationService = new CacheInvalidationService();