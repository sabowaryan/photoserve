# PikSend Plugin Structure

This document describes the structure and organization of the PikSend Lightroom plugin.

## Directory Structure

```
PikSend.lrplugin/
├── Info.lua                          # Plugin metadata and configuration
├── PikSendAPI.lua                    # REST API client
├── PikSendAuth.lua                   # Authentication management
├── PikSendGallery.lua                # Gallery management
├── PikSendUpload.lua                 # Upload management
├── PikSendMetadata.lua               # Metadata extraction
├── PikSendLogger.lua                 # Logging system
├── PikSendCache.lua                  # Caching and optimization
├── PikSendUtils.lua                  # Utility functions
├── PikSendUI.lua                     # UI components
├── PikSendExportServiceProvider.lua  # Export Service Provider
├── PikSendPublishServiceProvider.lua # Publish Service Provider (stub)
├── PikSendPluginInfoProvider.lua     # Plugin info and settings
├── json.lua                          # JSON encoder/decoder
├── README.md                         # User documentation
├── DEPENDENCIES.md                   # Dependencies documentation
├── STRUCTURE.md                      # This file
├── resources/
│   └── README.md                     # Resources documentation
└── localization/
    ├── en.lua                        # English translations
    └── fr.lua                        # French translations
```

## Module Descriptions

### Core Modules

#### Info.lua
- Plugin metadata (name, version, identifier)
- SDK version requirements
- Service provider declarations
- Entry point for Lightroom

#### PikSendAPI.lua
- REST API client for PikSend service
- HTTP request handling
- JSON encoding/decoding
- API endpoints:
  - Authentication
  - Gallery management
  - Image upload
  - Statistics
  - Updates

#### PikSendAuth.lua
- User authentication
- Token storage and retrieval
- Login/logout dialogs
- Session management
- Token validation

#### PikSendGallery.lua
- Gallery listing and caching
- Gallery creation
- Gallery search and filtering
- Title validation
- Share link generation

#### PikSendUpload.lua
- Parallel upload management
- Progress tracking
- Pause/resume/cancel functionality
- Retry logic with exponential backoff
- Upload state management

#### PikSendMetadata.lua
- IPTC metadata extraction
- EXIF data extraction
- Alt-text generation
- GPS data handling
- Privacy settings

#### PikSendLogger.lua
- Multi-level logging (ERROR, WARN, INFO, DEBUG)
- Log file management
- Automatic log rotation
- Token sanitization
- Debug mode toggle

#### PikSendCache.lua
- MD5 hash calculation
- Duplicate detection
- Upload cache management
- Cache statistics
- Compression utilities

#### PikSendUtils.lua
- File size formatting
- Duration formatting
- Filename sanitization
- URL validation
- String utilities
- Table utilities
- Version comparison

#### PikSendUI.lua
- Reusable UI components
- Progress dialogs
- Error dialogs
- Confirmation dialogs
- Settings sections

### Service Providers

#### PikSendExportServiceProvider.lua
- Export Service implementation
- Export dialog configuration
- Photo rendering and export
- Upload orchestration
- Progress tracking

#### PikSendPublishServiceProvider.lua
- Publish Service implementation (stub)
- Will be implemented in future tasks
- Handles collection synchronization

#### PikSendPluginInfoProvider.lua
- Plugin information display
- Settings panel
- Log management UI
- Cache management UI
- Update checking

### Supporting Files

#### json.lua
- JSON encoder/decoder
- Simple implementation for API communication
- Handles objects, arrays, strings, numbers, booleans, null

#### localization/en.lua
- English translations
- UI strings
- Error messages
- Dialog text

#### localization/fr.lua
- French translations
- Complete translation of all UI strings

## Module Dependencies

```
Info.lua
  └── Declares service providers

PikSendExportServiceProvider.lua
  ├── PikSendAPI
  ├── PikSendAuth
  ├── PikSendGallery
  ├── PikSendUpload
  ├── PikSendMetadata
  ├── PikSendLogger
  └── PikSendUI

PikSendAPI.lua
  └── json

PikSendAuth.lua
  └── PikSendAPI

PikSendGallery.lua
  ├── PikSendAPI
  └── PikSendAuth

PikSendUpload.lua
  └── PikSendAPI

PikSendMetadata.lua
  └── json

PikSendLogger.lua
  └── (no dependencies)

PikSendCache.lua
  └── (no dependencies)

PikSendUtils.lua
  └── (no dependencies)

PikSendUI.lua
  ├── PikSendUtils
  ├── PikSendAuth
  └── PikSendGallery
```

## Data Flow

### Export Flow

1. User selects photos in Lightroom
2. User chooses File > Export > PikSend
3. `PikSendExportServiceProvider` displays dialog
4. User authenticates (if needed) via `PikSendAuth`
5. User selects/creates gallery via `PikSendGallery`
6. User configures export settings
7. User clicks Export
8. Lightroom renders photos
9. `PikSendMetadata` extracts metadata from each photo
10. `PikSendUpload` manages parallel uploads
11. `PikSendAPI` uploads each photo to PikSend
12. Progress displayed via `PikSendUI`
13. Completion message shown with gallery link

### Authentication Flow

