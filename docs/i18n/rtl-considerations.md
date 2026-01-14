# RTL (Right-to-Left) Considerations

This document covers the implementation and best practices for supporting right-to-left languages in PikSend.

## Overview

PikSend supports Arabic (ar) as an RTL language. When Arabic is selected, the entire UI mirrors horizontally to provide a natural reading experience for RTL users.

## How RTL Works

### Automatic Direction Detection

The `RTLManager` class in `src/lib/i18n/rtl.ts` handles RTL detection:

```typescript
import { RTLManager } from '@/lib/i18n/rtl';

// Check if current locale is RTL
const isRTL = RTLManager.isRTL('ar');  // true
const isRTL = RTLManager.isRTL('en');  // false

// Get direction
const direction = RTLManager.getDirection('ar');  // 'rtl'
const direction = RTLManager.getDirection('en');  // 'ltr'
```

### Document Direction

When the locale changes, the `RTLManager.applyDirection()` method sets:
- `document.documentElement.dir` - The direction attribute
- `document.documentElement.lang` - The language attribute

This triggers all RTL CSS rules automatically.

### Using RTL in Components

Access RTL state via the `useTranslation` hook:

```typescript
import { useTranslation } from '@/lib/i18n';

function MyComponent() {
  const { isRTL, direction } = useTranslation();
  
  return (
    <div className={isRTL ? 'rtl-specific-class' : ''}>
      {/* Content */}
    </div>
  );
}
```

## CSS Patterns for RTL

### Base RTL Styles

The base RTL styles in `src/app/globals.css` automatically apply when `dir="rtl"`:

```css
[dir="rtl"] {
  text-align: right;
}
```

### Mirrored Properties

#### Padding and Margins

Use logical properties that automatically flip:

```css
/* These automatically flip in RTL */
[dir="rtl"] .ps-4 { padding-inline-start: 1rem; }
[dir="rtl"] .pe-4 { padding-inline-end: 1rem; }
[dir="rtl"] .ms-4 { margin-inline-start: 1rem; }
[dir="rtl"] .me-4 { margin-inline-end: 1rem; }
```

**In components, prefer logical properties:**
```jsx
// ✅ Good - uses logical properties
<div className="ps-4 pe-2">Content</div>

// ❌ Avoid - physical properties don't flip
<div className="pl-4 pr-2">Content</div>
```

#### Positioning

Position properties are mirrored:

```css
[dir="rtl"] .left-0 { left: auto; right: 0; }
[dir="rtl"] .right-0 { right: auto; left: 0; }
```

#### Flex Direction

Flex rows are automatically reversed:

```css
[dir="rtl"] .flex-row { flex-direction: row-reverse; }
[dir="rtl"] .flex-row-reverse { flex-direction: row; }
```

#### Text Alignment

Text alignment is mirrored:

```css
[dir="rtl"] .text-left { text-align: right; }
[dir="rtl"] .text-right { text-align: left; }
```

#### Border Radius

Corner radii are swapped:

```css
[dir="rtl"] .rounded-l-lg { 
  border-top-left-radius: 0; 
  border-bottom-left-radius: 0; 
  border-top-right-radius: 0.5rem; 
  border-bottom-right-radius: 0.5rem; 
}
```

#### Gradients

Gradient directions are reversed:

```css
[dir="rtl"] .bg-gradient-to-r { 
  background-image: linear-gradient(to left, var(--tw-gradient-stops)); 
}
```

### RTL-Specific Utilities

For explicit RTL control, use the `rtl:` prefix utilities:

```css
[dir="rtl"] .rtl\:rotate-180 { transform: rotate(180deg); }
[dir="rtl"] .rtl\:scale-x-\[-1\] { transform: scaleX(-1); }
[dir="rtl"] .rtl\:text-right { text-align: right; }
[dir="rtl"] .rtl\:flex-row-reverse { flex-direction: row-reverse; }
```

**Usage:**
```jsx
// Icon that should flip in RTL
<ChevronRight className="rtl:rotate-180" />

// Text that should stay left-aligned even in RTL
<code className="rtl:text-left">const x = 1;</code>
```

## Layout Best Practices

### 1. Use Logical Properties

Prefer CSS logical properties over physical ones:

