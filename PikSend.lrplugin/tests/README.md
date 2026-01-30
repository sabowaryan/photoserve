# PikSend Lightroom Plugin - Tests

This directory contains the test suite for the PikSend Lightroom plugin, including both unit tests and property-based tests.

## Test Structure

```
tests/
├── run_tests.lua                           # Test runner
├── test_auth_token_storage.lua             # Unit tests for token storage
├── test_property_auth_token_storage.lua    # Property-based tests for token storage
├── test_auth_dialog.lua                    # Unit tests for authentication dialog
└── README.md                               # This file
```

## Running Tests

### Run All Tests

```bash
cd PikSend.lrplugin
lua tests/run_tests.lua
```

### Run Specific Test File

```bash
cd PikSend.lrplugin
lua tests/run_tests.lua tests/test_auth_token_storage.lua
lua tests/run_tests.lua tests/test_property_auth_token_storage.lua
lua tests/run_tests.lua tests/test_auth_dialog.lua
```

### Run Individual Test File Directly

```bash
cd PikSend.lrplugin
lua tests/test_auth_token_storage.lua
lua tests/test_property_auth_token_storage.lua
lua tests/test_auth_dialog.lua
```

## Test Types

### Unit Tests

Unit tests verify specific examples, edge cases, and error conditions. They test:
- Specific input/output pairs
- Boundary conditions
- Error handling
- Integration between components

**Example**: `test_auth_token_storage.lua`
- Tests token round-trip with specific tokens
- Tests empty/nil token handling
- Tests clear functionality
- Tests authentication state

**Example**: `test_auth_dialog.lua`
- Tests dialog display and structure
- Tests field validation (empty token, nil token)
- Tests token validation flow
- Tests Pro plan verification
- Tests error handling and messages
- Tests logout confirmation
- Tests authentication state management

### Property-Based Tests

Property-based tests verify universal properties that should hold for ALL valid inputs. They:
- Run minimum 100 iterations per property
- Generate random test data
- Verify invariants across all inputs
- Catch edge cases that unit tests might miss

**Example**: `test_property_auth_token_storage.lua`
- **Property 4**: Round-trip du stockage de token (100 iterations)
- **Property 4.1**: Token persistence across multiple operations (100 iterations)
- **Property 4.2**: Different tokens are stored distinctly (100 iterations)
- **Property 4.3**: Clear operation removes token completely (100 iterations)
- **Property 4.4**: Empty/nil tokens are not stored (50 iterations)
- **Property 4.5**: Tokens are encrypted in storage (100 iterations)

## Property Tests Details

### Property 4: Round-trip du stockage de token

**Validates**: Requirements 2.6

**Property**: For ANY token, after saving and retrieving, the token is identical.

**Test Strategy**:
- Generate random tokens with various characteristics:
  - Short tokens (8-16 chars)
  - Medium tokens (32-64 chars)
  - Long tokens (100-200 chars)
  - Tokens with special characters
  - Tokens with spaces
  - Tokens with high ASCII characters
  - Realistic API tokens (alphanumeric with dashes)
- Save each token using `saveToken()`
- Retrieve using `getToken()`
- Verify retrieved token equals original token

**Iterations**: 100

### Additional Properties Tested

#### Property 4.1: Token persistence across multiple operations
- Verifies token remains stable across multiple save/retrieve cycles
- Tests 2-5 cycles per iteration
- **Iterations**: 100

#### Property 4.2: Different tokens are stored distinctly
- Verifies saving different tokens doesn't cause collisions
- Tests that second token properly replaces first
- **Iterations**: 100

#### Property 4.3: Clear operation removes token completely
- Verifies `clearToken()` properly removes stored token
- Tests that `getToken()` returns nil after clear
- **Iterations**: 100

#### Property 4.4: Empty/nil tokens are not stored
- Verifies invalid tokens are rejected
- Tests both nil and empty string
- **Iterations**: 50

#### Property 4.5: Tokens are encrypted in storage
- Verifies tokens are not stored in plain text
- Checks that stored value differs from original
- Verifies decryption works correctly
- **Iterations**: 100

## Test Results

All tests should pass with exit code 0:

```
Properties Tested: 6
Properties Passed: 6
Properties Failed: 0
Total Iterations:  550

✓ ALL PROPERTIES HOLD - Tests Passed!
```

## Adding New Tests

### Adding Unit Tests

1. Create a new test file: `test_<module_name>.lua`
2. Add test cases using the simple test framework:
   ```lua
   describe("Module Name", function()
     it("should do something", function()
       assert.equals(actual, expected, "message")
     end)
   end)
   ```
3. Add the file to `run_tests.lua` in the `testFiles` array

### Adding Property-Based Tests

1. Create a new test file: `test_property_<module_name>.lua`
2. Define properties from the design document
3. Use `runPropertyTest()` helper:
   ```lua
   runPropertyTest(
     'Property description',
     propertyNumber,
     iterations,
     function(iteration)
       -- Test logic
       return success, message, testData
     end
   )
   ```
4. Add the file to `run_tests.lua` in the `testFiles` array

## Test Framework

The tests use a minimal custom test framework that doesn't require external dependencies. This allows tests to run in any Lua 5.1+ environment.

### Available Assertions

- `assert.is_true(value, message)`
- `assert.is_false(value, message)`
- `assert.equals(actual, expected, message)`
- `assert.is_nil(value, message)`
- `assert.is_not_nil(value, message)`

## Notes

- Tests mock Lightroom SDK modules (`LrPrefs`, `LrMD5`, etc.) for standalone execution
- Property-based tests use a custom implementation (no external dependencies)
- All tests should be runnable outside of Lightroom for CI/CD integration
- For full integration testing, tests should also be run within Lightroom environment

## Requirements Coverage

### Task 2.1: Token Storage Functions

✅ **Unit Tests**: `test_auth_token_storage.lua`
- Validates: Requirements 2.6, 11.2
- Tests: 19 test cases
- Status: PASSING

### Task 2.2: Property-Based Tests for Token Storage

✅ **Property 4: Round-trip du stockage de token**
- Validates: Requirements 2.6
- Iterations: 100+
- Status: PASSING

✅ **Additional Properties**
- Token persistence (100 iterations)
- Token distinctness (100 iterations)
- Clear operation (100 iterations)
- Invalid token rejection (50 iterations)
- Token encryption (100 iterations)

**Total Iterations**: 550
**All Properties**: PASSING

### Task 2.4: Unit Tests for Authentication Dialog

✅ **Unit Tests**: `test_auth_dialog.lua`
- Validates: Requirements 2.1, 2.2
- Tests: 27 test cases covering:
  - Dialog display and structure
  - Field validation (empty/nil tokens)
  - Token validation flow
  - Pro plan verification
  - Error message display
  - Success flow
  - Logout confirmation
  - Authentication state management
- Status: PASSING

**Test Coverage Summary**:
- Dialog title and action verb: ✅
- Dialog structure and contents: ✅
- Empty token validation: ✅
- Invalid token handling: ✅
- Non-Pro user rejection: ✅
- Successful Pro user login: ✅
- User cancellation: ✅
- Logout confirmation: ✅
- Logout cancellation: ✅
- ensureAuthenticated flow: ✅
- Token expiration handling: ✅
- validateCurrentToken: ✅
- isAuthenticated state: ✅