1. User clicks Login button
2. `PikSendAuth.showLoginDialog()` displays dialog
3. User enters API token
4. `PikSendAPI.validateToken()` validates with API
5. If valid and Pro plan:
   - Token saved via `PikSendAuth.saveToken()`
   - User info saved to preferences
   - Success message shown
6. If invalid or not Pro:
   - Error message shown
   - User can retry

### Gallery Management Flow

1. User clicks Refresh or New Gallery
2. `PikSendGallery.getGalleries()` fetches from API
3. Results cached for 5 minutes
4. Gallery list displayed in dropdown
5. For new gallery:
   - `PikSendGallery.showCreateGalleryDialog()` shown
   - User enters details
   - `PikSendAPI.createGallery()` creates via API
   - Cache cleared and list refreshed

## Configuration Storage

### Lightroom Preferences

Stored via `LrPrefs.prefsForPlugin()`:

- `apiToken` - User's API token (TODO: encrypt)
- `userName` - User's name
- `userEmail` - User's email
- `userPlan` - User's plan type
- `debugMode` - Debug mode enabled/disabled
- `uploadCache` - Cache of uploaded photos (hash -> imageId)
- `lastGalleryId` - Last selected gallery

### Export Presets

Stored in Lightroom export presets:

- `selectedGallery` - Selected gallery ID
- `exportFormat` - Export format (jpeg/png/tiff)
- `jpegQuality` - JPEG quality (1-100)
- `includeMetadata` - Include metadata flag
- `includeGPS` - Include GPS flag

## Logging

### Log Levels

1. **ERROR** - Critical errors that prevent operation
2. **WARN** - Warnings that don't prevent operation
3. **INFO** - General information (default level)
4. **DEBUG** - Detailed debugging information (requires debug mode)

### Log Format

```
[YYYY-MM-DD HH:MM:SS] [LEVEL] Module: Message
```

Example:
```
[2024-01-15 14:30:45] [ERROR] PikSendAPI: Upload failed for photo IMG_1234.jpg - Network timeout
[2024-01-15 14:30:46] [INFO] PikSendUpload: Retrying upload (attempt 2/3)
[2024-01-15 14:30:50] [DEBUG] PikSendAPI: POST /api/galleries/abc123/images - 200 OK (1.2s)
```

### Log Location

- File: `PikSend.lrplugin/PikSend.log`
- Max size: 10 MB (auto-rotates to .old)
- Accessible via Plugin Manager > View Logs

## Error Handling

### Strategy

1. **Graceful Degradation**: Plugin continues to work even if some features fail
2. **User-Friendly Messages**: Clear, actionable error messages
3. **Automatic Retry**: Network errors retry with exponential backoff
4. **Detailed Logging**: All errors logged for troubleshooting
5. **Token Sanitization**: Sensitive data removed from logs

### Error Categories

1. **Authentication Errors**: Invalid token, expired token, non-Pro plan
2. **Network Errors**: Timeout, connection lost, server error
3. **Validation Errors**: Invalid title, file too large, format not supported
4. **Upload Errors**: Individual photo upload failures
5. **System Errors**: File write errors, memory issues, SDK errors

## Performance Considerations

### Parallel Uploads

- Default: 3 concurrent uploads
- Configurable: 1-5 concurrent uploads
- Prevents overwhelming the API
- Balances speed and reliability

### Caching

- Gallery list cached for 5 minutes
- Upload cache prevents duplicate uploads
- Cache automatically cleaned (30 days)

### Memory Management

- Temporary files deleted after upload
- Large files handled in chunks
- Memory limit: 500 MB

## Security

### Token Storage

- Stored in Lightroom preferences
- TODO: Implement encryption
- Never logged in plain text

### HTTPS Only

- All API communication uses HTTPS
- URLs validated to ensure HTTPS
- No communication with third parties

### Privacy

- GPS data excluded by default
- User controls metadata inclusion
- No telemetry or tracking

## Future Enhancements

### Planned Features

1. **Publish Service**: Full implementation for collection sync
2. **Token Encryption**: Secure token storage
3. **Watermark Support**: Apply watermarks during export
4. **Batch Operations**: Bulk gallery management
5. **Advanced Presets**: Save and load export configurations
6. **Statistics Dashboard**: View upload statistics

### Potential Improvements

1. **Resume Interrupted Uploads**: Save state and resume after restart
2. **Smart Compression**: Optimize file size based on content
3. **Conflict Resolution**: Handle sync conflicts intelligently
4. **Multi-Account Support**: Switch between multiple PikSend accounts
5. **Offline Mode**: Queue uploads when offline

## Testing

### Test Coverage

- Unit tests for each module
- Property-based tests for correctness properties
- Integration tests for complete workflows
- Manual testing on Windows and macOS

### Test Framework

- Busted for Lua unit testing
- Custom property test generators
- Mock API for offline testing

## Maintenance

### Version Updates

1. Update `VERSION` in `Info.lua`
2. Update version in `README.md`
3. Add entry to changelog
4. Test on all supported platforms
5. Package and distribute

### Log Maintenance

- Logs auto-rotate at 10 MB
- Users can clear logs via settings
- Old cache entries auto-cleaned

### Cache Maintenance

- Upload cache cleaned after 30 days
- Gallery cache expires after 5 minutes
- Users can manually clear cache

## Support

For issues or questions:
- Documentation: https://piksend.com/docs/lightroom
- Support: https://piksend.com/support
- Logs: Available via Plugin Manager
