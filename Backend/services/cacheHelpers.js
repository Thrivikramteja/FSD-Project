/**
 * cacheHelpers.js
 *
 * Centralised Redis cache-invalidation helpers.
 *
 * Design notes:
 *  - Pattern scans (keys()) are bounded to small, well-known namespaces.
 *    This is consistent with admin.controller.js's clearAdminCache() which
 *    already uses keys('admin:*').  We never scan all keys globally.
 *  - Every helper is safe to call even when Redis is not connected;
 *    errors are swallowed so that a Redis outage never breaks a mutation.
 */

const redisClient = require('../redis');

// ---------------------------------------------------------------------------
// Internal: delete an array of keys in one call (no-op if empty or if
// redisClient.del is unavailable, e.g. in test mocks that don't define it)
// ---------------------------------------------------------------------------
async function _delMany(keys) {
  if (typeof redisClient.del !== 'function') return;
  if (keys && keys.length > 0) {
    await redisClient.del(keys);
  }
}

// ---------------------------------------------------------------------------
// Internal: scan for keys matching a pattern and delete them all.
// Silently skips if redisClient.keys is unavailable (e.g. test mocks).
// ---------------------------------------------------------------------------
async function _scanAndDel(pattern) {
  if (typeof redisClient.keys !== 'function') return;
  const keys = await redisClient.keys(pattern);
  await _delMany(keys);
}

// ---------------------------------------------------------------------------
// invalidateFundraiserCaches(ngoId)
//
// Call after: fundraiser created, fundraiser donation received.
//
// Clears:
//   fund:*               — public fundraiser listing (all query/tag variants)
//   dash:ngo:<ngoId>     — NGO dashboard (fundraiser totals, ongoing list)
// ---------------------------------------------------------------------------
async function invalidateFundraiserCaches(ngoId) {
  try {
    await Promise.all([
      _scanAndDel('fund:*'),
      _delMany([`dash:ngo:${ngoId}`]),
    ]);
  } catch (err) {
    console.error('[Cache] invalidateFundraiserCaches error:', err.message);
  }
}

// ---------------------------------------------------------------------------
// invalidateNgoCaches()
//
// Call after: NGO profile edited, new event/fundraiser created.
//
// Clears:
//   ngos:*   — all paginated/search-variant NGO list pages
// ---------------------------------------------------------------------------
async function invalidateNgoCaches() {
  try {
    await _scanAndDel('ngos:*');
  } catch (err) {
    console.error('[Cache] invalidateNgoCaches error:', err.message);
  }
}

// ---------------------------------------------------------------------------
// invalidateDonorActivity(userId)
//
// Call after: donation made, event registered, profile edited.
//
// Clears:
//   user_activity:<userId>     — donor activity summary
//   user_apps:<userId>:p*      — paginated job-application pages
// ---------------------------------------------------------------------------
async function invalidateDonorActivity(userId) {
  try {
    await Promise.all([
      _delMany([`user_activity:${userId}`]),
      _scanAndDel(`user_apps:${userId}:p*`),
    ]);
  } catch (err) {
    console.error('[Cache] invalidateDonorActivity error:', err.message);
  }
}

// ---------------------------------------------------------------------------
// invalidateTicker()
//
// Call after: any new donation (money or fundraiser) is recorded.
//
// Clears:
//   ticker_data_latest   — public recent-donation ticker
// ---------------------------------------------------------------------------
async function invalidateTicker() {
  try {
    await _delMany(['ticker_data_latest']);
  } catch (err) {
    console.error('[Cache] invalidateTicker error:', err.message);
  }
}

module.exports = {
  invalidateFundraiserCaches,
  invalidateNgoCaches,
  invalidateDonorActivity,
  invalidateTicker,
};
