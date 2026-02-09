# Email Template Engine

The Email Template Engine provides a unified interface for rendering both React Email templates and custom WYSIWYG templates. It handles variable substitution, CSS inlining, plain text conversion, and template validation.

## Features

- ✅ **React Email Support**: Render existing React Email templates
- ✅ **Custom Templates**: Support for WYSIWYG editor templates
- ✅ **Variable Substitution**: Handlebars-like syntax (`{{variable}}` or `{variable}`)
- ✅ **Nested Properties**: Access nested data (`{{user.name}}`)
- ✅ **CSS Inlining**: Automatic CSS inlining for email client compatibility
- ✅ **Plain Text Generation**: Automatic conversion from HTML to plain text
- ✅ **Template Validation**: Validate required variables before rendering
- ✅ **Preview Generation**: Generate previews with sample data

## Installation

The template engine is already installed with the required dependencies:

```bash
npm install @react-email/components juice html-to-text
```

## Usage

### Basic Usage

```typescript
import { templateEngine } from '@/lib/email/template-engine';

// Render a React Email template
const result = await templateEngine.renderReactEmail('purchase-confirmation', {
  buyerName: 'John Doe',
  buyerEmail: 'john@example.com',
  galleryName: 'Wedding Photos',
  photoCount: 250,
  amountPaid: '$49.99',
  // ... other variables
});

console.log(result.html);    // HTML with inlined CSS
console.log(result.text);    // Plain text version
console.log(result.subject); // Email subject
```

### Custom Template Rendering

```typescript
const customTemplate = {
  html: '<h1>Hello {{name}}</h1><p>Your order #{{orderId}} is ready!</p>',
  subject: 'Order {{orderId}} Confirmation',
  requiredVariables: ['name', 'orderId'],
};

const result = await templateEngine.renderCustomTemplate(customTemplate, {
  name: 'John Doe',
  orderId: '12345',
});
```

### Variable Substitution

The template engine supports multiple variable formats:

```typescript
// Double braces (Handlebars-style)
'Hello {{name}}!'

// Single braces
'Hello {name}!'

// Nested properties
'Email: {{user.email}}'
'Address: {{user.address.city}}'

// With whitespace
'Hello {{ name }}!'
```

### Variable Validation

```typescript
const validation = templateEngine.validateVariables(
  ['name', 'email', 'subject'], // Required variables
  { name: 'John', email: 'john@example.com' } // Provided variables
);

if (!validation.valid) {
  console.log('Missing variables:', validation.missingVariables);
  console.log('Errors:', validation.errors);
}
```

### Preview Generation

```typescript
// Generate preview with sample data
const preview = await templateEngine.generatePreview(
  'purchase-confirmation',
  {
    buyerName: 'Preview User',
    buyerEmail: 'preview@example.com',
    // ... other sample data
  }
);
```

### CSS Inlining

```typescript
const html = `
  <style>
    .red { color: red; }
    .bold { font-weight: bold; }
  </style>
  <p class="red bold">Hello World</p>
`;

const inlined = templateEngine.inlineCSS(html);
// Result: <p style="color: red; font-weight: bold;">Hello World</p>
```

### Plain Text Conversion

```typescript
const html = `
  <h1>Welcome</h1>
  <p>Hello <strong>John</strong>,</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
  <a href="https://example.com">Click here</a>
`;

const text = templateEngine.convertToPlainText(html);
// Result: Readable plain text with preserved structure
```

## API Reference

### `TemplateEngine`

#### Methods

##### `renderReactEmail(templateName, variables)`

Renders a React Email template.

**Parameters:**
- `templateName` (string): Name of the template file (without extension)
- `variables` (Record<string, any>): Variables to pass to the template

**Returns:** `Promise<RenderedEmail>`

**Example:**
```typescript
const result = await templateEngine.renderReactEmail('purchase-confirmation', {
  buyerName: 'John Doe',
  // ... other variables
});
```

##### `renderCustomTemplate(content, variables)`

Renders a custom WYSIWYG template.

**Parameters:**
- `content` (CustomTemplateContent): Template content with HTML, subject, and required variables
- `variables` (Record<string, any>): Variables to substitute

**Returns:** `Promise<RenderedEmail>`

**Example:**
```typescript
const result = await templateEngine.renderCustomTemplate({
  html: '<p>Hello {{name}}</p>',
  subject: 'Welcome {{name}}',
  requiredVariables: ['name'],
}, { name: 'John' });
```

##### `substituteVariables(template, variables)`

Substitutes variables in a template string.

**Parameters:**
- `template` (string): Template string with variable placeholders
- `variables` (Record<string, any>): Variables to substitute

**Returns:** `string`

