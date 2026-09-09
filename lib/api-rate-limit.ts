type RateEntry = { count: number; resetAt: number };

const buckets = new Map<string, RateEntry>();

export const isRateLimited = (request: Request, bucket: string, limit: number, windowMs: number) => {
  const ip = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (current.count >= limit) return true;
  current.count += 1;
  return false;
};

