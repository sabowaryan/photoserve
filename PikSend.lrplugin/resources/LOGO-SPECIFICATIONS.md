# PikSend Logo Specifications (logo.png)

## Overview
The PikSend logo is displayed within the plugin's dialogs, settings panels, and authentication screens. It serves as a brand identifier and reinforces the connection between the Lightroom plugin and the PikSend service.

## Technical Specifications

### File Details
- **Filename**: `logo.png`
- **Format**: PNG (Portable Network Graphics)
- **Color Mode**: RGB with Alpha channel (transparency support)
- **Bit Depth**: 32-bit (8-bit per channel + 8-bit alpha)

### Dimensions
- **Primary Size**: 200x50 pixels (4:1 aspect ratio)
- **Alternative Sizes** (optional):
  - 400x100 pixels (high-DPI/Retina displays)
  - 300x75 pixels (medium resolution)
  - 160x40 pixels (compact displays)

### Aspect Ratio
- **Standard**: 4:1 (horizontal logo)
- **Alternative**: 2:1 (wider logo for headers)
- Maintain consistent proportions across all sizes

### File Size
- **Target**: < 30 KB
- **Maximum**: 50 KB
- Optimize for fast loading in dialogs

## Design Guidelines

### Logo Type
The PikSend logo should be a **wordmark** or **combination mark**:

#### Option A: Wordmark Only
- "PikSend" text in custom or branded typography
- Clean, modern, professional appearance
- Easily readable at small sizes

#### Option B: Combination Mark
- Icon/symbol + "PikSend" wordmark
- Icon on left, text on right (standard layout)
- Balanced visual weight between elements

#### Option C: Lettermark + Wordmark
- "PS" monogram + full "PikSend" text
- Compact and recognizable
- Works well in limited space

### Typography

#### Primary Typeface
Choose a font that conveys:
- **Professionalism**: Clean, well-crafted letterforms
- **Modernity**: Contemporary design, not dated
- **Readability**: Clear at small sizes (12-16px height)
- **Friendliness**: Approachable, not overly corporate

#### Recommended Font Families
- **Sans-Serif Modern**: Inter, Poppins, Montserrat, Nunito
- **Geometric Sans**: Futura, Avenir, Gotham, Circular
- **Humanist Sans**: Open Sans, Lato, Source Sans Pro
- **Custom**: Consider a custom typeface for uniqueness

#### Typography Specifications
- **Weight**: Medium to Bold (500-700)
- **Letter Spacing**: -2% to 0% (slightly tight for modern look)
- **Case**: 
  - "PikSend" (mixed case) - friendly, approachable
  - "PIKSEND" (all caps) - bold, authoritative
  - "piksend" (lowercase) - casual, modern

### Color Palette

#### Primary Logo Colors
1. **Full Color** (default):
   - Primary: #4A90E2 (Blue)
   - Accent: #50E3C2 (Teal) or #F5A623 (Orange)
   - Text: #2C3E50 (Dark Blue-Gray)

2. **Single Color** (simplified):
   - All elements in #4A90E2 (Blue)
   - Use for monochromatic contexts

3. **White** (dark backgrounds):
   - All elements in #FFFFFF
   - Use in dark mode interfaces

4. **Black** (light backgrounds):
   - All elements in #2C3E50 or #000000
   - Use for high contrast

#### Color Usage Guidelines
- **Background**: Always transparent
- **Text**: Should have 4.5:1 contrast ratio with backgrounds
- **Gradients**: Subtle, from primary to accent color (optional)
- **Effects**: Minimal shadows, avoid heavy effects

### Visual Elements

#### Icon/Symbol (if using combination mark)
Potential icon concepts:
- **Camera Shutter**: Circular aperture blades
- **Photo Frame**: Minimalist frame outline
- **Upload Arrow**: Stylized upward arrow
- **Gallery Grid**: 2x2 or 3x3 photo grid
- **Letter P**: Stylized "P" with photo/camera element

#### Icon Specifications
- **Size**: 40x40 pixels (within 200x50 canvas)
- **Position**: Left-aligned with 5px padding
- **Style**: Match typography style (geometric, rounded, etc.)
- **Color**: Match or complement wordmark color

### Layout and Spacing

#### Horizontal Logo (200x50)
```
[5px padding] [40x40 icon] [10px gap] [PikSend text] [5px padding]
```

#### Spacing Guidelines
- **Left Padding**: 5-10px
- **Right Padding**: 5-10px
- **Icon-Text Gap**: 8-12px
- **Top/Bottom Padding**: Equal (centered vertically)
- **Letter Spacing**: -1% to 0%

#### Alignment
- **Vertical**: Center-aligned within 50px height
- **Horizontal**: Left-aligned (icon + text)
- **Baseline**: Text baseline aligned with icon center

