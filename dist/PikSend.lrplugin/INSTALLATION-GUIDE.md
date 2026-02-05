# Installation Guide - PikSend Plugin for Adobe Lightroom Classic

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Downloading the Plugin](#downloading-the-plugin)
3. [Installation on Windows](#installation-on-windows)
4. [Installation on macOS](#installation-on-macos)
5. [Initial Configuration](#initial-configuration)
6. [Installation Verification](#installation-verification)
7. [Troubleshooting](#troubleshooting)
8. [Uninstallation](#uninstallation)

---

## Prerequisites

Before installing the PikSend plugin, ensure your system meets the following requirements:

### Required Software

- **Adobe Lightroom Classic** version 11.0 or later
  - To check your version: `Help > System Info` in Lightroom
  - Tested versions: 11.0, 12.0, 13.0

### Supported Operating Systems

- **Windows**: Windows 10 (64-bit) or Windows 11
- **macOS**: macOS 10.15 (Catalina) or later

### PikSend Account

- An active **PikSend Pro** account is required
- If you don't have a Pro account, visit [piksend.com/pricing](https://piksend.com/pricing)

### Internet Connection

- A stable internet connection is required for:
  - Authentication
  - Photo uploads
  - Gallery synchronization

---

## Downloading the Plugin

### Step 1: Access PikSend Dashboard

1. Log in to your PikSend account at [piksend.com](https://piksend.com)
2. Go to your **Dashboard**
3. Navigate to **Settings > Integrations**

### Step 2: Download the .lrplugin File

1. In the **Adobe Lightroom** section, click **Download Plugin**
2. The `PikSend.lrplugin` file will be downloaded (approximately 2-5 MB)
3. Note the download location (usually your **Downloads** folder)

> **Note**: The `.lrplugin` file is actually a folder containing all plugin files. Do not unzip it!

---

## Installation on Windows

### Method 1: Installation via Plug-in Manager (Recommended)

#### Step 1: Open the Plug-in Manager

1. Launch **Adobe Lightroom Classic**
2. In the main menu, click **File > Plug-in Manager**

![Plug-in Manager Windows](resources/screenshots/windows-plugin-manager.png)

#### Step 2: Add the Plugin

1. In the Plug-in Manager, click the **Add** button at the bottom left
2. A file selection window opens
3. Navigate to the folder where you downloaded `PikSend.lrplugin`
4. Select the `PikSend.lrplugin` folder (not a file inside it)
5. Click **Select Folder**

#### Step 3: Verify Installation

1. The **PikSend** plugin should now appear in the plug-in list
2. Verify that the status shows **"Enabled"** (checkbox checked)
3. You should see:
   - **Name**: PikSend
   - **Version**: 1.0.0 (or current version)
   - **Status**: Enabled

![Plugin installed Windows](resources/screenshots/windows-plugin-installed.png)

4. Click **Done** to close the Plug-in Manager

### Method 2: Manual Installation

If Method 1 doesn't work, you can install manually:

1. Copy the `PikSend.lrplugin` folder to:
   ```
   C:\Users\[YourName]\AppData\Roaming\Adobe\Lightroom\Modules
   ```
2. If the `Modules` folder doesn't exist, create it
3. Restart Lightroom Classic
4. Follow the verification steps above

---

## Installation on macOS

### Method 1: Installation via Plug-in Manager (Recommended)

#### Step 1: Open the Plug-in Manager

1. Launch **Adobe Lightroom Classic**
2. In the main menu, click **File > Plug-in Manager**

![Plug-in Manager macOS](resources/screenshots/macos-plugin-manager.png)

#### Step 2: Add the Plugin

1. In the Plug-in Manager, click the **Add** button at the bottom left
2. A Finder window opens
3. Navigate to the folder where you downloaded `PikSend.lrplugin`
4. Select the `PikSend.lrplugin` folder (it appears as a folder, not a file)
5. Click **Choose**

#### Step 3: Authorize the Plugin (macOS 10.15+)

On macOS Catalina and later, you may need to authorize the plugin:

1. If a security alert appears, click **OK**
2. Open **System Preferences > Security & Privacy**
3. In the **General** tab, click **Allow Anyway** next to the message about PikSend
4. Restart Lightroom Classic

![macOS Authorization](resources/screenshots/macos-security-allow.png)

#### Step 4: Verify Installation

1. The **PikSend** plugin should now appear in the plug-in list
2. Verify that the status shows **"Enabled"** (checkbox checked)
3. You should see:
   - **Name**: PikSend
   - **Version**: 1.0.0 (or current version)
   - **Status**: Enabled

![Plugin installed macOS](resources/screenshots/macos-plugin-installed.png)

4. Click **Done** to close the Plug-in Manager

### Method 2: Manual Installation

If Method 1 doesn't work:

1. Copy the `PikSend.lrplugin` folder to:
   ```
   ~/Library/Application Support/Adobe/Lightroom/Modules
   ```
2. To access the Library folder (hidden by default):
   - In Finder, press **Cmd + Shift + G**
   - Paste the path above
   - Click **Go**
3. If the `Modules` folder doesn't exist, create it
4. Restart Lightroom Classic
5. Follow the verification steps above

---

## Initial Configuration

Once the plugin is installed, you need to configure it for use.

### Step 1: Generate an API Token

1. Open your browser and log in to [piksend.com](https://piksend.com)
2. Go to **Dashboard > Settings > API**
3. Click **Generate New Token**
4. Give the token a name (e.g., "Lightroom Plugin")
5. Click **Create**
6. **Copy the token** (it will only be displayed once!)

![API Token Generation](resources/screenshots/api-token-generation.png)

> **Important**: Keep this token secure. Never share it with anyone.

### Step 2: Authentication in Lightroom

#### Option A: Via Export Service

1. In Lightroom, select one or more photos
2. Click **File > Export** (or press **Ctrl+Shift+E** / **Cmd+Shift+E**)
3. In the export window, at the top, select **PikSend** from the dropdown list
4. In the **PikSend Account** section, click **Login**

![Export to PikSend](resources/screenshots/export-dialog.png)

5. A login window opens
6. Paste your **API Token** in the provided field
7. Click **OK**

![Login Dialog](resources/screenshots/login-dialog.png)

#### Option B: Via Publish Service

1. In Lightroom's left panel, find the **Publish Services** section
2. Click the **+** button next to **Publish Services**
3. Select **PikSend** from the list
4. Follow steps 5-7 from Option A above

### Step 3: Authentication Verification

After entering your token:

1. The plugin automatically validates your token
2. If the token is valid, you'll see a message: **"Login successful! Welcome [Your Name]"**
3. Your username will appear in the **PikSend Account** section

![Authentication Success](resources/screenshots/auth-success.png)

If the token is invalid:
- Verify that you copied the complete token
- Ensure the token hasn't expired
- Generate a new token if necessary

---

## Installation Verification

To confirm the plugin is working correctly:

### Test 1: Verify Plugin Presence

1. Open **File > Plug-in Manager**
2. Verify that **PikSend** is in the list and **Enabled**
3. Click **Plug-in Info** to see:
   - Plugin version
   - Lightroom compatibility
   - Connection status

### Test 2: Verify Export Service

1. Select a photo
2. Click **File > Export**
3. Verify that **PikSend** appears in the export destination list

### Test 3: Verify Publish Service

1. In the **Publish Services** panel, verify that **PikSend** is present
2. Expand the PikSend section
3. You should see the option to create a new published collection

### Test 4: Retrieve Galleries

1. In the PikSend export window, click **Refresh** in the Gallery section
2. Your existing galleries should appear in the dropdown list
3. If you don't have galleries yet, click **New Gallery** to create one

![Gallery List](resources/screenshots/gallery-list.png)

---

## Troubleshooting

### Issue 1: Plugin Doesn't Appear in Manager

**Symptoms**:
- PikSend plugin is not visible in Plug-in Manager
- Lightroom doesn't detect the plugin

**Solutions**:

1. **Check file location**
   - Ensure the `PikSend.lrplugin` folder is intact (not unzipped)
   - The folder must contain all `.lua` files and the `Info.lua` file

2. **Restart Lightroom**
   - Close Lightroom Classic completely
   - Wait a few seconds
   - Relaunch Lightroom

3. **Reinstall the plugin**
   - Remove the plugin from Plug-in Manager
   - Download the file again from PikSend dashboard
   - Reinstall following the installation steps

4. **Check permissions (macOS)**
   - Open **System Preferences > Security & Privacy**
   - Verify that Lightroom has necessary permissions
   - Authorize the plugin if prompted

5. **Check permissions (Windows)**
   - Right-click on `PikSend.lrplugin` folder > **Properties**
   - **Security** tab, verify you have read permissions
   - Uncheck **Read-only** if necessary

### Issue 2: "Incompatible Lightroom Version" Error

**Symptoms**:
- Error message: "This plugin requires Lightroom Classic 11.0 or later"
- Plugin refuses to load

**Solutions**:

1. **Check your Lightroom version**
   - Open **Help > System Info**
   - Look for the **Application Version** line
   - Version must be 11.0 or higher

2. **Update Lightroom**
   - Open **Help > Updates**
   - Install available updates
   - Restart Lightroom after update

3. **Verify you're using Lightroom Classic**
   - The plugin only works with **Lightroom Classic**
   - It does NOT work with Lightroom CC (cloud version)

### Issue 3: "Invalid Token" Authentication Error

**Symptoms**:
- Message: "Invalid API token. Please verify and try again."
- Unable to log in

**Solutions**:

1. **Verify the token**
   - Ensure you copied the complete token (no spaces at beginning/end)
   - Token should start with a specific prefix (e.g., `pks_`)

2. **Generate a new token**
   - Return to [piksend.com/dashboard/settings/api](https://piksend.com/dashboard/settings/api)
   - Delete the old token
   - Generate a new token
   - Copy it and try again

3. **Check your plan**
   - The plugin requires a **Pro** account
   - Check your plan at [piksend.com/dashboard/settings/subscription](https://piksend.com/dashboard/settings/subscription)
   - Upgrade to Pro if necessary

4. **Check internet connection**
   - Test your connection by opening [piksend.com](https://piksend.com)
   - Verify your firewall isn't blocking Lightroom

### Issue 4: "Pro Plan Required" Error

**Symptoms**:
- Message: "The Lightroom plugin is reserved for Pro users"
- Authentication successful but features blocked

**Solutions**:

1. **Check your subscription**
   - Log in to [piksend.com/dashboard](https://piksend.com/dashboard)
   - Check your current plan in **Settings > Subscription**

2. **Upgrade to Pro plan**
   - Visit [piksend.com/pricing](https://piksend.com/pricing)
   - Select the Pro plan
   - Complete the upgrade process

3. **Check renewal**
   - If you had a Pro plan, verify it hasn't expired
   - Check your payment information

### Issue 5: Galleries Won't Load

**Symptoms**:
- Gallery list is empty
- Error message when refreshing
- Timeout when loading

**Solutions**:

1. **Check internet connection**
   - Test your connection
   - Try opening [piksend.com](https://piksend.com) in a browser

2. **Refresh manually**
   - Click the **Refresh** button in the Gallery section
   - Wait a few seconds

3. **Clear cache**
   - Close Lightroom
   - Delete the cache file:
     - **Windows**: `C:\Users\[YourName]\AppData\Roaming\Adobe\Lightroom\PikSend.cache`
     - **macOS**: `~/Library/Application Support/Adobe/Lightroom/PikSend.cache`
   - Relaunch Lightroom

4. **Check logs**
   - Open the log file: `PikSend.lrplugin/PikSend.log`
   - Look for recent errors
   - Contact support with logs if necessary

### Issue 6: Photo Upload Failures

**Symptoms**:
- Photos won't upload
- "Network timeout" or "Upload failed" error
- Upload stuck at 0%

**Solutions**:

1. **Check file sizes**
   - Limit is **500 MB per photo** for Pro plan
   - Reduce quality or resolution if necessary

2. **Check connection**
   - Test your upload speed at [speedtest.net](https://speedtest.net)
   - Slow connection can cause timeouts

3. **Reduce concurrent uploads**
   - In export settings, reduce number of parallel uploads
   - Try 1 or 2 instead of 3

4. **Retry upload**
   - Plugin allows retrying failed photos
   - Click **Retry** for photos with errors

5. **Check storage space**
   - Check your quota at [piksend.com/dashboard](https://piksend.com/dashboard)
   - Free up space if necessary

### Issue 7: "Permission Denied" Error (macOS)

**Symptoms**:
- Permission error message
- Plugin can't write temporary files
- Error during export

**Solutions**:

1. **Allow Full Disk Access**
   - Open **System Preferences > Security & Privacy**
   - **Privacy** tab
   - Select **Full Disk Access**
   - Add **Adobe Lightroom Classic** to the list
   - Check the box to enable it
   - Restart Lightroom

2. **Check temporary folder permissions**
   - Open Terminal
   - Run: `chmod -R 755 ~/Library/Application\ Support/Adobe/Lightroom/`

### Issue 8: Plugin is Slow or Freezes Lightroom

**Symptoms**:
- Lightroom becomes slow when using plugin
- Interface freezes
- Infinite loading wheel

**Solutions**:

1. **Reduce concurrent uploads**
   - Export settings > Concurrent uploads: reduce to 1 or 2

2. **Close other applications**
   - Free up RAM
   - Close unnecessary applications

3. **Check memory usage**
   - Plugin is limited to 500 MB RAM
   - If uploading very large photos, reduce quality

4. **Disable debug mode**
   - If enabled, debug mode can slow down the plugin
   - Disable it in settings

5. **Update plugin**
   - Check if a new version is available
   - Updates often include performance optimizations

### Issue 9: SSL/HTTPS Error

**Symptoms**:
- Message: "SSL certificate verification failed"
- Secure connection error
- Unable to connect to API

**Solutions**:

1. **Check system date and time**
   - Incorrect date/time can cause SSL errors
   - Synchronize with a time server

2. **Update system**
   - **Windows**: Windows Update
   - **macOS**: Software Update

3. **Check firewall/antivirus**
   - Some antivirus software blocks HTTPS connections
   - Add an exception for Lightroom and piksend.com

4. **Contact support**
   - If problem persists, contact support@piksend.com
   - Include plugin logs

### Getting Additional Help

If none of these solutions resolve your issue:

1. **Consult complete documentation**
   - [User Guide](USER-GUIDE.md)
   - [FAQ](FAQ.md)

2. **Enable debug mode**
   - In plugin settings, enable **Debug Mode**
   - Reproduce the problem
   - Check the `PikSend.log` file

3. **Contact support**
   - Email: support@piksend.com
   - Include:
     - Lightroom version
     - Operating system
     - Detailed problem description
     - Log file (if possible)

4. **Community forum**
   - Visit [community.piksend.com](https://community.piksend.com)
   - Search for solutions or ask your question

---

## Uninstallation

If you wish to uninstall the plugin:

### On Windows

1. Open **File > Plug-in Manager**
2. Select **PikSend** from the list
3. Click **Remove** at the bottom left
4. Confirm removal
5. Restart Lightroom

**Manual cleanup (optional)**:
```
Delete the following files:
- C:\Users\[YourName]\AppData\Roaming\Adobe\Lightroom\Modules\PikSend.lrplugin
- C:\Users\[YourName]\AppData\Roaming\Adobe\Lightroom\PikSend.cache
- C:\Users\[YourName]\AppData\Roaming\Adobe\Lightroom\PikSend.log
```

### On macOS

1. Open **File > Plug-in Manager**
2. Select **PikSend** from the list
3. Click **Remove** at the bottom left
4. Confirm removal
5. Restart Lightroom

**Manual cleanup (optional)**:
```
Delete the following files:
- ~/Library/Application Support/Adobe/Lightroom/Modules/PikSend.lrplugin
- ~/Library/Application Support/Adobe/Lightroom/PikSend.cache
- ~/Library/Application Support/Adobe/Lightroom/PikSend.log
```

### Revoke API Token

For maximum security, revoke the API token:

1. Log in to [piksend.com/dashboard](https://piksend.com/dashboard)
2. Go to **Settings > API**
3. Find the token used for Lightroom
4. Click **Revoke**
5. Confirm revocation

---

## Next Steps

Now that the plugin is installed and configured:

1. **Consult the [User Guide](USER-GUIDE.md)** to learn how to:
   - Create and manage galleries
   - Export photos to PikSend
   - Use Publish Service for synchronization
   - Configure export settings

2. **Explore advanced features**:
   - Custom export presets
   - Automatic watermarks
   - Bidirectional synchronization
   - Metadata management

3. **Join the community**:
   - Forum: [community.piksend.com](https://community.piksend.com)
   - Video tutorials: [piksend.com/tutorials](https://piksend.com/tutorials)

---

## Version Information

- **Guide version**: 1.0.0
- **Last updated**: January 2024
- **Compatible with**: PikSend Plugin 1.0.0+

For release notes and complete changelog, visit [piksend.com/changelog](https://piksend.com/changelog)

---

**Need help?** Contact us at support@piksend.com or visit [piksend.com/support](https://piksend.com/support)
