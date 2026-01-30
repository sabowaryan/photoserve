# Development Environment Setup

This document describes the development environment setup for the PikSend Lightroom Plugin.

## Prerequisites

### Installed Software

1. **Lua 5.4.6**
   - Installed via: `winget install --id DEVCOM.Lua -e`
   - Location: `C:\Users\HP\AppData\Local\Programs\Lua`
   - Verify: `lua -v`

2. **LuaRocks 3.9.2** (Lua Package Manager)
   - Comes bundled with Lua installation
   - Verify: `luarocks --version`

3. **MinGW-w64 GCC 15.2.0** (C Compiler)
   - Installed via: MSYS2
   - Location: `C:\msys64\mingw64\bin`
   - Verify: `gcc --version`
   - Required for: Compiling native Lua modules

4. **Busted 2.3.0** (Testing Framework)
   - Installed via: `luarocks install busted`
   - Location: `C:\Users\HP\AppData\Roaming\luarocks\bin`
   - Verify: `busted --version`

### Environment Variables

The following paths have been added to the system PATH:

```
C:\msys64\mingw64\bin
C:\Users\HP\AppData\Roaming\luarocks\bin
```

## Development Tools

### Testing

#### Busted (Recommended)

Busted is a full-featured testing framework for Lua with support for:
- Describe/it style tests
- Before/after hooks
- Mocking and stubbing
- Code coverage
- Multiple output formats

**Run all tests:**
```bash
cd PikSend.lrplugin
busted
```

**Run specific test file:**
```bash
busted tests/test_auth_token_storage.lua
```

**Run with verbose output:**
```bash
busted --verbose
```

**Configuration:**
- Configuration file: `.busted`
- Test directory: `tests/`
- Test pattern: `test_*.lua`

#### Simple Test Runner (Alternative)

For environments without Busted, a simple test runner is provided:

```bash
cd PikSend.lrplugin
lua tests/run_tests.lua
```

This runner provides basic test functionality without external dependencies.

### Installed Lua Modules

The following Lua modules have been installed via LuaRocks:

1. **lua_cliargs 3.0.2** - Command-line argument parsing
2. **luasystem 0.6.3** - System utilities (compiled native module)
3. **dkjson 2.8** - JSON encoder/decoder
4. **say 1.4.1** - String formatting for assertions
5. **luassert 1.9.0** - Assertion library
6. **lua-term 0.8** - Terminal control (compiled native module)
7. **luafilesystem 1.9.0** - File system operations (compiled native module)
8. **penlight 1.15.0** - Lua utility libraries
9. **mediator_lua 1.1.2** - Event mediator pattern
10. **busted 2.3.0** - Testing framework

## Project Structure

```
PikSend.lrplugin/
├── .busted                    # Busted configuration
├── Info.lua                   # Plugin metadata
├── PikSend*.lua              # Plugin modules
├── json.lua                  # JSON library
├── tests/                    # Test directory
│   ├── run_tests.lua         # Simple test runner
│   ├── test_*.lua            # Test files
│   └── README.md             # Test documentation
├── localization/             # Translations
│   ├── en.lua
│   └── fr.lua
├── resources/                # Plugin resources
└── docs/                     # Documentation
```

## Running Tests

### Current Test Status

✅ **Authentication Token Storage Tests** (19/19 passed)
- Token round-trip
- Token encryption
- Clear token
- Get token when none stored
- Save empty/nil token
- Multiple round-trips
- isAuthenticated checks
- Clear removes user data

### Test Coverage

Tests are organized by module:

- `test_auth_token_storage.lua` - Authentication and token management
- More tests to be added as development progresses

### Writing Tests

Tests use the Busted framework with describe/it syntax:

```lua
describe("Module Name", function()
  it("should do something", function()
    local result = someFunction()
    assert.equals(result, expected)
  end)
end)
```

### Property-Based Testing

For property-based tests (testing universal properties across many inputs):

```lua
describe("Property Tests", function()
  it("Property X: description", function()
    for i = 1, 100 do
      local input = generateRandomInput()
      local result = functionUnderTest(input)
      assert.is_true(propertyHolds(result))
    end
  end)
end)
```

## Development Workflow

1. **Make changes** to plugin modules
2. **Write tests** for new functionality
3. **Run tests** with `busted`
4. **Fix issues** until all tests pass
5. **Test in Lightroom** for integration testing
6. **Commit changes** with passing tests

## Lightroom Testing

While unit tests can be run with Busted, full integration testing requires Adobe Lightroom Classic:

1. Open Lightroom Classic
2. Go to File > Plug-in Manager
3. Click "Add" and select the `PikSend.lrplugin` folder
4. Test plugin functionality within Lightroom

## Troubleshooting

### Lua not found

Refresh your terminal or PowerShell session to pick up PATH changes:

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### Busted not found

Ensure LuaRocks bin directory is in PATH:

```powershell
$env:Path = $env:Path + ";C:\Users\HP\AppData\Roaming\luarocks\bin"
```

### Compilation errors

Ensure MinGW-w64 is in PATH:

```powershell
$env:Path = $env:Path + ";C:\msys64\mingw64\bin"
```

### Module not found errors

Install missing modules with LuaRocks:

```bash
luarocks install <module-name>
```

## Additional Resources

- [Lua Documentation](https://www.lua.org/manual/5.4/)
- [LuaRocks Documentation](https://luarocks.org/)
- [Busted Documentation](https://lunarmodules.github.io/busted/)
- [Lightroom SDK Documentation](https://www.adobe.com/devnet/photoshoplightroom.html)

## Notes

- The plugin uses Lua 5.1 syntax for Lightroom compatibility, but tests run on Lua 5.4
- Native modules (luasystem, lua-term, luafilesystem) are compiled with MinGW-w64
- Tests are designed to work both with Busted and the simple test runner
- Property-based tests should run a minimum of 100 iterations