### Clear Space
Maintain minimum clear space around logo:
- **All Sides**: Minimum 10px (20% of logo height)
- **Purpose**: Ensures logo isn't crowded by other elements
- **Exception**: Can be reduced to 5px in tight layouts

## Design Variations

### Variation 1: Modern Geometric
```
Description:
- Sans-serif font (Inter Bold)
- "PikSend" in mixed case
- Geometric camera icon (circular aperture)
- Primary blue color (#4A90E2)
- Clean, minimal design

Best For: Professional, tech-savvy audience
```

### Variation 2: Friendly Rounded
```
Description:
- Rounded sans-serif font (Nunito Bold)
- "PikSend" in mixed case
- Rounded photo frame icon
- Gradient from blue to teal
- Soft, approachable design

Best For: Creative professionals, accessibility
```

### Variation 3: Bold Uppercase
```
Description:
- Strong sans-serif font (Montserrat Bold)
- "PIKSEND" in all caps
- Upward arrow icon
- Solid primary blue
- Confident, authoritative design

Best For: Enterprise, professional services
```

### Variation 4: Minimalist Wordmark
```
Description:
- Custom sans-serif font
- "piksend" in lowercase
- No icon (text only)
- Subtle letter customization (dot on 'i' as camera)
- Ultra-clean, modern design

Best For: Simplicity, brand recognition
```

## Usage Contexts

### Within Plugin Dialogs
- **Authentication Dialog**: Top center, 200x50
- **Settings Panel**: Top left, 160x40
- **About Dialog**: Center, 300x75
- **Error Messages**: Top left, 160x40

