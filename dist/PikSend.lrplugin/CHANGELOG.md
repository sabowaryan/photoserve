# Changelog - PikSend Lightroom Plugin

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Coming Soon
- Features planned for future releases

---

## [1.1.0] - 2026-02-05

### Added

#### New API Architecture
- **Plugin-dedicated endpoints**: New optimized API for the plugin with API key authentication
- **Direct upload to Cloudinary**: Images are now uploaded directly to Cloudinary for better performance
- **Batch registration**: Images are registered in galleries in batches of 10 to reduce API calls
- **PikSendCloudinaryUpload module**: New module to handle Cloudinary upload and batch registration
- **Automated test suite**: `test-plugin-api.lua` file to validate new features
- **User testing guide**: Complete documentation for testing version 1.1.0

#### New API Endpoints
- `POST /api/plugin/auth/validate`: Optimized token validation for the plugin
- `POST /api/plugin/galleries`: Gallery creation with API key authentication
- `POST /api/plugin/galleries/[id]/images`: Batch image registration in a gallery

### Changed

#### Performance
- **50-60% faster upload speed**: Thanks to direct Cloudinary upload and batch registration
- **Reduced API calls**: Images are registered in batches of 10 instead of one by one
- **Better memory management**: Separate upload and registration to avoid timeouts

#### API Client (PikSendAPI.lua)
- Changed base URL: `https://piksend.com` (instead of `https://api.piksend.com`)
- `validateToken()`: Now uses `POST /api/plugin/auth/validate`
- `createGallery()`: Now uses `POST /api/plugin/galleries`
- Added `uploadToCloudinary()`: Direct upload to Cloudinary
- Added `uploadImagesToGallery()`: Batch image registration
- `checkForUpdates()`: Now uses `GET /api/plugin/version`

#### Gallery Management (PikSendGallery.lua)
- Updated gallery parameters:
  - `isPublic` → `allow_downloads`
  - `expiresAt` → `expires_at`
  - Added `allow_comments`
  - Added `watermark_enabled`

#### Retry and Error Handling
- Automatic retry for Cloudinary upload (3 attempts)
- Automatic retry for batch registration (3 attempts)
- Clearer and more actionable error messages

### Technical

#### Architecture
- Separation of upload (Cloudinary) and registration (PikSend API)
- Batch upload to optimize performance
- Better progress management with batch display

#### Tests
- Automated test suite to validate new endpoints
- Token validation tests
- Gallery creation tests
- Cloudinary upload tests
- Batch registration tests
- Gallery retrieval tests

#### Compatibility
- Compatible with Lightroom Classic 11.0+
- Compatible with previous versions of PikSend API
- Transparent migration from version 1.0.0

### Fixed
- Timeout when uploading large batches (> 20 images)
- Progress loss during network errors
- Unclear error messages during upload failures

### Documentation
- New user testing guide (`TESTING-GUIDE-V1.1.md`)
- API migration documentation (`PLUGIN-API-MIGRATION.md`)
- Automated test suite (`test-plugin-api.lua`)

### Migration Notes

#### Migration from v1.0.0

Migration is **automatic and transparent**. No user action required.

**Internal changes**:
- Base API URL changed from `https://api.piksend.com` to `https://piksend.com`
- Plugin endpoints changed to use new dedicated endpoints
- Upload flow changed: upload to Cloudinary then batch registration

**Benefits**:
- 50-60% faster upload
- Better error handling
- Less risk of timeouts
- Better user experience

**Compatibility**:
- Galleries created with v1.0.0 remain accessible
- Images uploaded with v1.0.0 remain accessible
- No data loss

---

## [1.0.0] - 2024-01-15

### Added

#### Authentication and Login
- Authentication via API Token
- Direct link to token generation page in PikSend dashboard
- Token validation with PikSend API
- Active Pro plan verification
- Secure token storage in Lightroom preferences
- Ability to logout and change account

#### Gallery Management
- Display list of existing galleries
- Create new galleries from Lightroom
- Search galleries by name
- Sort galleries by creation date (descending)
- Manual gallery list refresh
- Gallery list caching for improved performance
- Password protection configuration
- Expiration date configuration
- Watermark configuration
- Visibility configuration (public/private)
- Share link generation
- Basic statistics display (views, downloads)

#### Photo Export
- Select individual photos or entire collections
- Export format configuration (JPEG, PNG, TIFF)
- JPEG quality configuration (1-100)
- Export resolution configuration
- Resize configuration (max width/height)
- Custom watermark application with position and opacity
- Save and load configuration presets
- Upload photos to PikSend API via multipart/form-data
- Parallel upload (maximum 3 simultaneous uploads by default, configurable 1-5)
- Upload error handling with retry option
- Automatic cleanup of temporary folder after upload

