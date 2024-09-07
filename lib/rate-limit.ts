import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function rateLimit(ip: string) {
  const limit = 5;
  const duration = 60; // 1 minute

  const requests = await redis.incr(`ratelimit:${ip}`);
  if (requests === 1) {
    await redis.expire(`ratelimit:${ip}`, duration);
  }

  const remaining = Math.max(0, limit - requests);
  const success = requests <= limit;

  return { success, remaining };
}