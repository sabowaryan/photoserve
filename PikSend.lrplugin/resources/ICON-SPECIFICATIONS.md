# Plugin Icon Specifications (icon.png)

## Overview
The plugin icon represents the PikSend Lightroom plugin in Adobe Lightroom Classic's Plugin Manager and other system interfaces. It should be instantly recognizable and convey the plugin's purpose of photo sharing and gallery management.

## Technical Specifications

### File Details
- **Filename**: `icon.png`
- **Format**: PNG (Portable Network Graphics)
- **Color Mode**: RGB with Alpha channel (transparency support)
- **Bit Depth**: 32-bit (8-bit per channel + 8-bit alpha)

### Dimensions
- **Primary Size**: 256x256 pixels
- **Alternative Sizes** (optional for multi-resolution support):
  - 512x512 pixels (high-DPI displays)
  - 128x128 pixels (standard displays)
  - 64x64 pixels (small icons)
  - 32x32 pixels (list views)

### File Size
- **Target**: < 50 KB
- **Maximum**: 100 KB
- Use PNG optimization tools to reduce file size without quality loss

## Design Guidelines

### Visual Concept
The icon should combine elements that represent:
1. **Photography**: Camera, lens, or photo frame elements
2. **Sharing/Upload**: Cloud, arrow, or network symbols
3. **PikSend Brand**: Incorporate brand colors and style

### Recommended Design Elements

#### Primary Symbol
Choose one of these concepts:
- **Camera + Cloud**: A camera icon with a cloud upload symbol
- **Photo Frame + Arrow**: A photo frame with an upward arrow
- **Gallery Grid + Share**: A grid of photos with a share icon overlay
- **Lens + Network**: A camera lens with connection nodes

#### Color Palette
Use PikSend brand colors:
- **Primary**: #4A90E2 (Blue) - Trust, technology, professionalism
- **Secondary**: #50E3C2 (Teal) - Creativity, freshness
- **Accent**: #F5A623 (Orange) - Energy, action
- **Neutral**: #4A4A4A (Dark Gray) - Text and outlines
- **Background**: Transparent or white

#### Style Guidelines
- **Modern and Clean**: Avoid clutter, use simple geometric shapes
- **Flat Design**: Minimal shadows, prefer flat colors with subtle gradients
- **Professional**: Should look polished and trustworthy
- **Scalable**: Design should be recognizable at all sizes
- **Distinctive**: Should stand out among other Lightroom plugins

### Layout and Composition

#### Safe Area
- Keep important elements within the central 80% of the canvas
- Leave 10% padding on all sides for visual breathing room
- Ensure critical elements are visible even at 32x32 pixels

#### Visual Hierarchy
1. **Primary Element** (60-70% of space): Main icon symbol
2. **Secondary Element** (20-30% of space): Supporting symbol or badge
3. **Background** (remaining space): Subtle gradient or solid color

#### Corner Radius
- If using rounded corners: 12-16% of the icon size
- For 256x256: approximately 30-40 pixel radius
- Maintains consistency with modern UI design trends

## Design Variations

### Option A: Camera Cloud Icon
```
Description:
- Stylized camera body in primary blue (#4A90E2)
- Small cloud icon in top-right corner with upload arrow
- Subtle circular gradient background (light to dark blue)
- White camera lens detail for contrast

Visual Weight: 70% camera, 30% cloud
Best For: Emphasizing photography workflow
```

### Option B: Photo Grid Upload
```
Description:
- 3x3 grid of small photo thumbnails
- Central photo highlighted with glow effect
- Upward arrow emerging from center
- Gradient background from teal to blue

Visual Weight: 60% grid, 40% arrow
Best For: Emphasizing gallery/collection management
```

### Option C: Lens Network
```
Description:
- Camera lens viewed from front (circular)
- Network connection nodes around perimeter
- One node highlighted with upload symbol
- Dark background with light elements

Visual Weight: 70% lens, 30% network
Best For: Emphasizing connectivity and sharing
```

### Option D: Minimalist Badge
```
Description:
- Simple "PS" monogram in custom typography
- Small camera icon integrated into letterforms
- Solid color background with subtle texture
- Clean, modern, professional appearance

Visual Weight: 80% typography, 20% icon
Best For: Brand recognition and simplicity
```

## Technical Requirements

### Transparency
- Use alpha channel for smooth edges
- Avoid hard-edged transparency (use anti-aliasing)
- Background should be fully transparent (0% opacity)
- Icon elements should be fully opaque (100% opacity)