**Example:**
```typescript
const result = templateEngine.substituteVariables(
  'Hello {{name}}, your order #{{orderId}} is ready!',
  { name: 'John', orderId: '12345' }
);
// Result: "Hello John, your order #12345 is ready!"
```

##### `validateVariables(requiredVariables, providedVariables)`

Validates that all required variables are provided.

**Parameters:**
- `requiredVariables` (string[]): List of required variable names
- `providedVariables` (Record<string, any>): Variables provided for rendering

**Returns:** `ValidationResult`

**Example:**
```typescript
const validation = templateEngine.validateVariables(
  ['name', 'email'],
  { name: 'John' }
);
// validation.valid === false
// validation.missingVariables === ['email']
```

##### `generatePreview(templateName, sampleData?, isReactEmail?)`

Generates a preview of a template with sample data.

**Parameters:**
- `templateName` (string): Name of the template
- `sampleData` (Record<string, any>, optional): Sample data for preview
- `isReactEmail` (boolean, optional): Whether this is a React Email template (default: true)

**Returns:** `Promise<RenderedEmail>`

**Example:**
```typescript
const preview = await templateEngine.generatePreview(
  'purchase-confirmation',
  { buyerName: 'Preview User', /* ... */ }
);
```

##### `convertToPlainText(html)`

Converts HTML to plain text.

**Parameters:**
- `html` (string): HTML content

**Returns:** `string`

**Example:**
```typescript
const text = templateEngine.convertToPlainText('<p>Hello <strong>World</strong></p>');
// Result: "Hello World"
```

##### `inlineCSS(html)`

Inlines CSS styles for email client compatibility.

**Parameters:**
- `html` (string): HTML content with external/internal CSS

**Returns:** `string`

**Example:**
```typescript
const inlined = templateEngine.inlineCSS(`
  <style>.red { color: red; }</style>
  <p class="red">Text</p>
`);
// Result: <p style="color: red;">Text</p>
```

### Types

#### `RenderedEmail`

```typescript
interface RenderedEmail {
  html: string;    // HTML content with inlined CSS
  text: string;    // Plain text version
  subject: string; // Email subject line
}
```

#### `ValidationResult`

```typescript
interface ValidationResult {
  valid: boolean;              // Whether validation passed
  missingVariables: string[];  // List of missing required variables
  extraVariables: string[];    // List of extra variables provided
  errors: string[];            // Validation error messages
}
```

#### `CustomTemplateContent`

```typescript
interface CustomTemplateContent {
  html: string;                // HTML content
  subject: string;             // Subject line template
  requiredVariables: string[]; // Required variables
}
```

## Variable Substitution Rules

1. **Format**: Use `{{variableName}}` or `{variableName}`
2. **Nested Properties**: Use dot notation `{{user.name}}`
3. **Missing Variables**: Replaced with empty string
4. **Type Conversion**: Non-string values are converted to strings
5. **Null/Undefined**: Replaced with empty string
6. **Whitespace**: Whitespace around variable names is ignored

## CSS Inlining

The template engine uses [juice](https://github.com/Automattic/juice) for CSS inlining with the following options:

- ✅ Preserves `!important` declarations
- ✅ Removes `<style>` tags after inlining
- ✅ Preserves media queries for responsive design
- ✅ Preserves font faces

## Plain Text Conversion

The template engine uses [html-to-text](https://github.com/html-to-text/node-html-to-text) with the following configuration:

- ✅ Word wrap at 80 characters
- ✅ Preserves links with URLs
- ✅ Formats lists with bullet points
- ✅ Removes images (keeps alt text)
- ✅ Preserves heading structure

## Testing

The template engine includes comprehensive unit tests:

```bash
# Run all template engine tests
npm test -- src/lib/email/__tests__/

# Run specific test file
npm test -- src/lib/email/__tests__/template-engine.test.ts
npm test -- src/lib/email/__tests__/template-engine-react.test.ts
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **3.1**: Template rendering for React Email templates
- **3.2**: Custom template rendering for WYSIWYG templates
- **3.3**: Variable substitution with Handlebars-like syntax
- **3.4**: Variable validation
- **3.5**: Preview generation, plain text conversion, and CSS inlining

## Next Steps

1. **Template Repository**: Create repository for managing templates in database
2. **WYSIWYG Editor Integration**: Integrate with react-email-editor or Unlayer
3. **Template Versioning**: Implement version control for templates
4. **Template Migration**: Migrate existing React Email templates to database

## Related Files

- `src/lib/email/template-engine.ts` - Main template engine implementation
- `src/lib/email/__tests__/template-engine.test.ts` - Unit tests
- `src/lib/email/__tests__/template-engine-react.test.ts` - React Email integration tests
- `src/emails/` - React Email templates directory
