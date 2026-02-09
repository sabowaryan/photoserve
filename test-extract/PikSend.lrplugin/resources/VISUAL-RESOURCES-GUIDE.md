# Visual Resources Guide - PikSend Lightroom Plugin

## Overview

This guide provides a comprehensive overview of all visual resources required for the PikSend Lightroom plugin. These resources are essential for branding, user interface, and functionality of the plugin.

## Required Visual Resources

### 1. Plugin Icon (icon.png)
**Purpose**: Represents the plugin in Lightroom's Plugin Manager and system interfaces

**Specifications**:
- **File**: `icon.png`
- **Size**: 256x256 pixels
- **Format**: PNG with transparency
- **File Size**: < 100 KB
- **Usage**: Plugin Manager, system icons, application lists

**Detailed Specifications**: See [ICON-SPECIFICATIONS.md](./ICON-SPECIFICATIONS.md)

**Key Requirements**:
- Instantly recognizable
- Scalable to multiple sizes (32x32 to 512x512)
- Works on light and dark backgrounds
- Represents photography and sharing concepts
- Follows PikSend brand guidelines

---

### 2. PikSend Logo (logo.png)
**Purpose**: Brand identifier displayed in plugin dialogs and settings

**Specifications**:
- **File**: `logo.png`
- **Size**: 200x50 pixels (4:1 aspect ratio)
- **Format**: PNG with transparency
- **File Size**: < 50 KB
- **Usage**: Authentication dialogs, settings panels, about screens

**Detailed Specifications**: See [LOGO-SPECIFICATIONS.md](./LOGO-SPECIFICATIONS.md)

**Key Requirements**:
- Professional and modern appearance
- Readable at small sizes
- Multiple color variants (full color, white, black)
- Consistent with PikSend brand identity
- Works in Lightroom's light and dark modes

---

### 3. Default Watermark (watermark-default.png)
**Purpose**: Applied to exported photos for copyright protection

**Specifications**:
- **File**: `watermark-default.png`
- **Size**: 200x200 pixels (square)
- **Format**: PNG with transparency
- **File Size**: < 30 KB
- **Usage**: Overlaid on exported photos

**Detailed Specifications**: See [WATERMARK-SPECIFICATIONS.md](./WATERMARK-SPECIFICATIONS.md)

**Key Requirements**:
- Subtle and professional
- Semi-transparent (30-60% opacity)
- Works on various photo types
- Includes copyright symbol
- Customizable by users

---

## Design Principles

