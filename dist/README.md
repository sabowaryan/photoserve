# PikSend Lightroom Plugin v1.1.0

Official PikSend plugin for Adobe Lightroom Classic.

## 📦 Package Contents

This folder contains the PikSend v1.1.0 plugin ready to be installed in Lightroom Classic.

```
dist/
└── PikSend.lrplugin/          # Plugin folder to install
    ├── Info.lua               # Plugin metadata
    ├── VERSION.txt            # Version information
    ├── CHANGELOG.md           # Version history
    ├── README.md              # User guide
    ├── *.lua                  # Plugin modules
    ├── localization/          # Translation files
    └── resources/             # Resources (icons, logos)
```

## 🚀 Quick Installation

### Windows

1. Download the `PikSend.lrplugin` folder
2. Open Lightroom Classic
3. Go to **File > Plug-in Manager**
4. Click **Add**
5. Select the `PikSend.lrplugin` folder
6. Click **Add Plug-in**

### macOS

1. Download the `PikSend.lrplugin` folder
2. Open Lightroom Classic
3. Go to **File > Plug-in Manager**
4. Click **Add**
5. Select the `PikSend.lrplugin` folder
6. Click **Add Plug-in**

## 🔑 Configuration

1. Generate an API Token from your PikSend dashboard: https://piksend.com/dashboard/settings/api-keys
2. In Lightroom, go to **Library > Publish Services > PikSend**
3. Click **Set Up**
4. Enter your API Token
5. Click **Validate**

## ✨ What's New in v1.1.0

### Performance
- **50-60% faster uploads** thanks to direct Cloudinary upload
- **Batch registration**: Images are registered in groups of 10
- **90% fewer API calls**: Significant reduction in the number of requests

### Architecture
- New plugin-dedicated API endpoints
- Separation of upload (Cloudinary) and registration (PikSend)
- Better progress tracking

### Reliability
- Automatic retry for Cloudinary uploads (3 attempts)
- Automatic retry for batch registration (3 attempts)
- Clearer and more actionable error messages

## 📚 Documentation

- **Installation Guide**: `PikSend.lrplugin/INSTALLATION-GUIDE.md`
- **User Guide**: `PikSend.lrplugin/USER-GUIDE.md`
- **Quick Start Guide**: `PikSend.lrplugin/START-HERE.md`
- **Testing Guide v1.1**: `PikSend.lrplugin/TESTING-GUIDE-V1.1.md`
- **Troubleshooting Guide**: `PikSend.lrplugin/TESTING-GUIDE.md`
- **Complete Changelog**: `PikSend.lrplugin/CHANGELOG.md`

## 🔧 System Requirements

### Software
- Adobe Lightroom Classic 11.0 or higher
- Stable internet connection

### Operating System
- **Windows**: Windows 10/11 (64-bit)
- **macOS**: macOS 10.15 Catalina or higher

### PikSend Account
- Active PikSend account
- Active Pro plan (required for API)
- Valid API Token

## 📊 Performance Metrics

### Upload Time (5 MB images)

| Number of Images | v1.0.0 | v1.1.0 | Improvement |
|------------------|--------|--------|-------------|
| 3 images         | ~45s   | ~20s   | 55%         |
| 10 images        | ~2m30s | ~1m    | 60%         |
| 20 images        | ~5m    | ~2m    | 60%         |

### API Calls

| Action           | v1.0.0    | v1.1.0   | Reduction |
|------------------|-----------|----------|-----------|
| Upload 10 images | 10 calls  | 1 call   | 90%       |
| Upload 20 images | 20 calls  | 2 calls  | 90%       |

## 🐛 Troubleshooting

### Common Issues

**"Invalid token"**
- Verify you copied the complete token
- Generate a new token from the dashboard
- Check that your Pro plan is active

**"Pro plan required"**
- Activate your Pro subscription on piksend.com
- Verify your subscription hasn't expired

**"Upload timeout"**
- Check your internet connection
- Reduce image size if very large (> 50 MB)
- Try again later

**"Cloudinary upload failed"**
- The plugin will automatically retry (3 attempts)
- Check your internet connection
- Contact support if the problem persists

### Logs

Logs are available at:
- **Windows**: `%APPDATA%\Adobe\Lightroom\Modules\PikSend.lrplugin\PikSend.log`
- **macOS**: `~/Library/Application Support/Adobe/Lightroom/Modules/PikSend.lrplugin/PikSend.log`

## 📞 Support

- **Documentation**: https://piksend.com/docs/lightroom
- **FAQ**: https://piksend.com/faq/lightroom-plugin
- **Email**: support@piksend.com
- **Discord**: https://discord.gg/piksend

## 📝 License

© 2024-2026 PikSend. All rights reserved.

This plugin is provided free to PikSend Pro plan users.

## 🔄 Updates

The plugin automatically checks for updates when Lightroom starts.

To check manually:
1. Open Lightroom Classic
2. Go to **File > Plug-in Manager**
3. Select "PikSend"
4. Click **Check for Updates**

## 🎯 Migration from v1.0.0

Migration is **automatic and transparent**. No action required.

- Galleries created with v1.0.0 remain accessible
- Images uploaded with v1.0.0 remain accessible
- No data loss

---

**Version**: 1.1.0  
**Release Date**: 2026-02-05  
**Build**: Production

Thank you for using PikSend! 🎉
