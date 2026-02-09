# Default Watermark Specifications (watermark-default.png)

## Overview
The default watermark is applied to exported photos when users enable watermarking but don't provide a custom watermark image. It should be subtle, professional, and protect photographers' work without being overly intrusive.

## Technical Specifications

### File Details
- **Filename**: `watermark-default.png`
- **Format**: PNG (Portable Network Graphics)
- **Color Mode**: RGB with Alpha channel (transparency required)
- **Bit Depth**: 32-bit (8-bit per channel + 8-bit alpha)

### Dimensions
- **Primary Size**: 200x200 pixels (square format)
- **Alternative Sizes** (optional):
  - 400x400 pixels (high-resolution photos)
  - 300x300 pixels (medium resolution)
  - 150x150 pixels (small watermarks)

### Aspect Ratio
- **Standard**: 1:1 (square)
- **Alternative**: 3:1 or 4:1 (horizontal text watermark)
- Square format is most versatile for corner placement

### File Size
- **Target**: < 20 KB
- **Maximum**: 30 KB
- Must be lightweight to avoid slowing export process

## Design Guidelines

### Watermark Purpose
The watermark serves to:
1. **Protect Copyright**: Identify the photographer/owner
2. **Brand Photos**: Associate images with PikSend service
3. **Deter Theft**: Make unauthorized use less appealing
4. **Maintain Aesthetics**: Not distract from the photo itself

### Design Philosophy
- **Subtle**: Should not dominate the image
- **Professional**: Conveys quality and legitimacy
- **Readable**: Clear enough to identify but not intrusive
- **Versatile**: Works on various photo types and colors

### Visual Elements

#### Option A: Text-Based Watermark
```
Description:
- "© PikSend" or "Photo by [Photographer]"
- Clean sans-serif font (Inter, Roboto, Open Sans)
- Semi-transparent white text (30-50% opacity)
- Optional: Small camera icon or logo
- Minimal design, maximum readability

Best For: Professional, clean look
```

#### Option B: Logo Watermark
```
Description:
- PikSend logo or icon
- Monochrome (white or black)
- 40-60% opacity
- Optional: "© PikSend" text below
- Compact, recognizable design

Best For: Brand recognition
```

#### Option C: Badge Watermark
```
Description:
- Circular or rounded rectangle badge
- PikSend logo/icon in center
- Semi-transparent background
- Border or outline for visibility
- Professional seal appearance

Best For: Official, authoritative look
```

#### Option D: Minimal Text
```
Description:
- Simple "© PikSend" text
- Small, elegant font
- High transparency (70-80%)
- No background or effects
- Ultra-subtle approach

Best For: Minimal interference with photos
```

### Typography

#### Font Selection
Choose fonts that are:
- **Readable**: Clear at small sizes
- **Professional**: Not decorative or playful
- **Web-Safe**: Widely available or embeddable
- **Timeless**: Won't look dated quickly

#### Recommended Fonts
- **Sans-Serif**: Inter, Roboto, Open Sans, Lato, Helvetica
- **Serif** (alternative): Georgia, Merriweather, Playfair Display
- **Monospace** (technical): Roboto Mono, Source Code Pro

#### Typography Specifications
- **Size**: 14-20px (relative to 200x200 canvas)
- **Weight**: Regular to Medium (400-500)
- **Letter Spacing**: 0% to 5% (slightly loose for readability)
- **Line Height**: 1.2-1.4 (if multi-line)
- **Case**: 
  - "© PikSend" (mixed case) - standard
  - "© PIKSEND" (all caps) - bold
  - "piksend.com" (lowercase) - modern

### Color and Opacity