| Physical (Avoid) | Logical (Prefer) |
|------------------|------------------|
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `left` | `inset-inline-start` |
| `right` | `inset-inline-end` |
| `border-left` | `border-inline-start` |
| `border-right` | `border-inline-end` |

### 2. Icons and Arrows

Directional icons should flip in RTL:

```jsx
// Arrow icons
<ArrowRight className="rtl:rotate-180" />
<ChevronLeft className="rtl:rotate-180" />

// Or use scaleX for mirroring
<ArrowRight className="rtl:scale-x-[-1]" />
```

**Icons that should NOT flip:**
- Checkmarks ✓
- Plus/minus signs
- Play/pause buttons
- Social media logos

### 3. Forms and Inputs

Form layouts should mirror naturally:

```jsx
<form className="space-y-4">
  <div className="flex items-center gap-2">
    <label className="text-start">Email</label>
    <input className="flex-1" />
  </div>
</form>
```

### 4. Navigation

Navigation items should flow in reading direction:

```jsx
<nav className="flex items-center gap-4">
  {/* Items will automatically reverse in RTL */}
  <Link href="/">Home</Link>
  <Link href="/features">Features</Link>
  <Link href="/pricing">Pricing</Link>
</nav>
```

### 5. Tables

Table content alignment should respect direction:

```jsx
<table>
  <thead>
    <tr>
      <th className="text-start">Name</th>
      <th className="text-end">Amount</th>
    </tr>
  </thead>
</table>
```

### 6. Modals and Dialogs

Close buttons and actions should be positioned correctly:

```jsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Title</DialogTitle>
    {/* Close button position handled by CSS */}
    <DialogClose className="absolute top-4 end-4" />
  </DialogHeader>
</Dialog>
```

## Testing RTL Layouts

### Manual Testing Checklist

- [ ] **Navigation** - Menu items flow correctly
- [ ] **Forms** - Labels and inputs align properly
- [ ] **Buttons** - Icons and text are positioned correctly
- [ ] **Cards** - Content flows in reading direction
- [ ] **Tables** - Columns and alignment are correct
- [ ] **Modals** - Close buttons and actions are positioned correctly
- [ ] **Dropdowns** - Open in correct direction
- [ ] **Tooltips** - Appear on correct side
- [ ] **Scrollbars** - Appear on correct side
- [ ] **Animations** - Slide directions are correct

### Browser Testing

1. **Switch to Arabic** in the language switcher
2. **Inspect the HTML element** - verify `dir="rtl"` is set
3. **Check each page** for layout issues
4. **Test interactions** - dropdowns, modals, tooltips

### Automated Testing

```typescript
// Example test for RTL direction
describe('RTL Support', () => {
  it('should set RTL direction for Arabic', () => {
    RTLManager.applyDirection('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });

  it('should set LTR direction for English', () => {
    RTLManager.applyDirection('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });
});
```

## Common RTL Issues

### Issue: Text Overflow

**Problem:** Long text overflows in RTL
**Solution:** Use `text-ellipsis` with `overflow-hidden` and ensure container has proper width

### Issue: Icons Not Flipping

**Problem:** Directional icons point wrong way
**Solution:** Add `rtl:rotate-180` or `rtl:scale-x-[-1]` class

### Issue: Absolute Positioning

**Problem:** Absolutely positioned elements appear on wrong side
**Solution:** Use `start-*` and `end-*` instead of `left-*` and `right-*`

### Issue: Flex Order

**Problem:** Flex items in wrong order
**Solution:** The CSS handles this automatically, but verify `flex-row` is used

### Issue: Border Radius

**Problem:** Rounded corners on wrong side
**Solution:** Use logical border-radius or the RTL CSS overrides

## RTL-Aware Component Example

```tsx
import { useTranslation } from '@/lib/i18n';
import { ChevronRight } from 'lucide-react';

function NavigationItem({ href, children }) {
  const { isRTL } = useTranslation();
  
  return (
    <a 
      href={href}
      className="flex items-center gap-2 px-4 py-2"
    >
      <span>{children}</span>
      <ChevronRight 
        className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} 
      />
    </a>
  );
}
```

## Related Documentation

- [Translation Key Conventions](./translation-key-conventions.md)
- [Adding New Languages](./adding-new-languages.md)
- [Translation Contribution Guide](./translation-contribution-guide.md)
