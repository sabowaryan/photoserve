# Email Template Creation Guide

## Overview

This guide covers everything you need to know about creating, editing, and managing email templates in PikSend. Whether you're creating transactional emails for automated workflows or marketing emails for campaigns, this guide will help you create professional, effective email templates.

## Table of Contents

1. [Template Basics](#template-basics)
2. [Creating Your First Template](#creating-your-first-template)
3. [Using the Visual Editor](#using-the-visual-editor)
4. [Template Variables](#template-variables)
5. [Design Best Practices](#design-best-practices)
6. [Testing Templates](#testing-templates)
7. [Template Versioning](#template-versioning)
8. [Advanced Features](#advanced-features)

## Template Basics

### Template Types

**Transactional Emails** 🔵
- Triggered by user actions
- Always sent regardless of subscription status
- Examples: Purchase confirmations, password resets, receipts
- Cannot be unsubscribed from
- Higher open rates (typically 40-60%)

**Marketing Emails** 🟢
- Promotional or informational content
- Respect unsubscribe preferences
- Examples: Newsletters, product announcements, special offers
- Must include unsubscribe link
- Lower open rates (typically 15-25%)

### Template Sources

**React Email Templates**
- Code-based templates
- Existing system templates
- Maintained by developers
- Cannot be edited in visual editor

**Custom Templates**
- Created in visual editor
- No coding required
- Fully customizable
- Can be edited by admins

## Creating Your First Template

### Step 1: Navigate to Templates

1. Go to **Admin > Emails > Templates**
2. Click **Create Template** button

### Step 2: Configure Template Settings

Fill in the basic information:

**Template Name**
- Internal name for organization
- Not visible to recipients
- Example: "Welcome Email - New Photographers"

**Subject Line**
- What recipients see in their inbox
- Can include variables: `Welcome to PikSend, {photographerName}!`
- Keep under 50 characters for mobile
- Be specific and compelling

**Template Type**
- Select **Transactional** or **Marketing**
- Cannot be changed after creation

**Category** (Optional)
- Organize templates by category
- Examples: "Onboarding", "Notifications", "Promotions"

### Step 3: Design Your Email

Use the visual editor to create your email design (see next section).

### Step 4: Save and Publish

- **Save Draft**: Save without making it active
- **Publish**: Make the template available for use

## Using the Visual Editor

### Editor Layout

```
┌─────────────────────────────────────────────────────┐
│  [Save Draft]  [Publish]  [Preview]  [Test Email]  │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Components│         Email Canvas                    │
│          │                                          │
│ • Text   │    [Drag components here]               │
│ • Image  │                                          │
│ • Button │                                          │
│ • Divider│                                          │
│ • Spacer │                                          │
│ • Social │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### Available Components

#### Text Component
- Add headings, paragraphs, and formatted text
- Supports bold, italic, underline
- Customizable font size and color
- Alignment options (left, center, right)

**When to use:**
- Email body content
- Headings and subheadings
- Lists and bullet points

#### Image Component
- Add logos, photos, and graphics
- Upload from computer or use URL
- Set width and height
- Add alt text for accessibility
- Link images to URLs

**When to use:**
- Company logo
- Product images
- Decorative graphics
- Hero images

#### Button Component
- Call-to-action buttons
- Customizable text and link
- Color and style options
- Padding and border radius

**When to use:**
- Primary actions (View Gallery, Download Photos)
- Links to dashboard or website
- Call-to-action elements

#### Divider Component
- Horizontal lines to separate sections
- Customizable color and thickness
- Spacing options

**When to use:**
- Separate content sections
- Visual breaks in content
- Improve readability

#### Spacer Component
- Add vertical spacing
- Customizable height
- Invisible element

**When to use:**
- Add breathing room between sections
- Control layout spacing
- Improve visual hierarchy

#### Social Component
- Social media icons and links
- Pre-configured for common platforms
- Customizable icon style

**When to use:**
- Footer social links
- Encourage social following
- Share buttons

### Editing Components

**To edit a component:**
1. Click on the component in the canvas
2. Edit panel appears on the right
3. Modify properties
4. Changes appear in real-time

**To move a component:**
1. Click and drag the component
2. Drop it in the desired position
3. Blue line shows drop location

**To delete a component:**
1. Click on the component
2. Press Delete key or click trash icon

### Layout Tips

**Email Structure:**
```
┌─────────────────────────┐
│  Logo (Image)           │
├─────────────────────────┤
│  Heading (Text)         │
│  Body Content (Text)    │
│  [Call to Action]       │
│  (Button)               │
├─────────────────────────┤
│  Footer (Text)          │
│  Social Icons (Social)  │
└─────────────────────────┘
```

**Best Practices:**
- Start with logo or header
- Use clear hierarchy (heading → body → CTA)
- Add dividers between major sections
- End with footer and social links
- Keep it simple and scannable

## Template Variables

### What Are Variables?

Variables are placeholders that get replaced with actual data when the email is sent.

**Example:**
```
Hello {recipientName},

Your gallery "{galleryName}" has received a new purchase!
```

**Becomes:**
```
Hello Sarah Johnson,

Your gallery "Summer Wedding 2024" has received a new purchase!
```

### Inserting Variables

**Method 1: Variable Dropdown**
1. Click where you want the variable
2. Click **Insert Variable** button
3. Select variable from dropdown
4. Variable appears as `{variableName}`

**Method 2: Type Manually**
1. Type the variable name in curly braces
2. Example: `{photographerName}`
3. Ensure exact spelling

### Standard Variables

Available in all templates:

| Variable | Description | Example |
|----------|-------------|---------|
| `{appName}` | Application name | PikSend |
| `{appUrl}` | Application URL | https://piksend.com |
| `{supportEmail}` | Support email | support@piksend.com |
| `{recipientEmail}` | Recipient's email | user@example.com |
| `{recipientName}` | Recipient's name | John Doe |
| `{senderName}` | Sender's name | Jane Smith Photography |
| `{senderEmail}` | Sender's email | jane@example.com |
| `{unsubscribeUrl}` | Unsubscribe link | (Marketing only) |

### Template-Specific Variables

Different template types have different variables available.

#### Purchase Confirmation Variables

```
{buyerName}           - Buyer's name
{galleryName}         - Gallery name
{photoCount}          - Number of photos
{amountPaid}          - Amount paid (formatted)
{transactionId}       - Transaction ID
{purchaseDate}        - Purchase date
{accessLink}          - Link to access photos
{photographerName}    - Photographer's name
{photographerEmail}   - Photographer's email
{receiptUrl}          - Link to receipt
```

**Example Usage:**
```
Hi {buyerName},

Thank you for your purchase from {photographerName}!

Gallery: {galleryName}
Photos: {photoCount}
Amount: {amountPaid}

Access your photos: {accessLink}
```

#### Sale Notification Variables

```
{photographerName}    - Photographer's name
{galleryName}         - Gallery name
{photoCount}          - Number of photos sold
{clientEmail}         - Client's email
{clientName}          - Client's name
{grossAmount}         - Gross sale amount
{platformFee}         - Platform fee
{netEarnings}         - Net earnings
{transactionId}       - Transaction ID
{saleDate}            - Sale date
{dashboardLink}       - Link to dashboard
```

#### Payout Notification Variables

```
{photographerName}    - Photographer's name
{payoutId}            - Payout ID
{amount}              - Payout amount
{currency}            - Currency code
{status}              - Payout status
{bankAccountLast4}    - Last 4 digits of account
{createdDate}         - Payout created date
{arrivalDate}         - Expected arrival date
{dashboardLink}       - Link to dashboard
```

### Variable Best Practices

1. **Always Provide Fallbacks**: Handle missing variables gracefully
2. **Test with Real Data**: Use realistic test data
3. **Check Formatting**: Ensure dates and amounts display correctly
4. **Use Descriptive Names**: Make variable purpose clear
5. **Document Variables**: List required variables in template notes

## Design Best Practices

### Mobile-First Design

**Why It Matters:**
- 60%+ of emails are opened on mobile devices
- Small screens require different layouts
- Touch targets need to be larger

**Best Practices:**
- Use single-column layouts
- Font size minimum 14px for body text
- Buttons at least 44px tall
- Avoid small text or links
- Test on actual mobile devices

### Color and Branding

**Color Guidelines:**
- Use your brand colors consistently
- Ensure sufficient contrast (4.5:1 minimum)
- Limit to 2-3 main colors
- Use color to highlight important elements

**Branding Elements:**
- Include logo at top
- Use brand fonts (web-safe alternatives)
- Maintain consistent spacing
- Match website design language

### Typography

**Font Choices:**
- Use web-safe fonts (Arial, Helvetica, Georgia)
- Limit to 2 font families maximum
- Use font sizes hierarchically:
  - Heading: 24-32px
  - Subheading: 18-22px
  - Body: 14-16px
  - Footer: 12-14px

**Formatting:**
- Use bold for emphasis sparingly
- Avoid all caps (harder to read)
- Use proper line height (1.5-1.7)
- Keep paragraphs short (2-3 sentences)

### Layout and Spacing

**Spacing Guidelines:**
- Add padding around all elements
- Use consistent spacing (multiples of 8px)
- Leave breathing room around CTAs
- Don't cram too much content

**Content Width:**
- Maximum 600px wide
- Optimal: 500-550px
- Ensures readability across clients
- Prevents horizontal scrolling

### Call-to-Action (CTA)

**Button Design:**
- Make buttons obvious and clickable
- Use contrasting colors
- Minimum 44px height for touch
- Clear, action-oriented text

**Button Text Examples:**
- ✅ "View Your Photos"
- ✅ "Download Gallery"
- ✅ "See Your Earnings"
- ❌ "Click Here"
- ❌ "Learn More"

**CTA Placement:**
- Above the fold when possible
- Repeat for long emails
- Surround with white space
- Make it the visual focus

### Accessibility

**Alt Text for Images:**
- Describe image content
- Keep under 125 characters
- Don't start with "Image of..."
- Example: "PikSend logo in blue"

**Link Text:**
- Use descriptive link text
- Avoid "click here"
- Example: "View your purchase receipt"

**Color Contrast:**
- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- Test with contrast checker tools

**Structure:**
- Use proper heading hierarchy
- Include plain text version
- Ensure logical reading order

## Testing Templates

### Preview Mode

**Desktop Preview:**
1. Click **Preview** button
2. Enter sample data for variables
3. View full-size email
4. Check layout and formatting

**Mobile Preview:**
1. Click **Preview** button
2. Toggle to **Mobile** view
3. Check responsive behavior
4. Verify touch targets

**Plain Text Preview:**
1. Click **Preview** button
2. Toggle to **Plain Text** view
3. Ensure content is readable
4. Check that links are included

### Sending Test Emails

**Basic Test:**
1. Click **Send Test Email**
2. Enter your email address
3. Fill in sample variable data
4. Click **Send**
5. Check your inbox

**What to Check:**
- Subject line displays correctly
- All variables are replaced
- Images load properly
- Links work correctly
- Layout looks good
- No broken elements

**Test in Multiple Clients:**
- Gmail (web and mobile)
- Outlook (desktop and web)
- Apple Mail (Mac and iOS)
- Yahoo Mail
- Mobile devices (iOS and Android)

### Common Issues and Fixes

**Images Not Loading:**
- Check image URLs are accessible
- Use HTTPS for all images
- Add alt text for accessibility
- Test with images blocked

**Layout Broken:**
- Check for unclosed tags
- Verify table structure
- Test in multiple clients
- Simplify complex layouts

**Variables Not Replacing:**
- Check variable spelling
- Ensure curly braces: `{variable}`
- Verify variable is available
- Test with sample data

**Links Not Working:**
- Verify URLs are complete
- Include https:// protocol
- Test all links before sending
- Check for typos

## Template Versioning

### How Versioning Works

Every time you save changes to a template, a new version is created:

```
Version 1 (Initial)  →  Version 2 (Updated subject)  →  Version 3 (New layout)
```

**Benefits:**
- Track all changes over time
- Revert to previous versions
- Compare different versions
- Audit trail of modifications

### Viewing Version History

1. Open template in editor
2. Click **Version History** button
3. See list of all versions:
   - Version number
   - Created date and time
   - Created by (admin user)
   - Change summary

### Comparing Versions

1. In version history, select two versions
2. Click **Compare**
3. View side-by-side comparison:
   - Green: Added content
   - Red: Removed content
   - Yellow: Modified content

### Reverting to Previous Version

**When to Revert:**
- Recent changes broke the template
- Need to undo multiple edits
- Want to restore working version

**How to Revert:**
1. Open version history
2. Find the version you want
3. Click **Preview** to verify
4. Click **Revert to This Version**
5. Confirm the action

**What Happens:**
- Template content is restored
- Creates a new version (doesn't delete current)
- Active version number increments
- All history is preserved

### Version Best Practices

1. **Save Frequently**: Create checkpoints as you work
2. **Test Before Publishing**: Always test new versions
3. **Document Changes**: Add notes about what changed
4. **Review History**: Periodically review version history
5. **Clean Up**: Archive old, unused versions

## Advanced Features

### Conditional Content

Show different content based on conditions:

**Example:**
```
{if purchaseAmount > 100}
  Thank you for your large purchase!
{else}
  Thank you for your purchase!
{endif}
```

**Use Cases:**
- Different messages for different purchase amounts
- Personalized content based on user type
- Seasonal or time-based content

### Dynamic Content Blocks

Repeat content for multiple items:

**Example:**
```
{foreach photo in photos}
  <img src="{photo.url}" alt="{photo.title}" />
{endforeach}
```

**Use Cases:**
- List of purchased photos
- Multiple gallery links
- Product recommendations

### Personalization Rules

Create rules for advanced personalization:

**Examples:**
- Show different CTAs based on user segment
- Adjust content based on previous purchases
- Localize content based on location

### A/B Testing

Test different versions to optimize performance:

**What to Test:**
- Subject lines
- CTA button text and color
- Email layout
- Image vs. no image
- Content length

**How to A/B Test:**
1. Create two versions of template
2. Send to split audience (50/50)
3. Track open and click rates
4. Use winning version

### Integration with Workflows

Connect templates to automated workflows:

**Examples:**
- Welcome series (3 emails over 7 days)
- Abandoned cart reminders
- Re-engagement campaigns
- Post-purchase follow-ups

## Template Library

### Pre-Built Templates

PikSend includes pre-built templates for common scenarios:

**Transactional:**
- Purchase Confirmation
- Sale Notification
- Payout Notification
- Dispute Alert
- Refund Confirmation
- Password Reset
- Email Verification

**Marketing:**
- Newsletter
- Product Announcement
- Special Offer
- Event Invitation
- Survey Request

### Customizing Pre-Built Templates

1. Find template in library
2. Click **Duplicate**
3. Rename the duplicate
4. Customize content and design
5. Save and publish

### Sharing Templates

Share templates with team members:

1. Export template as JSON
2. Share file with team
3. Team member imports template
4. Template appears in their library

## Checklist: Before Publishing

Use this checklist before publishing any template:

### Content
- [ ] Subject line is compelling and under 50 characters
- [ ] All required variables are included
- [ ] Content is clear and concise
- [ ] Grammar and spelling are correct
- [ ] Links are correct and working
- [ ] Unsubscribe link included (marketing emails)

### Design
- [ ] Logo is visible and properly sized
- [ ] Brand colors are used consistently
- [ ] Layout is clean and organized
- [ ] CTA button is prominent
- [ ] Images have alt text
- [ ] Mobile-responsive design

### Testing
- [ ] Previewed on desktop
- [ ] Previewed on mobile
- [ ] Sent test email to yourself
- [ ] Tested in Gmail
- [ ] Tested in Outlook
- [ ] All variables replaced correctly
- [ ] All links work
- [ ] Images load properly

### Compliance
- [ ] Sender address is verified
- [ ] Physical address included (marketing)
- [ ] Unsubscribe link works (marketing)
- [ ] Privacy policy linked
- [ ] CAN-SPAM compliant

## Resources

### Tools
- [Litmus](https://litmus.com) - Email testing across clients
- [Email on Acid](https://www.emailonacid.com) - Email testing
- [Can I Email](https://www.caniemail.com) - CSS support reference
- [Really Good Emails](https://reallygoodemails.com) - Design inspiration

### Further Reading
- [Email Design Best Practices](https://www.campaignmonitor.com/resources/guides/email-design/)
- [Mobile Email Design](https://www.litmus.com/blog/mobile-email-design-best-practices/)
- [Email Accessibility](https://www.litmus.com/blog/ultimate-guide-accessible-emails/)

## Support

Need help with templates?

- **Documentation**: Check the Email Management User Guide
- **Support**: Email support@piksend.com
- **Community**: Join our community forum
- **Training**: Request a template design workshop