#### Progress Tracking
- Global progress bar (percentage)
- Display uploaded photos / total
- Display uploaded size / total size
- Display upload speed (MB/s)
- Display estimated time remaining
- Display status of each photo (pending, in progress, completed, error)
- Ability to pause upload
- Ability to resume upload after pause
- Ability to cancel ongoing upload
- Success message with gallery link

#### Publish Service and Synchronization
- Integration as Publish Service in Lightroom
- Create Published Collections linked to PikSend galleries
- Automatic marking of photos "to publish" when added to collection
- Upload only modified photos during publication
- Detection of changes made to photos (editing, metadata)
- Delete photos from PikSend gallery from Lightroom
- Metadata synchronization (title, description, keywords)
- Display publication status of each photo
- Ability to republish all photos in a collection
- Synchronization conflict management

#### Metadata Management
- Transfer photo title (IPTC Title)
- Transfer description (IPTC Caption)
- Transfer keywords (IPTC Keywords)
- Transfer copyright information
- Transfer EXIF data (camera, lens, ISO, aperture, speed)
- Choose which metadata to transfer
- Respect privacy settings (geolocation)
- Automatic alt-text generation based on title and description
- Set default metadata for all photos in an export
- Preserve photo order in Lightroom collection

#### Error Handling and Logs
- Clear and actionable error messages
- Log all errors to log file
- Log debug information (API requests, responses, durations)
- Activatable/deactivatable debug mode
- Log file size limitation (max 10 MB, automatic rotation)
- Display API error messages
- Appropriate messages for connection errors
- Messages for storage quota reached
- Ability to export logs for technical support

#### Performance and Optimization
- Parallel upload (3 simultaneous uploads by default, configurable 1-5)
- Compress photos before upload if quality < 100
- Use cache to avoid re-uploading identical photos
- Calculate hash (MD5) of each photo to detect duplicates
- Retry system with exponential backoff
- Memory usage limitation (max 500 MB)
- Memory release after each upload
- Non-blocking interface during upload

#### Security and Privacy
- Communication with PikSend API only via HTTPS
- Encrypted API Token storage in Lightroom preferences
- No logging of API Token in clear text
- SSL certificate validation of PikSend API
- Delete temporary files after upload
- No data transfer to third-party servers
- Respect Lightroom privacy settings
- Ability to disable transfer of sensitive metadata

#### Updates and Maintenance
- Check for updates availability at Lightroom startup
- Notification when update is available
- Display release notes (changelog)
- Download link to new version
- Ability to disable update notifications
- Display current version in settings
- Manual update check

#### Documentation and Support
- Step-by-step installation guide with screenshots
- Detailed user guide
- FAQ with common issues
- "Help" link in interface pointing to documentation
- "Support" link to contact PikSend team
- Explanatory tooltips on complex settings

#### Localization
- English support (en)
- French support (fr)
- Extensible localization system

### Technical

#### Architecture
- Modular structure with separation of concerns
- REST API client for PikSend communication
- Cache system to optimize performance
- Log system with automatic rotation
- Robust error handling with automatic retry

#### Tests
- Unit tests for all modules
- Property-based testing for correctness validation
- Integration tests for complete flows
- Test coverage > 80% for critical modules

#### Compatibility
- Lightroom Classic 11.0 and later
- Windows 10/11 (64-bit)
- macOS 10.15 Catalina and later
- Lightroom SDK 6.0+
- Lua 5.1+

#### Dependencies
- json.lua - JSON parsing and generation (MIT License)
- LuaSocket - HTTP requests (provided by Lightroom)
- LuaFileSystem - File management (provided by Lightroom)

### Known Limitations
- Simultaneous upload limited to 5 files maximum
- Max size per photo: 500 MB (Pro plan limit)
- Upload timeout: 5 minutes per photo
- Local cache: 100 MB maximum
- Logs: 10 MB maximum with rotation

### Migration Notes
- First version - no migration needed

---

## Version Format

### [X.Y.Z] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Changes in existing features

#### Deprecated
- Features that will be removed in future versions

#### Removed
- Removed features

#### Fixed
- Bug fixes

#### Security
- Security vulnerability fixes

---

## Links

- [Documentation](https://piksend.com/docs/lightroom-plugin)
- [FAQ](https://piksend.com/faq/lightroom-plugin)
- [Support](mailto:support@piksend.com)
- [Download](https://piksend.com/downloads/lightroom-plugin)

---

**Version Legend**:
- **[Unreleased]**: Changes in development
- **[X.Y.Z]**: Published version with release date