#### Color Options
1. **White** (#FFFFFF):
   - Best for dark photos
   - Most common choice
   - High visibility

2. **Black** (#000000):
   - Best for light photos
   - Professional appearance
   - Good contrast

3. **Gray** (#808080):
   - Neutral, works on many backgrounds
   - Less intrusive than pure white/black
   - Balanced visibility

#### Opacity Levels
- **Subtle** (20-30%): Barely visible, very professional
- **Moderate** (40-60%): Visible but not distracting (recommended)
- **Strong** (70-80%): Clear protection, more prominent
- **Opaque** (90-100%): Maximum protection, can be intrusive

#### Recommended Settings
- **Default**: White at 50% opacity
- **Rationale**: Visible on most photos, professional, not distracting
- **Customizable**: Users can adjust opacity in plugin settings

### Layout and Composition

#### Watermark Positions
The watermark should be designed to work in any corner:
1. **Bottom Right** (most common)
2. **Bottom Left**
3. **Top Right**
4. **Top Left**
5. **Center** (less common, more intrusive)

#### Padding and Margins
- **Edge Padding**: 20-30px from photo edges
- **Internal Padding**: 10-15px within watermark element
- **Safe Area**: Keep text/logo within central 80% of watermark canvas

#### Size Relative to Photo
- **Small Photos** (< 1000px): 10-15% of photo width
- **Medium Photos** (1000-3000px): 8-12% of photo width
- **Large Photos** (> 3000px): 5-10% of photo width
- **Scalable**: Plugin should scale watermark appropriately

### Visual Effects

#### Recommended Effects
- **Drop Shadow**: Subtle shadow for visibility on any background
  - Offset: 1-2px
  - Blur: 2-4px
  - Opacity: 30-50%
  - Color: Black or white (opposite of watermark color)

- **Stroke/Outline**: Thin outline for contrast
  - Width: 1-2px
  - Color: Opposite of main color
  - Opacity: 30-50%

#### Effects to Avoid
- ❌ Heavy shadows (looks dated)
- ❌ Glows or outer glows (too prominent)
- ❌ Bevels or embossing (outdated)
- ❌ Gradients (can look unprofessional)
- ❌ Patterns or textures (distracting)

## Design Variations

### Variation 1: Simple Text
```
Design:
- "© PikSend" in Roboto Regular
- White color (#FFFFFF)
- 50% opacity
- 2px black drop shadow (30% opacity)
- No background

Dimensions: 180x40 pixels (within 200x200 canvas)
Position: Bottom right corner
File Size: ~5 KB

Best For: Minimal, professional look
```

### Variation 2: Logo + Text
```
Design:
- Small PikSend icon (30x30)
- "© PikSend" text below icon
- White color (#FFFFFF)
- 45% opacity
- Subtle drop shadow
- No background

Dimensions: 100x80 pixels (within 200x200 canvas)
Position: Any corner
File Size: ~8 KB

Best For: Brand recognition
```

### Variation 3: Badge Style
```
Design:
- Rounded rectangle background (semi-transparent)
- PikSend logo in center
- "© PikSend" text below
- White elements on dark background (20% opacity)
- 1px white border

Dimensions: 120x120 pixels (within 200x200 canvas)
Position: Any corner
File Size: ~12 KB

Best For: Official, seal-like appearance
```

### Variation 4: URL Watermark
```
Design:
- "piksend.com" in small text
- Optional: Small camera icon
- White color (#FFFFFF)
- 40% opacity
- Minimal drop shadow
- No background

Dimensions: 150x30 pixels (within 200x200 canvas)
Position: Bottom right corner
File Size: ~4 KB

Best For: Driving traffic, brand awareness
```

## Technical Requirements

### Transparency
- **Background**: Fully transparent (0% opacity)
- **Watermark Elements**: Semi-transparent (30-60% opacity)
- **Anti-aliasing**: Smooth edges, no pixelation
- **Alpha Channel**: Properly configured for blending

### Color Profile
- **sRGB IEC61966-2.1** (standard web color space)
- Ensures consistent appearance across all photos

### Compression
- **Lossless PNG compression**
- Tools: OptiPNG, PNGCrush, TinyPNG
- Optimize for smallest file size without quality loss

### Metadata
Include PNG metadata:
- **Title**: "PikSend Default Watermark"
- **Author**: "PikSend Design Team"
- **Copyright**: "© 2024 PikSend. All rights reserved."
- **Description**: "Default watermark for PikSend Lightroom plugin"
- **Usage**: "Apply to exported photos for copyright protection"

## Watermark Application

### Blending Modes
The plugin should support multiple blending modes:
- **Normal**: Standard overlay (default)
- **Multiply**: Darkens underlying image
- **Screen**: Lightens underlying image
- **Overlay**: Combines multiply and screen

### Positioning Options
Plugin should allow users to position watermark:
- **Corners**: Top-left, top-right, bottom-left, bottom-right
- **Edges**: Top-center, bottom-center, left-center, right-center
- **Center**: Centered on image (for maximum protection)
- **Tiled**: Repeated across entire image (advanced protection)

### Scaling Options
- **Fixed Size**: Watermark stays same size regardless of photo
- **Proportional**: Scales with photo dimensions (recommended)
- **Custom**: User-defined size percentage

### Opacity Control
Users should be able to adjust:
- **Range**: 10% to 100%
- **Default**: 50%
- **Increments**: 5% or 10%

## Testing Requirements

### Photo Compatibility
Test watermark on various photo types:
- **Dark Photos**: Night scenes, low-key portraits
- **Light Photos**: High-key portraits, bright scenes
- **Colorful Photos**: Vibrant landscapes, saturated colors
- **Black & White**: Monochrome images
- **High Contrast**: Photos with both dark and light areas

### Size Testing
Test watermark at different photo resolutions:
- **Small**: 800x600 (web thumbnails)
- **Medium**: 1920x1080 (HD)
- **Large**: 3840x2160 (4K)
- **Extra Large**: 6000x4000 (high-res prints)

### Position Testing
Verify watermark looks good in all positions:
- All four corners
- Center positions
- Edge positions
- Ensure adequate padding from edges

### Visibility Testing
- **Light Backgrounds**: Watermark should be visible
- **Dark Backgrounds**: Watermark should be visible
- **Busy Backgrounds**: Watermark should stand out
- **Uniform Backgrounds**: Watermark should not be too prominent

## Accessibility Considerations

### Copyright Information
- Watermark should include copyright symbol (©)
- Year can be added dynamically by plugin
- Photographer name can be customized by user

### Readability
- Text should be readable at actual display size
- Minimum text height: 10-12px when applied to photo
- Avoid overly decorative fonts

### Non-Intrusive Design
- Should not cover important parts of photos
- Should not distract from photo content
- Should be removable/customizable by user

## Legal Considerations

### Copyright Protection
- Watermark provides visual copyright notice
- Does not prevent all unauthorized use
- Should be combined with metadata copyright info
- Consider DMCA and international copyright laws

### Trademark Usage
- If using PikSend logo, ensure trademark compliance
- Include ® or ™ symbols if applicable
- Follow brand guidelines for logo usage

### User Customization
- Allow users to replace with custom watermark
- Support user's own copyright information
- Provide option to disable watermark entirely

## Implementation Notes

### Plugin Integration
```lua
-- Example watermark application code
function applyWatermark(photo, settings)
  local watermarkPath = _PLUGIN:resourceId("watermark-default.png")
  local position = settings.watermarkPosition or "bottomRight"
  local opacity = settings.watermarkOpacity or 50
  
  -- Apply watermark to exported photo
  -- Position, scale, and blend according to settings
end
```

### User Settings
Plugin should provide settings for:
- **Enable/Disable**: Toggle watermark on/off
- **Custom Image**: Upload custom watermark
- **Position**: Choose placement
- **Opacity**: Adjust transparency
- **Size**: Adjust scale percentage

### Performance
- Watermark application should be fast (< 1 second per photo)
- Should not significantly increase export time
- Optimize PNG for quick loading and blending

## Testing Checklist

Before finalizing the watermark:

- [ ] Displays correctly at 200x200 pixels
- [ ] Transparent background with proper alpha channel
- [ ] Visible on both light and dark photos
- [ ] Readable at small sizes when applied to photos
- [ ] File size is under 30 KB
- [ ] Works in all corner positions
- [ ] Scales appropriately with different photo sizes
- [ ] Drop shadow provides adequate contrast
- [ ] No copyright issues with fonts or design elements
- [ ] Metadata is properly embedded
- [ ] PNG is optimized for distribution
- [ ] Tested on various photo types and colors

## Design Tools

### Recommended Software
- **Adobe Photoshop**: Best for raster watermarks with effects
- **Adobe Illustrator**: Good for vector-based watermarks
- **GIMP**: Free alternative to Photoshop
- **Figma**: Collaborative design, easy export

### Export Settings (Photoshop)
1. Create 200x200 pixel canvas
2. Design watermark with transparency
3. File > Export > Export As...
4. Format: PNG
5. Transparency: Checked
6. Convert to sRGB: Checked
7. Metadata: Copyright and Contact Info
8. Optimize for file size

### Layer Structure (Photoshop)
```
Layers:
├── Text Layer (50% opacity)
│   └── Layer Effects: Drop Shadow
├── Logo Layer (optional, 50% opacity)
│   └── Layer Effects: Drop Shadow
└── Background (transparent)
```

## Delivery Format

### Final Deliverables
1. **watermark-default.png** (200x200) - Primary watermark
2. **watermark-default@2x.png** (400x400) - High-res version (optional)
3. **watermark-white.png** (200x200) - White version
4. **watermark-black.png** (200x200) - Black version (optional)
5. **watermark-source.psd** - Editable source file
6. **watermark-preview.jpg** - Preview on sample photos

### File Organization
```
resources/
├── watermark-default.png     (200x200, white, 50% opacity)
├── watermark-default@2x.png  (400x400, high-res)
├── watermark-white.png       (200x200, white version)
├── watermark-black.png       (200x200, black version)
└── source/
    ├── watermark-source.psd  (layered source)
    └── watermark-preview.jpg (applied to sample photos)
```

## Usage Examples

### Sample Photos with Watermark
Create preview images showing watermark on:
1. **Dark Photo**: Night cityscape
2. **Light Photo**: Beach scene
3. **Portrait**: Person against neutral background
4. **Landscape**: Colorful nature scene
5. **Black & White**: Monochrome portrait

### Before/After Comparison
Show photos with and without watermark to demonstrate:
- Subtlety of design
- Visibility across different photo types
- Professional appearance
- Non-intrusive placement

## Version History

When updating the watermark:
- Document design changes
- Archive previous versions
- Test compatibility with existing plugin versions
- Update user documentation

## Approval Process

Before finalizing:
1. **Design Review**: Submit to PikSend design team
2. **Technical Testing**: Test in actual plugin export process
3. **User Testing**: Get feedback from photographers
4. **Legal Review**: Verify copyright and trademark compliance
5. **Final Approval**: Sign-off from product manager

---

**Last Updated**: 2024
**Document Version**: 1.0
**Status**: Specification - Awaiting Design Implementation
