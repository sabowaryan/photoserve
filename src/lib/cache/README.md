# Domain Cache

In-memory cache for domain-to-photographer mappings with TTL support.

## Purpose

The domain cache reduces database queries for custom domain lookups in the middleware layer. When a request arrives with a custom domain, the middleware can check the cache first before querying the database.

## Features

- **In-memory storage**: Fast lookups with no external dependencies
- **TTL support**: Automatic expiration after 5 minutes (configurable)
- **Automatic cleanup**: Expired entries are removed on access and periodically
- **Simple API**: Three main methods: `get()`, `set()`, `invalidate()`

## Usage

```typescript
import * as domainCache from '@/lib/cache/domain-cache';

// Set a domain mapping
domainCache.set('photos.example.com', 'user-123', true);

// Get a domain mapping
const result = domainCache.get('photos.example.com');
if (result) {
  console.log(`Photographer: ${result.photographerId}`);
  console.log(`Verified: ${result.verified}`);
}

// Invalidate a domain (e.g., when configuration changes)
domainCache.invalidate('photos.example.com');

// Clear all cache entries
domainCache.clear();

// Get cache statistics
const stats = domainCache.getStats();
console.log(`Cache size: ${stats.size}`);
```

## API Reference

### `get(domain: string)`

Retrieves a cached domain mapping.

**Parameters:**
- `domain` - The custom domain to lookup

**Returns:**
- `{ photographerId: string, verified: boolean }` if cached and not expired
- `null` if not cached or expired

**Behavior:**
- Automatically removes expired entries on access
- Returns `null` for non-existent domains

### `set(domain: string, photographerId: string, verified: boolean)`

Stores a domain mapping in the cache.

**Parameters:**
- `domain` - The custom domain
- `photographerId` - The photographer's user ID
- `verified` - Whether the domain is verified

**Behavior:**
- Overwrites existing entries
- Resets TTL for updated entries
- Sets TTL to 5 minutes (300 seconds)

### `invalidate(domain: string)`

Removes a domain from the cache.

**Parameters:**
- `domain` - The custom domain to invalidate

**Use cases:**
- Domain configuration changes
- Domain verification status changes
- Domain removal

**Behavior:**
- Safe to call on non-existent domains (no-op)
- Idempotent (multiple calls have same effect as one)

### `clear()`

Removes all entries from the cache.

**Use cases:**
- Testing
- Manual cache reset
- System maintenance

### `getStats()`

Returns cache statistics.

**Returns:**
- `{ size: number, entries: number }` - Current cache size

**Use cases:**
- Monitoring
- Debugging
- Performance analysis

### `cleanupExpired()`

Manually removes all expired entries.

**Behavior:**
- Automatically called every 10 minutes
- Can be called manually for immediate cleanup
- Safe to call on empty cache

## Configuration

### TTL (Time-To-Live)

Default: **5 minutes** (300,000 milliseconds)

The TTL is configured in the module and applies to all cache entries. Entries are automatically expired and removed after the TTL period.

### Cache Key Format

Cache keys use the format: `domain:${domain}`

This prefix prevents collisions and makes it easy to identify cache entries.

### Automatic Cleanup

The cache automatically cleans up expired entries:
1. **On access**: When `get()` is called on an expired entry
2. **Periodically**: Every 10 minutes via `setInterval`

## Performance Characteristics

- **Get operation**: O(1) - constant time lookup
- **Set operation**: O(1) - constant time insertion
- **Invalidate operation**: O(1) - constant time deletion
- **Clear operation**: O(n) - linear time where n is cache size
- **Cleanup operation**: O(n) - linear time where n is cache size

## Memory Considerations

The cache stores entries in memory. Each entry contains:
- Domain string
- Photographer ID string
- Verification boolean
- Cached timestamp (number)
- TTL (number)

For typical usage (hundreds of custom domains), memory usage is negligible. The automatic cleanup prevents unbounded growth.

## Testing

The cache includes comprehensive test coverage:

- **Unit tests** (27 tests): Test specific behaviors and edge cases
- **Property tests** (11 tests): Test universal properties across all inputs

Run tests:
```bash
npm test src/lib/cache/
```

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 9.1**: Domain-to-photographer mapping cache
- **Requirement 9.2**: 5-minute TTL configuration
- **Requirement 9.3**: Cache invalidation on configuration changes
- **Requirement 9.8**: Cache reuse across multiple requests

## Integration

The domain cache is used by:

1. **Middleware** (`src/middleware.ts`): Looks up custom domains before querying database
2. **Domain API endpoints**: Invalidates cache when domain configuration changes
3. **Domain removal**: Clears cache entries when domains are removed

## Example: Middleware Integration

```typescript
import * as domainCache from '@/lib/cache/domain-cache';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  
  // Check cache first
  let photographer = domainCache.get(hostname);
  
  if (!photographer) {
    // Cache miss - query database
    photographer = await db.getPhotographerByDomain(hostname);
    
    if (photographer) {
      // Store in cache for future requests
      domainCache.set(hostname, photographer.id, photographer.verified);
    }
  }
  
  // Use photographer data...
}
```

## Example: API Integration

```typescript
import * as domainCache from '@/lib/cache/domain-cache';

// When domain is removed
export async function DELETE(request: Request) {
  const domain = await getDomainFromRequest(request);
  
  // Remove from database
  await db.removeDomain(domain);
  
  // Invalidate cache
  domainCache.invalidate(domain);
  
  return Response.json({ success: true });
}
```

## Monitoring

Use `getStats()` to monitor cache performance:

```typescript
// Log cache statistics periodically
setInterval(() => {
  const stats = domainCache.getStats();
  console.log(`Domain cache size: ${stats.size} entries`);
}, 60000); // Every minute
```

## Future Enhancements

Potential improvements for future versions:

1. **Configurable TTL**: Allow different TTL values per entry
2. **LRU eviction**: Limit cache size with least-recently-used eviction
3. **Metrics**: Track hit rate, miss rate, and latency
4. **Distributed cache**: Use Redis for multi-instance deployments
5. **Warming**: Pre-populate cache on startup

## License

Part of the PikSend custom domain implementation.
