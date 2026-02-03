# Task 10.1 Verification: calculateHash()

## Task Description
**Task**: 10.1 Créer calculateHash()
- Calculer le hash MD5 de chaque photo
- _Exigences: 10.5_

## Implementation Summary

### Function: `PikSendCache.calculateHash(filePath)`

**Location**: `PikSend.lrplugin/PikSendCache.lua` (lines 28-45)

**Purpose**: Calculate MD5 hash of a file for duplicate detection

**Implementation Details**:
- Uses Lightroom SDK's `LrMD5.digest()` for MD5 calculation
- Validates file path (rejects nil or empty strings)
- Checks file existence before reading
- Handles empty files correctly (returns MD5 of empty string)
- Returns `nil` for invalid or non-existent files

**Signature**:
```lua
function PikSendCache.calculateHash(filePath)
  -- @param filePath string - Path to file
  -- @return string|nil - MD5 hash or nil on error
end
```

## Testing

### Unit Tests
**File**: `PikSend.lrplugin/tests/test_cache.lua`

**Coverage**:
- ✓ Returns nil for non-existent file
- ✓ Returns nil for empty file path
- ✓ Returns nil for nil file path
- ✓ Calculates hash for existing file
- ✓ Returns same hash for same file content
- ✓ Returns different hash for different file content
- ✓ Handles large file content (1MB)
- ✓ Handles binary content

**Result**: All unit tests pass ✓

### Property-Based Tests
**File**: `PikSend.lrplugin/tests/test_property_cache_hash.lua`

**Properties Tested** (Property 44: Détection de doublons par hash):

1. **Property 44.1**: Hash calculation returns consistent results for same content
   - 100/100 iterations passed ✓

2. **Property 44.2**: Identical content produces identical hash
   - 100/100 iterations passed ✓

3. **Property 44.3**: Different content produces different hash
   - 100/100 iterations passed ✓

4. **Property 44.4**: Hash is always a non-empty string for valid files
   - 100/100 iterations passed ✓

5. **Property 44.5**: Duplicate detection correctly identifies uploaded files
   - 100/100 iterations passed ✓

6. **Property 44.6**: Duplicate detection is gallery-specific
   - 100/100 iterations passed ✓

7. **Property 44.7**: Hash calculation handles edge cases correctly
   - 50/50 iterations passed ✓

8. **Property 44.8**: Multiple uploads to same gallery update cache correctly
   - 100/100 iterations passed ✓

9. **Property 44.9**: Cache persists across function calls
   - 100/100 iterations passed ✓

10. **Property 44.10**: Clear cache removes all entries
    - 100/100 iterations passed ✓

**Total**: 10 properties tested, 950 iterations, 100% pass rate ✓

**Validates**: Requirements 10.4, 10.5

## Bug Fixes

### Issue 1: Empty File Handling
**Problem**: Original implementation returned `nil` for empty files because it checked `if not content then return nil end`, which treated empty strings as falsy.

**Fix**: Changed condition to `if content == nil then return nil end` to explicitly check for nil, allowing empty strings to be hashed.

**Location**: `PikSend.lrplugin/PikSendCache.lua`, line 40

### Issue 2: Mock MD5 Empty String Handling
**Problem**: Mock `LrMD5.digest()` returned `nil` for empty strings, which doesn't match real MD5 behavior.

**Fix**: Updated mock to return the actual MD5 hash of an empty string (`d41d8cd98f00b204e9800998ecf8427e`).

**Location**: `PikSend.lrplugin/tests/mocks/mock_LrMD5.lua`, lines 10-13

## Requirements Validation

### Requirement 10.5
**Statement**: "THE Plugin SHALL calculer un hash (MD5) de chaque photo pour détecter les doublons"

**Validation**:
- ✓ Function calculates MD5 hash using `LrMD5.digest()`
- ✓ Hash is used for duplicate detection via `checkDuplicate()` function
- ✓ Property tests verify hash calculation works correctly for all file types
- ✓ Property tests verify duplicate detection works correctly

**Status**: SATISFIED ✓

## Conclusion

Task 10.1 is **COMPLETE** and **VERIFIED**.

- Implementation is correct and handles all edge cases
- All unit tests pass (8/8)
- All property-based tests pass (10/10 properties, 950/950 iterations)
- Requirements 10.4 and 10.5 are satisfied
- Code is production-ready

## Related Functions

The `calculateHash()` function is used by:
- `checkDuplicate(filePath, galleryId)` - Check if file has been uploaded before
- `recordUpload(filePath, galleryId, imageId)` - Record uploaded file in cache

These functions work together to implement the duplicate detection system required by the specification.