### Background Compatibility
Logo must work on:
- **Light Gray** (#F5F5F5) - Lightroom's light panels
- **Dark Gray** (#3A3A3A) - Lightroom's dark interface
- **White** (#FFFFFF) - Dialog backgrounds
- **Black** (#000000) - Dark mode

### Size Variations
- **Large** (300x75): About dialog, splash screen
- **Medium** (200x50): Main dialogs, authentication
- **Small** (160x40): Settings, compact panels
- **Tiny** (120x30): Status bars, footers

## Technical Requirements

### Transparency
- **Background**: Fully transparent (0% opacity)
- **Logo Elements**: Fully opaque (100% opacity)
- **Anti-aliasing**: Smooth edges, no jagged pixels
- **Halo Prevention**: No white/colored halos around edges

### Color Profile
- **sRGB IEC61966-2.1** (standard web color space)
- Ensures consistent colors across Windows and macOS

### Compression
- **Lossless PNG compression**
- Tools: OptiPNG, PNGCrush, TinyPNG
- Target: Reduce file size by 30-50% without quality loss

### Metadata
Include PNG metadata:
- **Title**: "PikSend Logo"
- **Author**: "PikSend Design Team"
- **Copyright**: "© 2024 PikSend. All rights reserved."
- **Description**: "Official logo for PikSend photo sharing service"
- **Keywords**: "PikSend, logo, photography, gallery, sharing"

## Accessibility

### Readability
- **Minimum Text Height**: 12px at actual display size
- **Stroke Width**: Minimum 2px for thin elements
- **Contrast**: 4.5:1 ratio against backgrounds
- **Clarity**: Readable without color (test in grayscale)

### Color Blindness
Test logo with color blindness simulators:
- **Deuteranopia** (red-green, most common)
- **Protanopia** (red-green)
- **Tritanopia** (blue-yellow)
- **Achromatopsia** (complete color blindness)

Ensure logo is distinguishable in all conditions.

### Screen Reader Compatibility
When used in web contexts:
- Include alt text: "PikSend logo"
- Use semantic HTML: `<img>` with proper attributes
- Provide text alternative in plugin dialogs

## Platform Considerations

### Windows
- Test on 100%, 125%, 150%, 175%, 200% DPI scaling
- Ensure crisp rendering at all scales
- Verify colors on various monitor types (TN, IPS, OLED)

### macOS
- Provide @2x version for Retina displays (400x100)
- Test in light and dark mode
- Verify rendering in Lightroom's native macOS interface

### Lightroom Interface
- **Dark Mode**: Use white or light blue logo variant
- **Light Mode**: Use full color or dark logo variant
- **Contrast**: Ensure visibility in all Lightroom themes

## Brand Consistency

### Alignment with PikSend Brand
- Match colors from main PikSend website
- Use same or compatible typography
- Maintain consistent visual style
- Reflect brand personality (professional, creative, reliable)

### Logo Variations Needed
1. **Primary Logo**: Full color on transparent background
2. **White Logo**: For dark backgrounds
3. **Black Logo**: For light backgrounds
4. **Monochrome Logo**: Single color version

### Don'ts (Logo Misuse)
- ❌ Don't stretch or distort proportions
- ❌ Don't change colors arbitrarily
- ❌ Don't add effects (drop shadows, glows, etc.)
- ❌ Don't rotate or skew the logo
- ❌ Don't place on busy backgrounds
- ❌ Don't use low-resolution versions
- ❌ Don't modify typography or spacing

## Testing Checklist

Before finalizing the logo:

- [ ] Displays correctly at 200x50, 160x40, and 300x75 pixels
- [ ] Readable and clear at smallest size (120x30)
- [ ] Transparent background with no artifacts
- [ ] Colors match PikSend brand guidelines
- [ ] File size is under 50 KB
- [ ] Looks good on light, dark, and colored backgrounds
- [ ] Passes color blindness simulation tests
- [ ] Text is readable at 12px height
- [ ] No copyright issues with fonts or design elements
- [ ] Metadata is properly embedded
- [ ] PNG is optimized for distribution
- [ ] Works in both Lightroom light and dark modes

## Design Tools

### Recommended Software
- **Adobe Illustrator**: Vector logo design (preferred)
- **Adobe Photoshop**: Raster editing and export
- **Figma**: Collaborative design, easy sharing
- **Sketch**: macOS-native design tool
- **Inkscape**: Free, open-source vector editor

### Export Settings (Illustrator)
1. File > Export > Export for Screens...
2. Format: PNG
3. Scales: 1x (200x50), 2x (400x100)
4. Background: Transparent
5. Anti-aliasing: Type Optimized (Hinted)
6. Color Space: sRGB

### Export Settings (Photoshop)
1. File > Export > Export As...
2. Format: PNG
3. Transparency: Checked
4. Convert to sRGB: Checked
5. Metadata: Copyright and Contact Info
6. Image Size: 200x50 pixels
7. Resample: Bicubic Sharper

## Typography Licensing

### Font Licensing Requirements
- Ensure font license allows:
  - Commercial use
  - Logo/branding use
  - Embedding in software
  - Distribution with plugin

### Recommended Licensed Fonts
- **Google Fonts**: Free, open-source (SIL Open Font License)
- **Adobe Fonts**: Included with Creative Cloud subscription
- **Commercial Fonts**: Purchase appropriate license

### Font Alternatives
If custom font isn't available:
- Convert text to outlines/paths in vector format
- Embed font in source files
- Use system fonts as fallback (Arial, Helvetica)

## Delivery Format

### Final Deliverables
1. **logo.png** (200x50) - Primary file for plugin
2. **logo@2x.png** (400x100) - High-DPI version
3. **logo-white.png** (200x50) - White version for dark backgrounds
4. **logo-black.png** (200x50) - Black version for light backgrounds
5. **logo-source.ai** or **.svg** - Editable vector source
6. **logo-preview.jpg** - Preview showing logo on various backgrounds

### File Organization
```
resources/
├── logo.png              (200x50, full color)
├── logo@2x.png          (400x100, full color)
├── logo-white.png       (200x50, white version)
├── logo-black.png       (200x50, black version)
└── source/
    ├── logo-source.ai   (vector source)
    ├── logo-source.svg  (web vector)
    └── logo-preview.jpg (background preview)
```

## Usage Examples

### Code Implementation (Lua)
```lua
-- Display logo in dialog
local logo = f:picture {
  value = _PLUGIN:resourceId("logo.png"),
  width = 200,
  height = 50,
}

-- Adaptive logo based on theme
local logoFile = isDarkMode and "logo-white.png" or "logo.png"
local logo = f:picture {
  value = _PLUGIN:resourceId(logoFile),
  width = 200,
  height = 50,
}
```

### Dialog Header Example
```
┌─────────────────────────────────────────┐
│  [PikSend Logo]                         │
│                                         │
│  Connect to your PikSend Pro account   │
│  ─────────────────────────────────────  │
│  API Token: [________________]          │
│                                         │
│  [Cancel]              [Connect]        │
└─────────────────────────────────────────┘
```

## Version History

When updating the logo:
- Document changes and rationale
- Archive previous versions
- Update version number in metadata
- Test compatibility with all plugin versions
- Update brand guidelines documentation

## Approval Process

Before finalizing:
1. **Design Review**: Submit to PikSend design team
2. **Brand Compliance**: Verify alignment with brand guidelines
3. **Technical Review**: Test in actual plugin dialogs
4. **Stakeholder Approval**: Get sign-off from product manager
5. **User Testing**: Gather feedback from beta testers (optional)

---

**Last Updated**: 2024
**Document Version**: 1.0
**Status**: Specification - Awaiting Design Implementation