### Brand Consistency
All visual resources should:
- Use PikSend brand colors (Blue #4A90E2, Teal #50E3C2, Orange #F5A623)
- Follow consistent design language
- Maintain professional appearance
- Reflect brand personality (professional, creative, reliable)

### Technical Excellence
All resources must:
- Use proper color profiles (sRGB)
- Include transparency where needed
- Be optimized for file size
- Include proper metadata
- Support high-DPI displays

### User Experience
Visual resources should:
- Be clear and recognizable
- Not distract from main functionality
- Work in various contexts and sizes
- Support accessibility requirements
- Enhance professional appearance

---

## Color Palette

### Primary Colors
- **Primary Blue**: #4A90E2
  - Usage: Main brand color, primary UI elements
  - Represents: Trust, technology, professionalism

- **Teal Accent**: #50E3C2
  - Usage: Secondary accents, highlights
  - Represents: Creativity, freshness

- **Orange Accent**: #F5A623
  - Usage: Call-to-action, energy
  - Represents: Action, enthusiasm

### Neutral Colors
- **Dark Gray**: #2C3E50
  - Usage: Text, dark elements
  
- **Medium Gray**: #7F8C8D
  - Usage: Secondary text, borders

- **Light Gray**: #ECF0F1
  - Usage: Backgrounds, subtle elements

### Monochrome
- **White**: #FFFFFF
  - Usage: Dark mode, light elements

- **Black**: #000000
  - Usage: Text, high contrast elements

---

## Typography

### Recommended Font Families

#### Sans-Serif (Primary)
- **Inter**: Modern, highly readable, excellent for UI
- **Roboto**: Clean, professional, widely available
- **Open Sans**: Friendly, approachable, versatile
- **Montserrat**: Bold, geometric, strong presence

#### Sans-Serif (Alternative)
- **Poppins**: Rounded, friendly, modern
- **Nunito**: Soft, approachable, readable
- **Lato**: Elegant, professional, versatile

#### Serif (Accent)
- **Merriweather**: Elegant, readable, professional
- **Playfair Display**: Sophisticated, high-end

### Typography Guidelines
- **Weights**: Regular (400), Medium (500), Bold (700)
- **Sizes**: Scale from 12px to 24px
- **Line Height**: 1.4-1.6 for body text
- **Letter Spacing**: -1% to 0% for headings, 0% for body

---

## File Structure

### Current Structure
```
PikSend.lrplugin/resources/
├── README.md                          # Basic overview
├── VISUAL-RESOURCES-GUIDE.md         # This file
├── ICON-SPECIFICATIONS.md            # Detailed icon specs
├── LOGO-SPECIFICATIONS.md            # Detailed logo specs
├── WATERMARK-SPECIFICATIONS.md       # Detailed watermark specs
├── icon.png                          # [TO BE CREATED]
├── icon@2x.png                       # [TO BE CREATED]
├── logo.png                          # [TO BE CREATED]
├── logo@2x.png                       # [TO BE CREATED]
├── logo-white.png                    # [TO BE CREATED]
├── logo-black.png                    # [TO BE CREATED]
├── watermark-default.png             # [TO BE CREATED]
├── watermark-default@2x.png          # [TO BE CREATED]
├── FAQ.md                            # User documentation
├── screenshots/                      # Plugin screenshots
└── source/                           # [TO BE CREATED]
    ├── icon-source.ai                # Editable icon
    ├── logo-source.ai                # Editable logo
    └── watermark-source.psd          # Editable watermark
```

### Required Files (To Be Created)

#### Essential Files
1. **icon.png** (256x256) - Plugin icon
2. **logo.png** (200x50) - PikSend logo
3. **watermark-default.png** (200x200) - Default watermark

#### High-DPI Versions (Recommended)
4. **icon@2x.png** (512x512) - Retina icon
5. **logo@2x.png** (400x100) - Retina logo
6. **watermark-default@2x.png** (400x400) - High-res watermark

#### Color Variants (Recommended)
7. **logo-white.png** (200x50) - White logo for dark backgrounds
8. **logo-black.png** (200x50) - Black logo for light backgrounds

#### Source Files (Essential for Future Edits)
9. **source/icon-source.ai** - Editable icon (Illustrator)
10. **source/logo-source.ai** - Editable logo (Illustrator)
11. **source/watermark-source.psd** - Editable watermark (Photoshop)

---

## Design Workflow

### Phase 1: Concept Development
1. **Research**: Study similar plugins and photography apps
2. **Brainstorm**: Generate multiple design concepts
3. **Sketch**: Create rough sketches of ideas
4. **Select**: Choose 2-3 concepts to develop further

### Phase 2: Design Creation
1. **Icon Design**: Create plugin icon following specifications
2. **Logo Design**: Design or adapt PikSend logo
3. **Watermark Design**: Create default watermark
4. **Variations**: Develop color and size variants

### Phase 3: Review and Refinement
1. **Internal Review**: Design team feedback
2. **Technical Review**: Verify specifications compliance
3. **User Testing**: Get feedback from photographers
4. **Refinement**: Iterate based on feedback

### Phase 4: Finalization
1. **Optimization**: Compress files, optimize for performance
2. **Documentation**: Update specifications if needed
3. **Delivery**: Export all required formats
4. **Integration**: Add files to plugin resources

### Phase 5: Testing
1. **Visual Testing**: Verify appearance in plugin
2. **Platform Testing**: Test on Windows and macOS
3. **Size Testing**: Verify all size variants
4. **Accessibility Testing**: Check color contrast and readability

---

## Design Tools and Resources

### Recommended Software

#### Vector Design
- **Adobe Illustrator**: Industry standard, best for logos and icons
- **Figma**: Collaborative, modern, web-based
- **Sketch**: macOS-native, popular for UI design
- **Inkscape**: Free, open-source alternative

#### Raster Design
- **Adobe Photoshop**: Best for watermarks and photo editing
- **GIMP**: Free, open-source alternative
- **Affinity Photo**: Cost-effective professional tool

#### Optimization Tools
- **TinyPNG**: Online PNG compression
- **ImageOptim**: macOS batch optimization
- **OptiPNG**: Command-line PNG optimizer
- **SVGO**: SVG optimization (if using SVG sources)

### Design Resources

#### Icon Inspiration
- **Dribbble**: Photography and plugin icons
- **Behance**: Professional design portfolios
- **IconFinder**: Icon design examples
- **The Noun Project**: Simple icon concepts

#### Typography Resources
- **Google Fonts**: Free, open-source fonts
- **Adobe Fonts**: Included with Creative Cloud
- **Font Squirrel**: Free commercial fonts
- **MyFonts**: Commercial font marketplace

#### Color Tools
- **Coolors**: Color palette generator
- **Adobe Color**: Color wheel and schemes
- **Contrast Checker**: WCAG compliance testing
- **Color Blindness Simulator**: Accessibility testing

---

## Quality Checklist

### Before Finalizing Any Visual Resource

#### Technical Quality
- [ ] Correct dimensions and aspect ratio
- [ ] Proper file format (PNG with transparency)
- [ ] Optimized file size (within limits)
- [ ] Correct color profile (sRGB)
- [ ] Proper metadata embedded
- [ ] No compression artifacts
- [ ] Smooth anti-aliasing on edges

#### Design Quality
- [ ] Follows brand guidelines
- [ ] Professional appearance
- [ ] Clear and recognizable
- [ ] Scalable to different sizes
- [ ] Works on various backgrounds
- [ ] Consistent with other resources
- [ ] Timeless design (not trendy)

#### Accessibility
- [ ] Sufficient color contrast
- [ ] Readable at small sizes
- [ ] Works in grayscale
- [ ] Passes color blindness tests
- [ ] Clear visual hierarchy
- [ ] No reliance on color alone

#### Legal Compliance
- [ ] No copyright violations
- [ ] Proper font licensing
- [ ] Trademark compliance
- [ ] Attribution if required
- [ ] Commercial use allowed

#### Platform Compatibility
- [ ] Works on Windows
- [ ] Works on macOS
- [ ] Supports high-DPI displays
- [ ] Compatible with Lightroom versions
- [ ] Tested in light and dark modes

---

## Implementation Guidelines

### Using Resources in Plugin Code

#### Loading Icon
```lua
-- Icon is automatically loaded by Lightroom from Info.lua
-- No code needed, just ensure icon.png exists in plugin root
```

#### Displaying Logo
```lua
local LrView = import 'LrView'
local f = LrView.osFactory()

-- In dialog creation
local logo = f:picture {
  value = _PLUGIN:resourceId("resources/logo.png"),
  width = 200,
  height = 50,
}

-- Adaptive logo based on theme
local function getLogoForTheme()
  local isDarkMode = -- detect Lightroom theme
  return isDarkMode and "resources/logo-white.png" or "resources/logo.png"
end
```

#### Applying Watermark
```lua
-- In export settings
function applyWatermark(exportedPhoto, settings)
  local watermarkPath = _PLUGIN:resourceId("resources/watermark-default.png")
  
  -- Use Lightroom's image processing to overlay watermark
  -- Position: settings.watermarkPosition (e.g., "bottomRight")
  -- Opacity: settings.watermarkOpacity (e.g., 50)
  -- Scale: settings.watermarkScale (e.g., 10% of photo width)
end
```

### Resource Loading Best Practices
- **Lazy Loading**: Load resources only when needed
- **Caching**: Cache loaded resources to avoid repeated file I/O
- **Error Handling**: Gracefully handle missing resources
- **Fallbacks**: Provide text alternatives if images fail to load

---

## Maintenance and Updates

### Version Control
- Keep source files in version control (Git)
- Tag releases with version numbers
- Document changes in commit messages
- Archive old versions for reference

### Update Process
1. **Identify Need**: User feedback, rebranding, improvements
2. **Design Update**: Create new version following specifications
3. **Review**: Get approval from stakeholders
4. **Test**: Verify in plugin across platforms
5. **Deploy**: Include in next plugin release
6. **Document**: Update specifications and changelog

### Changelog Format
```markdown
## Visual Resources Changelog

### Version 1.1.0 (2024-XX-XX)
- Updated icon with new brand colors
- Added high-DPI logo variants
- Improved watermark visibility on dark photos

### Version 1.0.0 (2024-XX-XX)
- Initial release
- Created icon, logo, and watermark
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Icon not appearing in Plugin Manager
**Solution**: 
- Verify icon.png is in plugin root directory
- Check file is exactly 256x256 pixels
- Ensure PNG format with proper transparency
- Restart Lightroom

#### Issue: Logo appears pixelated
**Solution**:
- Provide @2x version for high-DPI displays
- Ensure logo is exported at correct size
- Check image is not being upscaled
- Use vector source for crisp rendering

#### Issue: Watermark too prominent/subtle
**Solution**:
- Adjust opacity in plugin settings
- Provide multiple watermark variants
- Allow user customization
- Test on various photo types

#### Issue: Colors look different on different platforms
**Solution**:
- Use sRGB color profile
- Test on both Windows and macOS
- Avoid device-specific color profiles
- Embed color profile in PNG

---

## Contact and Support

### For Design Questions
- **Design Team**: design@piksend.com
- **Brand Guidelines**: Available on internal wiki
- **Design Reviews**: Schedule via project management tool

### For Technical Questions
- **Development Team**: dev@piksend.com
- **Plugin Documentation**: See DEVELOPMENT.md
- **Bug Reports**: Use issue tracker

### For Approval Process
- **Product Manager**: Approves final designs
- **Legal Team**: Reviews trademark/copyright compliance
- **QA Team**: Tests implementation

---

## Additional Resources

### Documentation
- [Plugin Development Guide](../DEVELOPMENT.md)
- [Installation Guide](../INSTALLATION-GUIDE.md)
- [User Guide](../USER-GUIDE.md)
- [FAQ](./FAQ.md)

### External References
- [Adobe Lightroom SDK Documentation](https://www.adobe.io/apis/creativecloud/lightroom.html)
- [PNG Specification](http://www.libpng.org/pub/png/spec/)
- [sRGB Color Space](https://en.wikipedia.org/wiki/SRGB)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Summary

This guide provides comprehensive specifications for all visual resources required by the PikSend Lightroom plugin. Each resource has detailed specifications in separate documents:

1. **Icon**: See [ICON-SPECIFICATIONS.md](./ICON-SPECIFICATIONS.md)
2. **Logo**: See [LOGO-SPECIFICATIONS.md](./LOGO-SPECIFICATIONS.md)
3. **Watermark**: See [WATERMARK-SPECIFICATIONS.md](./WATERMARK-SPECIFICATIONS.md)

Follow these specifications to create professional, consistent, and functional visual resources that enhance the plugin's user experience and brand identity.

---

**Document Version**: 1.0
**Last Updated**: 2024
**Status**: Complete - Ready for Design Implementation
**Next Steps**: Create actual image files based on these specifications
