# Quick Troubleshooting Reference - PikSend Plugin

## Common Issues & Quick Fixes

### 🔴 Plugin Not Showing in Lightroom

**Quick Fix**:
1. Verify `PikSend.lrplugin` folder is intact (don't unzip it)
2. Restart Lightroom completely
3. Check File > Plug-in Manager

**Still not working?** See [Installation Guide](INSTALLATION-GUIDE.md#issue-1-plugin-doesnt-appear-in-manager)

---

### 🔴 "Invalid Token" Error

**Quick Fix**:
1. Copy the COMPLETE token (no spaces)
2. Token should start with `pks_`
3. Generate a new token at [piksend.com/dashboard/settings/api](https://piksend.com/dashboard/settings/api)

**Still not working?** See [Installation Guide](INSTALLATION-GUIDE.md#issue-3-invalid-token-authentication-error)

---

### 🔴 "Pro Plan Required" Error

**Quick Fix**:
1. Check your plan at [piksend.com/dashboard](https://piksend.com/dashboard)
2. Upgrade to Pro at [piksend.com/pricing](https://piksend.com/pricing)

**Still not working?** See [Installation Guide](INSTALLATION-GUIDE.md#issue-4-pro-plan-required-error)

---

### 🔴 Galleries Won't Load

**Quick Fix**:
1. Click **Refresh** button in Gallery section
2. Check internet connection
3. Clear cache:
   - **Windows**: Delete `C:\Users\[You]\AppData\Roaming\Adobe\Lightroom\PikSend.cache`
   - **macOS**: Delete `~/Library/Application Support/Adobe/Lightroom/PikSend.cache`
4. Restart Lightroom

**Still not working?** See [Installation Guide](INSTALLATION-GUIDE.md#issue-5-galleries-wont-load)

---

### 🔴 Upload Fails or Stuck at 0%

**Quick Fix**:
1. Check file size (max 500 MB per photo)
2. Reduce concurrent uploads to 1-2
3. Check internet connection speed
4. Click **Retry** for failed photos

**Still not working?** See [Installation Guide](INSTALLATION-GUIDE.md#issue-6-photo-upload-failures)

---

### 🔴 "Permission Denied" (macOS only)

**Quick Fix**:
1. Open **System Preferences > Security & Privacy**
2. Go to **Privacy > Full Disk Access**
3. Add **Adobe Lightroom Classic**
4. Check the box to enable
5. Restart Lightroom

**Still not working?** See [Installation Guide](INSTALLATION-GUIDE.md#issue-7-permission-denied-error-macos)

---

### 🔴 Lightroom Freezes or Slow

**Quick Fix**:
1. Reduce concurrent uploads to 1
2. Close other applications
3. Disable debug mode if enabled
4. Check for plugin updates

**Still not working?** See [Installation Guide](INSTALLATION-GUIDE.md#issue-8-plugin-is-slow-or-freezes-lightroom)

---

### 🔴 "Incompatible Lightroom Version"

**Quick Fix**:
1. Check version: **Help > System Info**
2. Must be Lightroom Classic 11.0+
3. Update via **Help > Updates**
4. Note: Lightroom CC (cloud) is NOT supported

**Still not working?** See [Installation Guide](INSTALLATION-GUIDE.md#issue-2-incompatible-lightroom-version-error)

---

### 🔴 SSL/HTTPS Connection Error

**Quick Fix**:
1. Check system date and time (sync with internet)
2. Update your operating system
3. Check firewall/antivirus settings
4. Add exception for Lightroom and piksend.com

**Still not working?** See [Installation Guide](INSTALLATION-GUIDE.md#issue-9-sslhttps-error)

---

## System Requirements Checklist

✅ **Lightroom Classic** 11.0 or later (NOT Lightroom CC)  
✅ **Windows** 10/11 (64-bit) OR **macOS** 10.15+  
✅ **PikSend Pro** account active  
✅ **Internet connection** stable  
✅ **API Token** generated and copied  

---

## Quick Diagnostic Steps

### Step 1: Check Plugin Status
```
File > Plug-in Manager
→ Is PikSend listed?
→ Is it Enabled (checkbox)?
→ What version is shown?
```

### Step 2: Check Authentication
```
File > Export > Select PikSend
→ Does it show "Connected as: [Name]"?
→ If not, click Login and enter token
```

### Step 3: Check Connectivity
```
In Export dialog:
→ Click Refresh in Gallery section
→ Do galleries load?
→ Can you create a new gallery?
```

### Step 4: Check Logs
```
Open: PikSend.lrplugin/PikSend.log
→ Look for recent ERROR entries
→ Note the timestamp and message
```

---

## Getting Help

### 📖 Full Documentation
- [Installation Guide](INSTALLATION-GUIDE.md) - Complete installation instructions
- [User Guide](USER-GUIDE.md) - How to use the plugin
- [FAQ](FAQ.md) - Frequently asked questions

### 🐛 Enable Debug Mode
1. In plugin settings, enable **Debug Mode**
2. Reproduce the problem
3. Check `PikSend.log` for detailed errors

### 📧 Contact Support
**Email**: support@piksend.com

**Include**:
- Lightroom version (Help > System Info)
- Operating system and version
- Problem description
- Steps to reproduce
- Log file (PikSend.log) if possible

### 💬 Community Forum
**URL**: [community.piksend.com](https://community.piksend.com)
- Search existing topics
- Ask questions
- Share solutions

---

## File Locations Reference

### Windows
```
Plugin: C:\Users\[You]\AppData\Roaming\Adobe\Lightroom\Modules\PikSend.lrplugin
Cache:  C:\Users\[You]\AppData\Roaming\Adobe\Lightroom\PikSend.cache
Logs:   C:\Users\[You]\AppData\Roaming\Adobe\Lightroom\PikSend.log
```

### macOS
```
Plugin: ~/Library/Application Support/Adobe/Lightroom/Modules/PikSend.lrplugin
Cache:  ~/Library/Application Support/Adobe/Lightroom/PikSend.cache
Logs:   ~/Library/Application Support/Adobe/Lightroom/PikSend.log
```

---

## Emergency Reset

If nothing works, try a complete reset:

1. **Uninstall plugin**:
   - File > Plug-in Manager > Select PikSend > Remove

2. **Delete all files**:
   - Delete plugin folder (see locations above)
   - Delete cache file
   - Delete log file

3. **Restart Lightroom**

4. **Reinstall**:
   - Download fresh copy from [piksend.com/dashboard](https://piksend.com/dashboard)
   - Follow [Installation Guide](INSTALLATION-GUIDE.md)

5. **Reconfigure**:
   - Generate new API token
   - Authenticate again

---

**Last Updated**: January 2024  
**Plugin Version**: 1.0.0+

For the most up-to-date troubleshooting information, visit [piksend.com/support](https://piksend.com/support)