### Color Profile
- **sRGB IEC61966-2.1** (standard web color space)
- Ensures consistent color appearance across platforms

### Compression
- Use PNG-8 if possible (256 colors) for smaller file size
- Use PNG-24 if gradients or many colors are needed
- Apply lossless compression (tools: OptiPNG, PNGCrush, TinyPNG)

### Metadata
Include PNG metadata:
- **Title**: "PikSend Lightroom Plugin Icon"
- **Author**: "PikSend Team"
- **Copyright**: "© 2024 PikSend. All rights reserved."
- **Description**: "Official icon for the PikSend Adobe Lightroom Classic plugin"

## Platform Considerations

### Windows
- Icon should look good on both light and dark taskbars
- Test visibility against various background colors
- Ensure proper scaling at 125%, 150%, 175%, 200% DPI

### macOS
- Should work well in both light and dark modes
- Test in Finder, Dock, and application switcher
- Retina display optimization (2x resolution)

### Lightroom Plugin Manager
- Icon appears in a list view with plugin name
- Should be recognizable at 64x64 pixels
- Must contrast well with Lightroom's dark interface

## Accessibility

### Color Contrast
- Ensure sufficient contrast between icon elements
- Minimum contrast ratio: 3:1 for graphical objects
- Test with color blindness simulators (deuteranopia, protanopia, tritanopia)

### Visual Clarity
- Icon should be understandable without color (test in grayscale)
- Avoid relying solely on color to convey meaning
- Use shapes and symbols that are universally recognizable

## Testing Checklist

Before finalizing the icon, verify:

- [ ] Displays correctly at 256x256, 128x128, 64x64, and 32x32 pixels
- [ ] Recognizable and clear at smallest size (32x32)
- [ ] Transparent background with no artifacts
- [ ] Colors match PikSend brand guidelines
- [ ] File size is under 100 KB
- [ ] Looks good on both light and dark backgrounds
- [ ] Passes color blindness simulation tests
- [ ] No copyright issues with design elements
- [ ] Metadata is properly embedded
- [ ] PNG is optimized for web/distribution

## Design Tools

### Recommended Software
- **Adobe Illustrator**: Vector design, scalable artwork
- **Adobe Photoshop**: Raster editing, effects, export
- **Figma**: Collaborative design, modern UI tools
- **Sketch**: macOS-native design tool
- **Affinity Designer**: Cost-effective alternative

### Export Settings (Photoshop)
1. File > Export > Export As...
2. Format: PNG
3. Transparency: Checked
4. Convert to sRGB: Checked
5. Metadata: Copyright and Contact Info
6. Image Size: 256x256 pixels
7. Resample: Bicubic Sharper (best for reduction)

### Export Settings (Illustrator)
1. File > Export > Export for Screens...
2. Format: PNG
3. Scale: 1x, 2x (for Retina)
4. Background: Transparent
5. Anti-aliasing: Type Optimized (Hinted)

## Examples and Inspiration

### Similar Plugin Icons to Study
- Adobe Lightroom plugins (official and third-party)
- Photography-related app icons (Capture One, Luminar, etc.)
- Cloud storage service icons (Dropbox, Google Drive, etc.)
- Social media sharing icons (Instagram, Flickr, etc.)

### Design Principles to Follow
- **Simplicity**: Less is more, avoid unnecessary details
- **Consistency**: Match PikSend's overall visual identity
- **Memorability**: Create a unique, recognizable symbol
- **Versatility**: Works across different sizes and contexts
- **Timelessness**: Avoid trendy elements that date quickly

## Delivery Format

### Final Deliverables
1. **icon.png** (256x256) - Primary file for plugin
2. **icon@2x.png** (512x512) - High-DPI version (optional)
3. **icon-source.ai** or **.psd** - Editable source file
4. **icon-preview.jpg** - Preview showing icon at various sizes

### File Organization
```
resources/
├── icon.png              (256x256, optimized)
├── icon@2x.png          (512x512, optional)
└── source/
    ├── icon-source.ai   (vector source)
    ├── icon-source.psd  (raster source)
    └── icon-preview.jpg (size preview)
```

## Version History

When updating the icon:
- Document changes in version history
- Keep previous versions archived
- Update metadata with new version date
- Test compatibility with all Lightroom versions

## Contact and Approval

Before finalizing:
- Submit design mockups to PikSend design team
- Get approval from product manager
- Conduct user testing if possible
- Gather feedback from beta testers

---

**Last Updated**: 2024
**Document Version**: 1.0
**Status**: Specification - Awaiting Design Implementation
