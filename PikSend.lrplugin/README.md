# PikSend Plugin for Adobe Lightroom Classic

Export your photos directly to PikSend from Adobe Lightroom Classic.

## Version

1.0.0

## Requirements

- Adobe Lightroom Classic 11.0 or later
- Windows 10/11 (64-bit) or macOS 10.15+
- Active internet connection
- PikSend Pro account

## Installation

1. Download the `PikSend.lrplugin` folder
2. Open Adobe Lightroom Classic
3. Go to File > Plug-in Manager
4. Click "Add" button
5. Navigate to and select the `PikSend.lrplugin` folder
6. Click "Done"

## Getting Started

1. **Get your API Token**
   - Log in to your PikSend account at https://piksend.com
   - Go to Settings > API
   - Generate a new API token

2. **Connect the Plugin**
   - In Lightroom, go to File > Export
   - Select "PikSend" as the export destination
   - Click "Login" and enter your API token
   - Click "Connect"

3. **Export Photos**
   - Select photos in Lightroom
   - Go to File > Export
   - Choose "PikSend" as export destination
   - Select or create a gallery
   - Configure export settings
   - Click "Export"

## Features

- **Direct Export**: Export photos directly from Lightroom to PikSend
- **Gallery Management**: Create and manage galleries from within Lightroom
- **Metadata Transfer**: Automatically transfer IPTC and EXIF metadata
- **Parallel Upload**: Upload multiple photos simultaneously for faster exports
- **Progress Tracking**: Real-time progress with speed and time estimates
- **Smart Caching**: Avoid re-uploading duplicate photos
- **Error Handling**: Automatic retry with exponential backoff

## Configuration

### Export Settings

- **Format**: JPEG, PNG, or TIFF
- **Quality**: JPEG quality from 1-100
- **Metadata**: Choose which metadata to include
- **GPS**: Optionally include or exclude GPS location data

### Plugin Settings

Access plugin settings via File > Plug-in Manager > PikSend

- **Debug Mode**: Enable detailed logging for troubleshooting
- **Log Management**: View and clear log files
- **Cache Management**: Clear upload cache and view statistics

## Troubleshooting

### Plugin doesn't appear in Lightroom

- Ensure you're using Lightroom Classic 11.0 or later
- Try restarting Lightroom after installation
- Check that the plugin folder is not corrupted

### Authentication fails

- Verify your API token is correct
- Ensure you have an active Pro plan
- Check your internet connection

### Upload fails

- Check your internet connection
- Verify the gallery still exists
- Check log files for detailed error messages
- Try reducing the number of concurrent uploads in settings

### View Logs

1. Go to File > Plug-in Manager
2. Select PikSend plugin
3. Click "View Logs" button
4. Logs are also saved to: `PikSend.lrplugin/PikSend.log`

## Support

- Documentation: https://piksend.com/docs/lightroom
- Support: https://piksend.com/support
- Website: https://piksend.com

## Privacy

The plugin:
- Only communicates with PikSend servers (api.piksend.com)
- Stores your API token securely in Lightroom preferences
- Does not share data with third parties
- Respects your privacy settings for GPS data

## License

Copyright © 2024 PikSend. All rights reserved.

This plugin is provided for use with PikSend Pro accounts only.

## Changelog

### Version 1.0.0 (2024)
- Initial release
- Export photos to PikSend galleries
- Gallery creation and management
- Metadata transfer (IPTC, EXIF)
- Parallel upload support
- Progress tracking
- Smart caching
- Error handling with retry
