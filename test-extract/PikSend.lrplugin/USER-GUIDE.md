# User Guide - PikSend Plugin for Adobe Lightroom Classic

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Export Service - Quick Export](#export-service---quick-export)
4. [Publish Service - Automatic Synchronization](#publish-service---automatic-synchronization)
5. [Gallery Management](#gallery-management)
6. [Export Settings & Presets](#export-settings--presets)
7. [Metadata Management](#metadata-management)
8. [Watermarks](#watermarks)
9. [Upload Progress & Control](#upload-progress--control)
10. [Common Workflows](#common-workflows)
11. [Advanced Features](#advanced-features)
12. [Tips & Best Practices](#tips--best-practices)
13. [Troubleshooting](#troubleshooting)

---

## Introduction

The PikSend plugin for Adobe Lightroom Classic allows professional photographers to export their photos directly to PikSend without leaving their post-production workflow. The plugin integrates natively into Lightroom and offers a seamless experience for creating galleries and uploading selected photos.

### Key Features

- **Direct Export**: Export photos from Lightroom to PikSend galleries
- **Automatic Synchronization**: Publish Service keeps your galleries in sync
- **Metadata Transfer**: Preserve IPTC, EXIF, and copyright information
- **Custom Presets**: Save export configurations for quick reuse
- **Watermark Support**: Apply custom watermarks automatically
- **Parallel Uploads**: Upload multiple photos simultaneously for speed
- **Progress Tracking**: Real-time upload progress with pause/resume
- **Gallery Management**: Create and manage galleries directly from Lightroom

### Prerequisites

Before using this guide, ensure you have:
- Installed the PikSend plugin (see [Installation Guide](INSTALLATION-GUIDE.md))
- An active PikSend Pro account
- Generated an API token and authenticated

---

## Getting Started

### Understanding the Two Export Methods

The PikSend plugin offers two ways to export photos:

#### 1. Export Service (Quick Export)
- **Best for**: One-time exports, client deliveries, quick sharing
- **How it works**: Select photos → Configure → Export → Done
- **Advantages**: Simple, fast, no ongoing management
- **Use when**: You want to export specific photos once

#### 2. Publish Service (Automatic Synchronization)
- **Best for**: Portfolio management, ongoing projects, client galleries
- **How it works**: Create published collections → Photos sync automatically
- **Advantages**: Automatic updates, bidirectional sync, organized workflow
- **Use when**: You want galleries to stay in sync with your Lightroom catalog

### First Time Setup

#### Step 1: Authenticate

1. In Lightroom, go to **File > Export** (or **Ctrl+Shift+E** / **Cmd+Shift+E**)
2. Select **PikSend** from the export destination dropdown
3. In the **PikSend Account** section, click **Login**
4. Paste your API token (generated from [piksend.com/dashboard/settings/api](https://piksend.com/dashboard/settings/api))
5. Click **OK**

You should see: **"Connected as: [Your Name]"**

#### Step 2: Verify Gallery Access

1. In the **Gallery** section, click **Refresh**
2. Your existing galleries should appear in the dropdown
3. If you don't have galleries yet, click **New Gallery** to create one

---

## Export Service - Quick Export

The Export Service is perfect for one-time exports and quick sharing.

### Basic Export Workflow

#### Step 1: Select Photos

1. In the **Library** or **Develop** module, select the photos you want to export
2. You can select:
   - Individual photos (Ctrl/Cmd + Click)
   - Multiple photos (Shift + Click for range)
   - Entire collections (Select all with Ctrl/Cmd + A)

#### Step 2: Open Export Dialog

1. Click **File > Export** (or press **Ctrl+Shift+E** / **Cmd+Shift+E**)
2. Select **PikSend** from the export destination dropdown at the top

#### Step 3: Choose or Create a Gallery

**Option A: Use Existing Gallery**
1. In the **Gallery** section, select a gallery from the dropdown
2. The gallery name, image count, and status are displayed

**Option B: Create New Gallery**
1. Click **New Gallery** button
2. Enter gallery details:
   - **Title** (required): 1-200 characters
   - **Description** (optional): Gallery description
   - **Expiration Date** (optional): When the gallery should expire
   - **Password** (optional): Protect with a password
   - **Visibility**: Public or Private
3. Click **Create**
4. The new gallery is automatically selected

#### Step 4: Configure Export Settings

**File Format**:
- **JPEG**: Best for web sharing (recommended)
- **PNG**: For images requiring transparency
- **TIFF**: For maximum quality (larger files)

**JPEG Quality** (1-100):
- **90-100**: Maximum quality, larger files
- **80-89**: High quality, good balance (recommended)
- **60-79**: Medium quality, smaller files
- **Below 60**: Lower quality, smallest files

**Image Sizing**:
- **Original**: Keep original dimensions
- **Resize to Fit**: Set maximum width and/or height
  - Example: 2048px width for web galleries
  - Example: 4096px for high-resolution viewing

**Watermark** (optional):
- Enable watermark checkbox
- Select watermark image
- Choose position: Top Left, Top Right, Bottom Left, Bottom Right, Center
- Set opacity: 0-100%

#### Step 5: Configure Metadata Transfer

Choose which metadata to include:
- ☑ **Title**: Photo title (IPTC Title)
- ☑ **Description**: Photo caption (IPTC Caption)
- ☑ **Keywords**: Tags and keywords
- ☑ **Copyright**: Copyright information
- ☑ **EXIF Data**: Camera settings (camera, lens, ISO, aperture, shutter speed)
- ☐ **GPS Location**: Geolocation data (disable for privacy)

#### Step 6: Export

1. Review your settings
2. Click **Export**
3. The upload progress window appears
4. Monitor progress (see [Upload Progress & Control](#upload-progress--control))
5. When complete, you'll see: **"Upload complete! [X] photos uploaded successfully"**
6. Click **View Gallery** to open the gallery in your browser

### Saving Export Presets

To save time on future exports, create presets:

#### Creating a Preset

1. Configure all your export settings
2. At the bottom of the Export dialog, click **Add** (next to Preset dropdown)
3. Enter a preset name (e.g., "Web Gallery - High Quality", "Client Delivery - Watermarked")
4. Click **Create**

#### Using a Preset

1. Open the Export dialog
2. Select your preset from the **Preset** dropdown
3. All settings are automatically applied
4. Adjust if needed and export

#### Managing Presets

- **Update**: Modify settings and click **Update Preset**
- **Delete**: Select preset and click **Delete Preset**
- **Rename**: Click **Rename Preset**

### Example Export Scenarios

#### Scenario 1: Quick Client Preview
**Goal**: Share 20 photos with a client for quick review

1. Select 20 photos
2. File > Export > PikSend
3. Create new gallery: "Client Preview - [Date]"
4. Settings:
   - Format: JPEG
   - Quality: 85
   - Resize: 2048px width
   - No watermark
   - Include: Title, Description, Copyright
5. Export
6. Copy gallery link and send to client

#### Scenario 2: High-Quality Portfolio
**Goal**: Upload portfolio images in high quality

1. Select portfolio photos
2. File > Export > PikSend
3. Select gallery: "Portfolio 2024"
4. Settings:
   - Format: JPEG
   - Quality: 95
   - Resize: Original or 4096px
   - Watermark: Bottom right, 50% opacity
   - Include: All metadata except GPS
5. Export

#### Scenario 3: Social Media Sharing
**Goal**: Export optimized images for social media

1. Select photos
2. File > Export > PikSend
3. Create gallery: "Social Media - [Event Name]"
4. Settings:
   - Format: JPEG
   - Quality: 80
   - Resize: 1920px width
   - Watermark: Bottom right, 70% opacity
   - Include: Title, Keywords
5. Export
6. Share gallery link on social media

---

## Publish Service - Automatic Synchronization

The Publish Service keeps your Lightroom collections synchronized with PikSend galleries automatically.

### Understanding Publish Service

**What is Publish Service?**
- A Lightroom feature that maintains a connection between collections and external services
- Photos are marked as "Published", "Modified", or "To Publish"
- Changes in Lightroom automatically sync to PikSend

**Benefits**:
- **Automatic Updates**: Edit a photo → Republish → Gallery updates automatically
- **Organized Workflow**: Each published collection = One PikSend gallery
- **Change Detection**: Plugin detects when photos are edited or metadata changes
- **Bidirectional Sync**: Changes on PikSend can sync back to Lightroom

### Setting Up Publish Service

#### Step 1: Create a Published Collection

1. In the left panel, find **Publish Services**
2. Expand the **PikSend** section
3. Right-click on **PikSend** → **Create Published Collection**
4. A dialog appears

#### Step 2: Configure Published Collection

**Collection Settings**:
- **Name**: Name for your Lightroom collection (e.g., "Wedding Portfolio")
- **Gallery**: Choose existing gallery or create new one
- **Sync Mode**: 
  - **One-way (Lightroom → PikSend)**: Changes only go from Lightroom to PikSend
  - **Two-way**: Changes sync in both directions (advanced)

**Export Settings**:
- Configure the same settings as Export Service:
  - File format and quality
  - Image sizing
  - Watermark
  - Metadata transfer

#### Step 3: Add Photos to Published Collection

**Method 1: Drag and Drop**
1. Select photos in Library
2. Drag them to your Published Collection
3. Photos are marked as "To Publish"

**Method 2: Right-Click**
1. Select photos
2. Right-click → **Add to Published Collection** → Select your collection

**Method 3: Smart Published Collection**
1. Right-click on PikSend → **Create Published Smart Collection**
2. Set rules (e.g., "Rating is 5 stars", "Keywords contain 'portfolio'")
3. Photos matching rules are automatically added

#### Step 4: Publish Photos

1. Click on your Published Collection
2. You'll see photos marked as "To Publish" (with publish icon)
3. Click **Publish** button at the top
4. Photos are uploaded to the linked PikSend gallery
5. Status changes to "Published" (with checkmark)

### Working with Published Collections

#### Publishing New Photos

1. Add photos to the Published Collection (drag and drop)
2. Photos are marked "To Publish"
3. Click **Publish**
4. Only new photos are uploaded

#### Updating Modified Photos

When you edit a photo in a Published Collection:

1. Make edits in Develop module
2. Return to Library
3. Photo is automatically marked "Modified to Re-Publish"
4. Click **Publish**
5. Only modified photos are re-uploaded

#### Removing Photos from Gallery

**Option 1: Mark to Delete**
1. Right-click on photo in Published Collection
2. Select **Mark to Delete from Published Collection**
3. Click **Publish**
4. Photo is removed from PikSend gallery (but stays in Lightroom)

**Option 2: Remove from Collection**
1. Right-click on photo
2. Select **Remove from this Published Collection**
3. Photo is removed from collection and gallery

#### Republishing All Photos

To force re-upload of all photos:

1. Right-click on Published Collection name
2. Select **Republish All Photos**
3. All photos are re-uploaded regardless of status

### Publish Service Workflows

#### Workflow 1: Portfolio Management

**Setup**:
1. Create Published Collection: "My Portfolio"
2. Link to gallery: "Professional Portfolio"
3. Settings: High quality, watermarked, full metadata

**Daily Use**:
1. Add new portfolio-worthy photos to collection
2. Click Publish → New photos appear in gallery
3. Edit existing photos → They're marked "Modified"
4. Click Publish → Gallery updates automatically

#### Workflow 2: Client Project Gallery

**Setup**:
1. Create Published Collection: "Smith Wedding 2024"
2. Create new gallery: "Smith Wedding - Final Selection"
3. Settings: High quality, no watermark, client-friendly

**During Project**:
1. Add selected photos as you edit them
2. Publish regularly to show progress
3. Client can view gallery and provide feedback
4. Make adjustments based on feedback
5. Republish modified photos

**After Delivery**:
- Keep collection for archival purposes
- Gallery remains accessible to client

#### Workflow 3: Automated Portfolio with Smart Collection

**Setup**:
1. Create Published Smart Collection: "Auto Portfolio"
2. Rules: "Rating is 5 stars" AND "Keywords contain 'portfolio'"
3. Link to gallery: "Best Work"
4. Settings: Maximum quality, watermarked

**Daily Use**:
1. Rate your best photos with 5 stars
2. Add "portfolio" keyword
3. Photos automatically appear in Published Collection
4. Click Publish once a week
5. Portfolio gallery stays current automatically

---

## Gallery Management

### Creating Galleries

#### From Export Dialog

1. In Export dialog, click **New Gallery**
2. Enter details:
   - **Title** (required): Gallery name (1-200 characters)
   - **Description** (optional): What the gallery contains
   - **Expiration Date** (optional): When gallery should expire
   - **Password** (optional): Protect with password
   - **Public/Private**: Visibility setting
3. Click **Create**

#### From Publish Service

1. Right-click on **PikSend** in Publish Services
2. Select **Create Published Collection**
3. In the dialog, choose **Create New Gallery**
4. Enter gallery details
5. Click **Create**

### Gallery Settings

#### Title
- **Length**: 1-200 characters
- **Best practices**: 
  - Be descriptive: "Wedding - Smith & Jones - June 2024"
  - Include date for organization
  - Use client names for client galleries

#### Description
- **Optional** but recommended
- Appears at the top of the gallery
- Good for:
  - Event details
  - Usage instructions
  - Copyright notices
  - Download instructions

#### Expiration Date
- **Optional**: Gallery expires automatically on this date
- **Use cases**:
  - Client preview galleries (expire after 30 days)
  - Temporary sharing (expire after event)
  - Time-limited promotions
- **Note**: You can extend expiration later

#### Password Protection
- **Optional**: Require password to view gallery
- **Use cases**:
  - Client galleries (share password separately)
  - Private events
  - Sensitive content
- **Best practices**:
  - Use strong passwords
  - Share password via separate channel (not in gallery link)

#### Visibility
- **Public**: Anyone with link can view
- **Private**: Only you can view (unless password is shared)

### Managing Existing Galleries

#### Viewing Gallery List

1. In Export dialog or Publish Service settings
2. Click **Refresh** to update gallery list
3. Galleries are sorted by creation date (newest first)

#### Gallery Information Display

For each gallery, you see:
- **Title**: Gallery name
- **Image Count**: Number of photos
- **Created**: Creation date
- **Status**: Active or Expired

#### Searching Galleries

1. In the gallery dropdown, start typing
2. List filters to matching galleries
3. Search is case-insensitive

#### Opening Gallery in Browser

1. After export, click **View Gallery** in success message
2. Or visit [piksend.com/dashboard](https://piksend.com/dashboard) and find your gallery

#### Editing Gallery Settings

1. Open gallery on PikSend website
2. Click **Settings** icon
3. Modify:
   - Title, description
   - Expiration date
   - Password
   - Visibility
   - Watermark settings
4. Save changes
5. In Lightroom, click **Refresh** to sync changes

#### Deleting Galleries

**Note**: Galleries can only be deleted from the PikSend website, not from Lightroom.

1. Open [piksend.com/dashboard](https://piksend.com/dashboard)
2. Find the gallery
3. Click **Delete** icon
4. Confirm deletion
5. In Lightroom, click **Refresh** to update list

---

## Export Settings & Presets

### File Format Options

#### JPEG
- **Best for**: Most use cases, web galleries, client deliveries
- **Advantages**: 
  - Small file size
  - Universal compatibility
  - Fast uploads
  - Adjustable quality
- **Disadvantages**: 
  - Lossy compression
  - No transparency
- **Recommended for**: 90% of exports

#### PNG
- **Best for**: Images requiring transparency, graphics, logos
- **Advantages**:
  - Lossless compression
  - Supports transparency
  - Sharp edges
- **Disadvantages**:
  - Larger file sizes
  - Slower uploads
- **Recommended for**: Special cases only

#### TIFF
- **Best for**: Archival, maximum quality preservation
- **Advantages**:
  - Lossless
  - Maximum quality
  - Professional standard
- **Disadvantages**:
  - Very large files
  - Slow uploads
  - May exceed 500MB limit
- **Recommended for**: Rare cases, archival purposes

### Quality Settings

#### JPEG Quality Scale (1-100)

**95-100: Maximum Quality**
- File size: Very large (8-15 MB per photo)
- Use for: Portfolio, prints, archival
- Upload time: Slow
- Visual difference from 100: Minimal

**85-94: High Quality (Recommended)**
- File size: Medium (3-8 MB per photo)
- Use for: Client deliveries, professional galleries
- Upload time: Moderate
- Visual difference: Imperceptible to most viewers

**75-84: Good Quality**
- File size: Small (1-3 MB per photo)
- Use for: Web galleries, social media, quick sharing
- Upload time: Fast
- Visual difference: Slight, acceptable for web

**60-74: Medium Quality**
- File size: Very small (500KB-1MB per photo)
- Use for: Previews, thumbnails, bandwidth-limited situations
- Upload time: Very fast
- Visual difference: Noticeable on close inspection

**Below 60: Low Quality**
- Not recommended for professional use
- Visible compression artifacts

**Recommendation**: Start with 85 and adjust based on your needs.

### Image Sizing

#### Original Size
- Exports at full resolution from Lightroom
- **Pros**: Maximum quality, no quality loss
- **Cons**: Large files, slow uploads
- **Use when**: Client needs full resolution, prints, archival

#### Resize to Fit

**Common Presets**:

**4096px (4K)**
- For: High-resolution viewing, large displays, potential prints
- File size: Large
- Quality: Excellent

**2048px (2K)**
- For: Web galleries, client previews, general sharing
- File size: Medium
- Quality: Very good for screens
- **Most popular choice**

**1920px (Full HD)**
- For: Social media, quick sharing, bandwidth-limited
- File size: Small
- Quality: Good for web

**1024px**
- For: Thumbnails, previews, very fast loading
- File size: Very small
- Quality: Adequate for small displays

**Custom Size**
- Enter specific width and/or height
- Maintains aspect ratio
- Example: 3000px width for specific client requirements

**Sizing Tips**:
- Specify width OR height, not both (maintains aspect ratio)
- Consider viewer's typical screen size
- Larger isn't always better (slower loading, more bandwidth)
- 2048px is the sweet spot for most web galleries

### Concurrent Uploads

**What it is**: Number of photos uploaded simultaneously

**Settings**: 1-5 uploads (default: 3)

**Choosing the Right Number**:

**1 Upload**
- Slowest overall
- Most stable
- Use when: Slow/unstable internet, large files, experiencing errors

**2-3 Uploads (Recommended)**
- Good balance of speed and stability
- Works well for most connections
- Default setting

**4-5 Uploads**
- Fastest overall
- Requires fast, stable internet
- May cause timeouts on slower connections
- Use when: Fast internet (50+ Mbps upload), small files

**Factors to Consider**:
- Your upload speed (test at [speedtest.net](https://speedtest.net))
- File sizes (larger files = fewer concurrent uploads)
- Connection stability
- Computer performance

---

## Metadata Management

### Understanding Metadata

**Metadata** is information about your photos stored within the image file.

#### Types of Metadata

**IPTC Metadata** (Editable in Lightroom):
- **Title**: Photo title/headline
- **Caption/Description**: Detailed description
- **Keywords**: Tags for organization and search
- **Copyright**: Copyright notice
- **Creator**: Photographer name
- **Location**: Where photo was taken (text)

**EXIF Metadata** (Automatic from camera):
- **Camera**: Camera make and model
- **Lens**: Lens used
- **Settings**: ISO, aperture, shutter speed, focal length
- **Date/Time**: When photo was taken
- **GPS**: Geolocation coordinates (if camera has GPS)

### Configuring Metadata Transfer

In Export or Publish Service settings, choose what to include:

#### Title (IPTC Title)
- ☑ **Recommended**: Include
- **Appears as**: Photo title in gallery
- **Use for**: Naming photos, organizing, SEO
- **Example**: "Golden Gate Bridge at Sunset"

#### Description (IPTC Caption)
- ☑ **Recommended**: Include
- **Appears as**: Photo description in gallery
- **Use for**: Detailed information, storytelling, context
- **Example**: "Captured during a beautiful summer evening in San Francisco..."

#### Keywords (IPTC Keywords)
- ☑ **Recommended**: Include
- **Appears as**: Tags in gallery
- **Use for**: Organization, search, categorization
- **Example**: "landscape, sunset, bridge, california, travel"

#### Copyright (IPTC Copyright)
- ☑ **Strongly Recommended**: Always include
- **Appears as**: Copyright notice in gallery
- **Use for**: Protecting your work, attribution
- **Example**: "© 2024 John Smith Photography. All rights reserved."

#### EXIF Data
- ☑ **Recommended**: Include (unless privacy concerns)
- **Appears as**: Technical details in gallery
- **Use for**: Showing camera settings, educational purposes
- **Includes**: Camera, lens, ISO, aperture, shutter speed, focal length
- **Note**: Useful for other photographers to learn from your settings

#### GPS Location
- ☐ **Privacy Consideration**: Disable if concerned about privacy
- **Appears as**: Map location in gallery
- **Use for**: Travel photography, location-based galleries
- **Privacy note**: Reveals exact location where photo was taken
- **Recommendation**: Disable for photos taken at home or private locations

### Setting Metadata in Lightroom

#### Adding Title

1. Select photo(s)
2. In **Metadata** panel (right side)
3. Find **Title** field
4. Enter title
5. Press Enter

#### Adding Caption/Description

1. In **Metadata** panel
2. Find **Caption** field
3. Enter description
4. Press Enter

#### Adding Keywords

**Method 1: Keywording Panel**
1. In **Keywording** panel (right side)
2. Type keywords separated by commas
3. Press Enter

**Method 2: Keyword List**
1. In **Keyword List** panel
2. Check boxes next to relevant keywords
3. Or create new keywords

#### Adding Copyright

1. In **Metadata** panel
2. Find **Copyright** field
3. Enter copyright notice
4. Press Enter

**Tip**: Set default copyright in Lightroom preferences:
- Edit > Catalog Settings > Metadata
- Enter default copyright
- Applied to all imported photos

### Default Metadata

Set default metadata for all photos in an export:

1. In Export settings, expand **Metadata** section
2. Enable **Apply Default Metadata**
3. Enter:
   - Default title prefix (e.g., "Wedding - ")
   - Default description
   - Default keywords
   - Default copyright
4. These are applied to photos that don't have metadata

**Use case**: Batch export where all photos need same base information.

### Alt Text Generation

The plugin automatically generates alt text for accessibility:

**How it works**:
- Combines Title + Description
- Used for screen readers and SEO
- Improves gallery accessibility

**Example**:
- Title: "Mountain Landscape"
- Description: "Snow-capped peaks at sunrise"
- Generated Alt Text: "Mountain Landscape - Snow-capped peaks at sunrise"

---

## Watermarks

### Understanding Watermarks

**Watermarks** are semi-transparent images or text overlaid on your photos to:
- Protect copyright
- Brand your work
- Prevent unauthorized use
- Promote your business

### Setting Up Watermarks

#### Step 1: Prepare Watermark Image

**Requirements**:
- **Format**: PNG with transparency (recommended) or JPEG
- **Size**: 500-2000px wide (scales automatically)
- **Content**: Your logo, signature, or text
- **Background**: Transparent (PNG) for best results

**Creating a Watermark**:
1. Use graphic design software (Photoshop, Illustrator, Canva)
2. Create your logo/text on transparent background
3. Export as PNG
4. Save to easily accessible location

#### Step 2: Enable Watermark in Export Settings

1. In Export or Publish Service settings
2. Find **Watermark** section
3. Check **Enable Watermark**
4. Click **Choose Watermark Image**
5. Select your watermark PNG file

#### Step 3: Configure Watermark Position

**Position Options**:

**Bottom Right** (Most Popular)
- Visible but not intrusive
- Standard placement
- Good for signatures and small logos

**Bottom Left**
- Alternative to bottom right
- Less common
- Good for left-aligned designs

**Top Right**
- Prominent placement
- Good for branding
- May interfere with sky in landscapes

**Top Left**
- Alternative to top right
- Less common

**Center**
- Most prominent
- Maximum protection
- Can be intrusive
- Use for high-value images or when maximum protection needed

**Recommendation**: Start with Bottom Right at 50% opacity.

#### Step 4: Set Opacity

**Opacity Scale** (0-100%):

**10-30%: Subtle**
- Barely visible
- Doesn't distract from image
- Minimal protection
- Good for: Portfolio, artistic work

**40-60%: Balanced (Recommended)**
- Visible but not overwhelming
- Good protection
- Doesn't ruin viewing experience
- Good for: Most use cases

**70-90%: Prominent**
- Very visible
- Strong protection
- May distract from image
- Good for: Client previews, watermarked proofs

**100%: Opaque**
- Fully visible
- Maximum protection
- Can be intrusive
- Good for: Preventing unauthorized use

### Watermark Best Practices

#### Design Tips

1. **Keep it simple**: Complex watermarks are distracting
2. **Use transparency**: PNG with transparent background
3. **Size appropriately**: Not too large, not too small
4. **Consider contrast**: Ensure visibility on both light and dark images
5. **Include contact info**: Website or social media handle

#### Placement Tips

1. **Avoid center**: Unless maximum protection is needed
2. **Consider composition**: Don't cover important elements
3. **Be consistent**: Use same position across all images
4. **Test on various images**: Ensure visibility on different backgrounds

#### Opacity Tips

1. **Start at 50%**: Adjust from there
2. **Consider image type**: 
   - Portraits: Lower opacity (30-50%)
   - Landscapes: Medium opacity (50-70%)
   - Products: Higher opacity (70-90%)
3. **Match purpose**:
   - Portfolio: Lower opacity
   - Client proofs: Higher opacity

### Watermark Presets

Save watermark configurat