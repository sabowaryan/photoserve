# Design Quick Reference Card

**Quick reference for designers creating PikSend Lightroom plugin visual resources**

---

## 🎨 Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#4A90E2` | Main brand color, primary UI elements |
| Teal Accent | `#50E3C2` | Secondary accents, highlights |
| Orange Accent | `#F5A623` | Call-to-action, energy |
| Dark Gray | `#2C3E50` | Text, dark elements |
| Medium Gray | `#7F8C8D` | Secondary text, borders |
| Light Gray | `#ECF0F1` | Backgrounds, subtle elements |
| White | `#FFFFFF` | Dark mode, light elements |
| Black | `#000000` | Text, high contrast |

---

## 📐 Resource Specifications

### Icon (icon.png)
```
Size:        256x256 pixels
Format:      PNG with transparency
File Size:   < 100 KB
Color Mode:  RGB + Alpha (32-bit)
Profile:     sRGB IEC61966-2.1
```

**Design Concepts**:
- Camera + Cloud (upload symbol)
- Photo Frame + Arrow
- Gallery Grid + Share icon
- Lens + Network nodes

**Key Requirements**:
- Recognizable at 32x32 pixels
- Works on light AND dark backgrounds
- Scalable design
- Professional appearance

---

### Logo (logo.png)
```
Size:        200x50 pixels (4:1 ratio)
Format:      PNG with transparency
File Size:   < 50 KB
Color Mode:  RGB + Alpha (32-bit)
Profile:     sRGB IEC61966-2.1
```

**Design Options**:
- Wordmark only: "PikSend" text
- Combination: Icon + "PikSend" text
- Lettermark: "PS" + "PikSend"

**Typography**:
- Fonts: Inter, Roboto, Montserrat, Poppins
- Weight: Medium to Bold (500-700)
- Readable at 12px height

**Variants Needed**:
- Full color (default)
- White (for dark backgrounds)
- Black (for light backgrounds)

---

### Watermark (watermark-default.png)
```
Size:        200x200 pixels (square)
Format:      PNG with transparency
File Size:   < 30 KB
Color Mode:  RGB + Alpha (32-bit)
Profile:     sRGB IEC61966-2.1
```

**Design Elements**:
- "© PikSend" text
- Optional: Small logo/icon
- White color (#FFFFFF)
- 40-60% opacity
- Subtle drop shadow (2px, 30% opacity)

**Key Requirements**:
- Subtle, not intrusive
- Works on light AND dark photos
- Includes copyright symbol (©)
- Professional appearance

---

## 🛠️ Export Settings

### Adobe Illustrator
```
File > Export > Export for Screens
Format: PNG
Scales: 1x, 2x (for Retina)
Background: Transparent
Anti-aliasing: Type Optimized (Hinted)
Color Space: sRGB
```

### Adobe Photoshop
```
File > Export > Export As
Format: PNG
Transparency: ✓ Checked
Convert to sRGB: ✓ Checked
Metadata: Copyright and Contact Info
Resample: Bicubic Sharper
```

### Figma
```
Select layer > Export
Format: PNG
Scale: 1x, 2x
Background: Transparent
Color Profile: sRGB
```

---

## ✅ Pre-Flight Checklist

Before submitting designs:

**Technical**
- [ ] Correct dimensions
- [ ] PNG format with transparency
- [ ] File size within limits
- [ ] sRGB color profile
- [ ] Optimized (TinyPNG, ImageOptim)
- [ ] Metadata embedded

**Design**
- [ ] Follows brand colors
- [ ] Professional appearance
- [ ] Clear at small sizes
- [ ] Works on light backgrounds
- [ ] Works on dark backgrounds
- [ ] Consistent with other resources

**Accessibility**
- [ ] Sufficient contrast (3:1 minimum)
- [ ] Readable in grayscale
- [ ] Passes color blindness test
- [ ] Clear visual hierarchy

**Legal**
- [ ] No copyright violations
- [ ] Font license allows commercial use
- [ ] Trademark compliance verified

---

## 📦 Deliverables

### Essential Files
```
icon.png                    (256x256)
logo.png                    (200x50)
watermark-default.png       (200x200)
```

### High-DPI Versions (Recommended)
```
icon@2x.png                 (512x512)
logo@2x.png                 (400x100)
watermark-default@2x.png    (400x400)
```

### Color Variants
```
logo-white.png              (200x50)
logo-black.png              (200x50)
```

### Source Files (Required)
```
source/icon-source.ai       (Illustrator)
source/logo-source.ai       (Illustrator)
source/watermark-source.psd (Photoshop)
```

---

## 🔧 Optimization Tools

**Online**
- TinyPNG - https://tinypng.com
- Squoosh - https://squoosh.app

**Desktop**
- ImageOptim (macOS)
- FileOptimizer (Windows)
- OptiPNG (Command-line)

**Target Compression**
- Icon: 50-100 KB
- Logo: 20-50 KB
- Watermark: 10-30 KB

---

## 🎯 Design Principles

**Simplicity**
- Less is more
- Avoid unnecessary details
- Clean geometric shapes

**Consistency**
- Match PikSend brand
- Unified visual language
- Consistent style across resources

**Versatility**
- Works at multiple sizes
- Functions in various contexts
- Adapts to light/dark modes

**Professionalism**
- Polished appearance
- Trustworthy design
- Photography-focused aesthetic

---

## 📚 Full Documentation

For complete specifications, see:
- **[VISUAL-RESOURCES-GUIDE.md](./VISUAL-RESOURCES-GUIDE.md)** - Master guide
- **[ICON-SPECIFICATIONS.md](./ICON-SPECIFICATIONS.md)** - Icon details
- **[LOGO-SPECIFICATIONS.md](./LOGO-SPECIFICATIONS.md)** - Logo details
- **[WATERMARK-SPECIFICATIONS.md](./WATERMARK-SPECIFICATIONS.md)** - Watermark details

---

## 📞 Contact

**Questions?**
- Design Team: design@piksend.com
- Technical: dev@piksend.com

**Approval**
- Submit designs to product manager
- Allow 2-3 business days for review

---

**Version**: 1.0 | **Updated**: 2024 | **Status**: Ready for Design
