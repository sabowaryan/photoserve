# Dependencies Documentation

This document describes the dependencies required for the PikSend Lightroom plugin.

## Lightroom SDK

The plugin is built using the Adobe Lightroom SDK.

- **Version**: 6.0+
- **Minimum Version**: 6.0
- **Compatibility**: Lightroom Classic 11.0 and later

### SDK Modules Used

The plugin imports and uses the following Lightroom SDK modules:

- `LrHttp` - HTTP requests and URL handling
- `LrView` - UI components and dialogs
- `LrBinding` - Property binding for UI
- `LrDialogs` - Dialog boxes and user prompts
- `LrTasks` - Asynchronous task management
- `LrFileUtils` - File system operations
- `LrPathUtils` - Path manipulation
- `LrDate` - Date and time utilities
- `LrPrefs` - Plugin preferences storage
- `LrFunctionContext` - Function context management
- `LrMD5` - MD5 hash calculation

## Lua Version

- **Lua Version**: 5.1+
- **Note**: Lightroom uses Lua 5.1, so the plugin is compatible with this version

## External Libraries

### JSON Library (json.lua)

A simple JSON encoder/decoder is included in the plugin.

- **File**: `json.lua`
- **Purpose**: Encode/decode JSON for API communication
- **Status**: Included in plugin (custom implementation)

**Note**: For production use, consider replacing with a more robust library like:
- `dkjson` (David Kolf's JSON module for Lua)
- `cjson` (C-based JSON library)

### LuaSocket (Optional - Not Currently Used)

LuaSocket was mentioned in the requirements but is not currently used because:
- Lightroom SDK provides `LrHttp` for HTTP requests
- `LrHttp` is sufficient for the plugin's needs
- Avoids external binary dependencies

**If needed in the future**:
- **Purpose**: Advanced HTTP/HTTPS operations, socket programming
- **Installation**: Would need to be bundled with the plugin
- **Platform**: Requires platform-specific binaries (Windows .dll, macOS .so)

### LuaFileSystem (Optional - Not Currently Used)

LuaFileSystem was mentioned in the requirements but is not currently used because:
- Lightroom SDK provides `LrFileUtils` and `LrPathUtils`
- These SDK modules cover all file system needs
- Avoids external binary dependencies

**If needed in the future**:
- **Purpose**: Advanced file system operations
- **Installation**: Would need to be bundled with the plugin
- **Platform**: Requires platform-specific binaries

### LuaCrypto (Future Enhancement)

Token encryption is mentioned in the code but not yet implemented.

**Current Status**: 
- Tokens are stored in Lightroom preferences (not encrypted)
- TODO: Implement encryption before production release

**If implemented**:
- **Purpose**: Encrypt API tokens before storage
- **Options**:
  - Use Lightroom's built-in secure storage (if available)
  - Bundle LuaCrypto library
  - Implement simple XOR or Base64 obfuscation (not true encryption)

## Dependency Management

### Current Approach

The plugin currently uses a **zero external dependencies** approach:
- All functionality uses Lightroom SDK modules
- JSON library is custom-implemented and included
- No binary dependencies required
- Works cross-platform without compilation

### Benefits

1. **Easy Installation**: Users just copy the plugin folder
2. **Cross-Platform**: No platform-specific binaries
3. **Maintenance**: No external library updates needed
4. **Compatibility**: Works with all Lightroom versions 11.0+

### Future Considerations

If external libraries are needed:

1. **Bundle with Plugin**: Include library files in plugin folder
2. **Platform Detection**: Load appropriate binary for Windows/macOS
3. **Fallback**: Provide pure Lua alternatives where possible
4. **Documentation**: Update installation instructions

## Development Dependencies

For development and testing:

- **Busted**: Lua testing framework (for unit tests)
- **LuaCheck**: Static analyzer for Lua code
- **LDoc**: Documentation generator for Lua

These are not required for plugin operation, only for development.

## API Dependencies

The plugin communicates with the PikSend API:

- **Base URL**: https://api.piksend.com
- **Protocol**: HTTPS only
- **Authentication**: Bearer token
- **Format**: JSON

### API Endpoints Used

- `POST /api/auth/validate-token` - Token validation
- `GET /api/galleries` - List galleries
- `POST /api/galleries` - Create gallery
- `PUT /api/galleries/:id` - Update gallery
- `POST /api/galleries/:id/images` - Upload image
- `DELETE /api/galleries/:id/images/:imageId` - Delete image
- `GET /api/galleries/:id/stats` - Gallery statistics
- `GET /api/plugin/lightroom/version` - Check for updates

## Security Considerations

1. **HTTPS Only**: All API communication uses HTTPS
2. **Token Storage**: Currently stored in Lightroom preferences (TODO: encrypt)
3. **Token Sanitization**: Tokens are removed from log files
4. **No Third-Party**: No communication with servers other than PikSend

## Platform-Specific Notes

### Windows

- Plugin folder: `%APPDATA%\Adobe\Lightroom\Modules\`
- Log file: Inside plugin folder
- No special requirements

### macOS

- Plugin folder: `~/Library/Application Support/Adobe/Lightroom/Modules/`
- Log file: Inside plugin folder
- No special requirements

## Updating Dependencies

If dependencies need to be updated:

1. **Test Thoroughly**: Ensure compatibility with all supported Lightroom versions
2. **Update Documentation**: Update this file and README
3. **Version Bump**: Increment plugin version number
4. **Changelog**: Document changes in changelog

## Troubleshooting

### Missing Module Errors

If you see errors like "module 'X' not found":
- Ensure all .lua files are in the plugin folder
- Check file permissions
- Verify plugin folder structure is intact

### HTTP Errors

If HTTP requests fail:
- Check internet connection
- Verify firewall settings allow Lightroom to access api.piksend.com
- Check if HTTPS is being used (not HTTP)

### Platform-Specific Issues

If plugin works on one platform but not another:
- Check for platform-specific code paths
- Verify file path separators (/ vs \)
- Test on both Windows and macOS before release
