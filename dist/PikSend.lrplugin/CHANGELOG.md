# Changelog - PikSend Lightroom Plugin

All notable changes to the PikSend Lightroom Plugin.

---

## [1.1.0] - 2026-02-05

### 🚀 Performance Improvements
- **50-60% faster upload speed** thanks to direct Cloudinary integration
- **Batch processing**: Images are now registered in groups of 10 for better efficiency
- **Reduced API calls**: Optimized communication with PikSend servers
- **Better memory management**: Improved handling of large photo batches

### ✨ New Features
- Direct upload to Cloudinary for faster transfers
- Enhanced batch registration system
- Improved progress tracking with batch display
- Better error messages and retry logic

### 🔧 Improvements
- Automatic retry for failed uploads (up to 3 attempts)
- Clearer error messages with actionable solutions
- Better timeout handling for large batches
- Enhanced progress feedback during uploads

### 🐛 Bug Fixes
- Fixed timeout issues when uploading large batches (> 20 images)
- Fixed progress loss during network errors
- Improved error handling and recovery

### 📝 Migration Notes
Migration from v1.0.0 is **automatic and transparent**. No user action required.

**Benefits**:
- Significantly faster uploads
- More reliable transfers
- Better error handling
- Improved user experience

---

## [1.0.0] - 2025-12-15

### Initial Release

#### 🔐 Authentication
- Secure login via API Token
- Direct link to token generation in PikSend dashboard
- Pro plan verification

#### 📁 Gallery Management
- View and manage existing galleries
- Create new galleries directly from Lightroom
- Search and sort galleries
- Configure password protection, expiration dates, and watermarks
- Share links and view basic statistics

#### 📤 Photo Export
- Export photos in multiple formats (JPEG, PNG, TIFF)
- Configurable quality and resolution
- Custom watermark application
- Parallel uploads (up to 5 simultaneous)
- Save and load export presets

#### 📊 Progress Tracking
- Real-time progress bar with detailed statistics
- Upload speed and time remaining
- Individual photo status tracking
- Pause, resume, and cancel capabilities

#### 🔄 Publish Service
- Integration as Lightroom Publish Service
- Automatic synchronization of photo changes
- Metadata transfer (title, description, keywords, EXIF)
- Smart detection of modified photos

#### 🛡️ Security & Privacy
- HTTPS-only communication
- Encrypted token storage
- Automatic cleanup of temporary files
- Respect for privacy settings

#### 🌍 Localization
- English (en)
- French (fr)

#### ⚙️ Technical
- Compatible with Lightroom Classic 11.0+
- Windows 10/11 (64-bit) and macOS 10.15+
- Maximum photo size: 500 MB (Pro plan)
- Upload timeout: 5 minutes per photo

---

## Support

- [Documentation](https://piksend.com/docs/lightroom)
- [Help Center](https://piksend.com/help)
- [Email Support](mailto:support@piksend.com)
- [Download Plugin](https://piksend.com/download/lightroom)
- [FAQ](https://piksend.com/faq/lightroom)

