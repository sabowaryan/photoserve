# Requirements Document

## Introduction

Ce document définit les exigences pour l'ensemble des fonctionnalités avancées de PikSend, organisées en 6 piliers principaux plus des fonctionnalités exclusives. L'objectif est de transformer PikSend en une plateforme complète de livraison de photos pour photographes professionnels, avec des fonctionnalités de collaboration, monétisation, personnalisation et intelligence artificielle.

Toutes les fonctionnalités sont liées aux plans d'abonnement (Free, Premium, Pro) ou au paiement one-time.

## Glossary

- **Masonry_Grid**: Grille d'affichage responsive avec disposition en colonnes de hauteurs variables
- **Lightbox**: Visionneuse plein écran avec navigation clavier et swipe
- **Blur_Up**: Technique de chargement progressif avec placeholder flou (LQIP)
- **Slideshow**: Mode diaporama automatique avec transitions
- **EXIF_Data**: Métadonnées embarquées dans les fichiers image (date, appareil, etc.)
- **Watermark**: Filigrane dynamique (logo/texte) sur les images
- **Bulk_Download**: Téléchargement ZIP de toutes les images
- **Paywall**: Système de paiement pour débloquer le téléchargement
- **White_Label**: Personnalisation complète de la marque (logo, couleurs)
- **CDN**: Content Delivery Network pour servir les images depuis le serveur le plus proche
- **Proofing**: Processus de sélection des photos par le client
- **Favorites_System**: Système de sélection de photos préférées par le client
- **Comments_System**: Système de commentaires sur les images
- **QR_Code**: Code QR généré pour chaque galerie
- **Lead_Magnet**: Capture d'email avant accès à la galerie
- **CTA_Button**: Bouton d'appel à l'action personnalisable
- **Face_Recognition**: Reconnaissance faciale pour tri automatique
- **Smart_Culling**: Tri intelligent IA (flou, yeux fermés, doublons)
- **Auto_Caption**: Génération automatique de descriptions par IA
- **PWA**: Progressive Web App installable sur mobile
- **Deadline_Timer**: Compte à rebours visuel pour sélection des photos
- **Video_Cover**: Vidéo courte en fond d'écran de galerie
- **Audio_Gallery**: Musique d'ambiance pour la galerie
- **Testimonial_Collector**: Pop-up de collecte d'avis client

## Requirements

---

### Pilier 1: Expérience Galerie (Frontend Client)

### Requirement 1.1: Galerie Immersive Responsive

**User Story:** As a gallery visitor, I want to view photos in an optimized responsive grid, so that I have a beautiful experience on any device.

#### Acceptance Criteria

1. THE Masonry_Grid SHALL adapt automatically to screen size (2 cols mobile, 3-5 cols desktop)
2. WHEN images load, THE System SHALL use Blur_Up technique with low-res placeholder
3. THE System SHALL prioritize above-the-fold images for LCP optimization
4. WHEN hovering an image, THE System SHALL display smooth zoom and action buttons
5. THE Grid SHALL support infinite scroll or pagination based on gallery size

### Requirement 1.2: Visionneuse Plein Écran (Lightbox)

**User Story:** As a gallery visitor, I want to view photos in fullscreen with smooth navigation, so that I can appreciate each photo in detail.

#### Acceptance Criteria

1. WHEN clicking an image, THE Lightbox SHALL open with smooth animation
2. THE Lightbox SHALL support keyboard navigation (arrows, Escape)
3. THE Lightbox SHALL support swipe gestures on mobile devices
4. WHEN in Lightbox, THE System SHALL preload adjacent images for smooth navigation
5. THE Lightbox SHALL display image index (e.g., "12/45") and download button

### Requirement 1.3: Mode Sombre/Clair Automatique

**User Story:** As a gallery visitor, I want the interface to adapt to my system preferences, so that I have optimal visual comfort.

#### Acceptance Criteria

1. THE System SHALL detect system color scheme preference via `prefers-color-scheme`
2. WHEN system preference is dark, THE Gallery_View SHALL use dark theme
3. THE User SHALL be able to manually toggle theme via a switch
4. THE Theme_Preference SHALL be persisted in localStorage
5. THE Theme_Switch SHALL be accessible from gallery header

### Requirement 1.4: Diaporama (Slideshow)

**User Story:** As a gallery visitor, I want to watch photos in automatic slideshow mode, so that I can enjoy a cinema-like presentation.

#### Acceptance Criteria

1. THE Gallery_Header SHALL include a "Slideshow" button
2. WHEN Slideshow is activated, THE System SHALL display photos fullscreen with auto-advance
3. THE Slideshow SHALL have configurable interval (3s, 5s, 10s)
4. THE Slideshow SHALL support pause/play controls
5. THE Slideshow SHALL loop back to first image after last
6. WHERE plan is Premium or Pro, THE Slideshow SHALL be available

---

### Pilier 2: Workflow Pro (Dashboard Photographe)

### Requirement 2.1: Upload par Drag & Drop Avancé

**User Story:** As a photographer, I want to drag entire folders into the browser, so that I can upload quickly without selecting files one by one.

#### Acceptance Criteria

1. THE Upload_Zone SHALL accept folder drops (webkitdirectory support)
2. WHEN dropping a folder, THE System SHALL recursively find all image files
3. THE Upload_Queue SHALL display progress for each file with thumbnail preview
4. THE System SHALL support parallel uploads (max 3 concurrent)
5. IF an upload fails, THEN THE System SHALL retry automatically up to 3 times

### Requirement 2.2: Gestion des Galeries

**User Story:** As a photographer, I want to manage my galleries efficiently, so that I can organize my work quickly.

#### Acceptance Criteria

1. THE Dashboard SHALL allow creating new galleries with one click
2. THE System SHALL allow renaming galleries inline
3. THE System SHALL allow duplicating galleries with all settings
4. WHEN deleting a gallery, THE System SHALL ask for confirmation
5. THE Gallery_List SHALL support search and filtering

### Requirement 2.3: Tri Intelligent des Images

**User Story:** As a photographer, I want to sort images by different criteria, so that I can organize my galleries efficiently.

#### Acceptance Criteria

1. THE System SHALL support sorting by filename (A-Z, Z-A)
2. THE System SHALL support sorting by date taken (from EXIF_Data)
3. THE System SHALL support sorting by file size
4. THE System SHALL support manual drag-and-drop reordering
5. THE Sort_Preference SHALL be persisted per gallery

### Requirement 2.4: Expiration Automatique

**User Story:** As a photographer, I want galleries to auto-expire, so that I can save storage and maintain privacy.

#### Acceptance Criteria

1. THE System SHALL allow setting expiration (7j, 30j, 90j, 1an) based on plan
2. WHEN a gallery expires, THE System SHALL mark it as inactive
3. THE System SHALL send email notification 3 days before expiration
4. WHERE plan is Free, THE max_expiration_days SHALL be 7
5. WHERE plan is Pro, THE max_expiration_days SHALL be 365

### Requirement 2.5: Protection par Mot de Passe

**User Story:** As a photographer, I want to protect galleries with passwords, so that only authorized clients can access them.

#### Acceptance Criteria

1. THE System SHALL require password for each gallery
2. WHEN accessing a protected gallery, THE System SHALL display password form
3. THE Password SHALL be hashed using bcrypt before storage
4. THE System SHALL implement rate limiting (5 attempts per 15 minutes)
5. WHEN password is correct, THE System SHALL set session cookie for 24h

---

### Pilier 3: Engagement & Feedback

### Requirement 3.1: Système de Favoris

**User Story:** As a client, I want to mark my favorite photos, so that the photographer knows which ones I prefer.

#### Acceptance Criteria

1. THE Gallery_View SHALL display a heart icon on each image
2. WHEN clicking the heart, THE System SHALL toggle favorite status
3. THE Favorites_Count SHALL be displayed in gallery header
4. THE Photographer SHALL receive email with favorites list
5. WHERE plan is Premium or Pro, THE Favorites_System SHALL be available

### Requirement 3.2: Commentaires sur Image

**User Story:** As a client, I want to leave comments on specific photos, so that I can request retouches or give feedback.

#### Acceptance Criteria

1. THE Lightbox SHALL include a comment input field
2. WHEN submitting a comment, THE System SHALL save it with image reference
3. THE Photographer SHALL receive email notification for new comments
4. THE Comments_List SHALL be visible in photographer dashboard
5. WHERE plan is Premium or Pro, THE Comments_System SHALL be available

### Requirement 3.3: Statistiques de Visite

**User Story:** As a photographer, I want to see gallery analytics, so that I know when clients view my work.

#### Acceptance Criteria

1. THE System SHALL track gallery view count
2. THE System SHALL track first view timestamp
3. THE System SHALL track visitor country (via IP geolocation)
4. THE Dashboard SHALL display analytics per gallery
5. WHERE plan is Pro, THE detailed_analytics SHALL be available

### Requirement 3.4: Bouton Call-to-Action Personnalisé

**User Story:** As a photographer, I want to add a custom CTA button, so that I can drive clients to book or review.

#### Acceptance Criteria

1. THE Gallery_Settings SHALL allow adding CTA_Button
2. THE CTA_Button SHALL have customizable text and URL
3. THE CTA_Button SHALL appear at the end of gallery
4. THE System SHALL track CTA click count
5. WHERE plan is Pro, THE CTA_Button SHALL be available

---

### Pilier 4: Monétisation & Sécurité

### Requirement 4.1: Filigrane Dynamique (Watermark)

**User Story:** As a photographer, I want watermarks on thumbnails, so that I can prevent unauthorized use.

#### Acceptance Criteria

1. THE System SHALL overlay Watermark on gallery thumbnails
2. THE Watermark SHALL display photographer logo or text
3. THE Watermark SHALL be positioned in corner with configurable opacity
4. THE Watermark SHALL NOT appear on downloaded HD images (after payment)
5. WHERE plan is Free, THE PikSend_Watermark SHALL be displayed

### Requirement 4.2: Téléchargement ZIP (Bulk Download)

**User Story:** As a client, I want to download all photos at once, so that I don't have to download them one by one.

#### Acceptance Criteria

1. THE Gallery_Header SHALL include "Download All" button
2. WHEN clicking download, THE System SHALL generate ZIP file
3. THE ZIP SHALL contain original quality images
4. THE System SHALL show download progress
5. WHERE plan is Premium or Pro, THE Bulk_Download SHALL be available

### Requirement 4.3: Limitation de Qualité

**User Story:** As a photographer, I want to show low-res previews, so that clients must pay for HD.

#### Acceptance Criteria

1. THE System SHALL display thumbnails in reduced resolution
2. THE HD_Download SHALL be locked until payment or unlock
3. WHEN gallery is unlocked, THE System SHALL serve original files
4. THE Preview_Quality SHALL be configurable (50%, 25%, 10%)
5. WHERE plan is Free, THE HD_Download SHALL require payment

### Requirement 4.4: Paywall (Vente de Galerie)

**User Story:** As a photographer, I want to sell gallery access, so that I can monetize my work.

#### Acceptance Criteria

1. THE System SHALL integrate Stripe for payments
2. THE Photographer SHALL set gallery price
3. WHEN client pays, THE System SHALL unlock HD downloads
4. THE System SHALL handle payment webhooks for status updates
5. IF Stripe is disabled by admin, THEN THE System SHALL display message
6. WHERE plan is Pro, THE Paywall SHALL be available

---

### Pilier 5: Branding & Personnalisation

### Requirement 5.1: White-Label (Custom Logo)

**User Story:** As a photographer, I want to replace PikSend logo, so that my brand is front and center.

#### Acceptance Criteria

1. THE Settings SHALL allow uploading custom logo
2. THE Custom_Logo SHALL replace PikSend logo in gallery view
3. THE Custom_Logo SHALL appear in lightbox header
4. THE Custom_Logo SHALL be resized to fit (max 200px width)
5. WHERE plan is Pro, THE White_Label SHALL be available

### Requirement 5.2: Domaine Personnalisé

**User Story:** As a photographer, I want to use my own domain, so that clients see my brand URL.

#### Acceptance Criteria

1. THE Settings SHALL allow configuring custom domain
2. THE System SHALL verify domain ownership via DNS
3. THE System SHALL provision SSL certificate automatically
4. THE Custom_Domain SHALL redirect to gallery
5. WHERE plan is Pro, THE Custom_Domain SHALL be available

### Requirement 5.3: Couleurs de Marque

**User Story:** As a photographer, I want to customize gallery colors, so that it matches my brand.

#### Acceptance Criteria

1. THE Settings SHALL allow setting primary accent color
2. THE Settings SHALL allow setting button colors
3. THE Gallery_View SHALL apply custom colors to UI elements
4. THE Color_Picker SHALL support hex and preset colors
5. WHERE plan is Pro, THE Brand_Colors SHALL be available

### Requirement 5.4: Page de Profil Pro

**User Story:** As a photographer, I want a public profile page, so that clients can see all my galleries.

#### Acceptance Criteria

1. THE System SHALL generate public profile URL (/p/username)
2. THE Profile_Page SHALL display photographer info and logo
3. THE Profile_Page SHALL list all active public galleries
4. THE Profile_Page SHALL be SEO optimized
5. WHERE plan is Pro, THE Profile_Page SHALL be available

---

### Pilier 6: Technique & Performance

### Requirement 6.1: Zero Compression Engine

**User Story:** As a photographer, I want original quality delivery, so that my work is not degraded.

#### Acceptance Criteria

1. THE System SHALL store original files without compression
2. THE Download SHALL deliver bit-for-bit original file
3. THE System SHALL verify file integrity via checksum
4. THE Upload SHALL preserve EXIF_Data
5. THE System SHALL support RAW and TIFF formats for Pro plan

### Requirement 6.2: Edge Delivery (CDN)

**User Story:** As a photographer, I want fast global delivery, so that clients worldwide have good experience.

#### Acceptance Criteria

1. THE System SHALL serve images via Cloudinary CDN
2. THE CDN SHALL cache images at edge locations
3. THE System SHALL use responsive image srcset
4. THE System SHALL implement lazy loading for below-fold images
5. THE CDN SHALL support WebP format with fallback

### Requirement 6.3: SEO Opt-Out

**User Story:** As a photographer, I want to prevent gallery indexing, so that private galleries stay private.

#### Acceptance Criteria

1. THE Gallery_Settings SHALL include "noindex" toggle
2. WHEN noindex is enabled, THE System SHALL add robots meta tag
3. THE System SHALL add X-Robots-Tag header
4. THE Sitemap SHALL exclude private galleries
5. THE Default SHALL be noindex for all galleries

### Requirement 6.4: Support Multi-Langues

**User Story:** As a client, I want the interface in my language, so that I can navigate easily.

#### Acceptance Criteria

1. THE System SHALL detect browser language preference
2. THE System SHALL support French and English (minimum)
3. THE User SHALL be able to switch language manually
4. THE Language_Preference SHALL be persisted
5. THE System SHALL support RTL languages (Arabic, Hebrew)

---

### Pilier 7: Anti-Ghosting (Exclusivité)

### Requirement 7.1: Proofing Deadline Timer

**User Story:** As a photographer, I want a countdown timer, so that clients are motivated to select photos quickly.

#### Acceptance Criteria

1. THE Gallery_Header SHALL display countdown timer
2. THE Timer SHALL show days/hours remaining for selection
3. THE Photographer SHALL set deadline in gallery settings
4. WHEN deadline passes, THE System SHALL notify photographer
5. WHERE plan is Premium or Pro, THE Deadline_Timer SHALL be available

### Requirement 7.2: Lead Magnet (Email Gate)

**User Story:** As a photographer, I want to capture visitor emails, so that I can build my client database.

#### Acceptance Criteria

1. THE System SHALL display email form before gallery access
2. THE Email SHALL be validated and stored
3. THE Photographer SHALL receive list of captured emails
4. THE System SHALL comply with GDPR (consent checkbox)
5. WHERE plan is Pro, THE Lead_Magnet SHALL be available

### Requirement 7.3: QR Code Generator

**User Story:** As a photographer, I want QR codes for galleries, so that I can share them at events.

#### Acceptance Criteria

1. THE Dashboard SHALL generate QR_Code for each gallery
2. THE QR_Code SHALL link to gallery URL
3. THE QR_Code SHALL be downloadable as PNG/SVG
4. THE QR_Code SHALL include optional logo overlay
5. THE QR_Code SHALL be available for all plans

---

### Pilier 8: Preuve Sociale

### Requirement 8.1: Video Cover

**User Story:** As a photographer, I want a video background, so that my gallery feels immersive.

#### Acceptance Criteria

1. THE Gallery_Settings SHALL allow uploading Video_Cover
2. THE Video_Cover SHALL play automatically (muted) on gallery load
3. THE Video_Cover SHALL loop seamlessly
4. THE Video_Cover SHALL be max 30 seconds, 1080p
5. WHERE plan is Pro, THE Video_Cover SHALL be available

### Requirement 8.2: Audio Gallery

**User Story:** As a photographer, I want background music, so that clients have emotional experience.

#### Acceptance Criteria

1. THE Gallery_Settings SHALL allow uploading audio file
2. THE Audio SHALL play automatically on gallery load (with user consent)
3. THE Audio SHALL have volume control and mute button
4. THE Audio SHALL loop during gallery viewing
5. WHERE plan is Pro, THE Audio_Gallery SHALL be available

### Requirement 8.3: Testimonial Collector

**User Story:** As a photographer, I want to collect reviews, so that I can build social proof.

#### Acceptance Criteria

1. THE System SHALL display review popup after download
2. THE Popup SHALL ask for rating (1-5 stars) and comment
3. THE Testimonials SHALL be stored and visible in dashboard
4. THE Photographer SHALL be able to display testimonials on profile
5. WHERE plan is Premium or Pro, THE Testimonial_Collector SHALL be available

---

### Pilier 9: Connectivité & Écosystème

### Requirement 9.1: Adobe Lightroom Plugin

**User Story:** As a photographer, I want to export from Lightroom, so that I don't leave my workflow.

#### Acceptance Criteria

1. THE Plugin SHALL authenticate with PikSend account
2. THE Plugin SHALL allow selecting/creating gallery
3. THE Plugin SHALL upload selected photos directly
4. THE Plugin SHALL show upload progress
5. WHERE plan is Pro, THE Lightroom_Plugin SHALL be available

### Requirement 9.2: Mobile App (PWA)

**User Story:** As a photographer, I want a mobile app, so that I can manage galleries on the go.

#### Acceptance Criteria

1. THE System SHALL be installable as PWA
2. THE PWA SHALL work offline for viewing galleries
3. THE PWA SHALL support push notifications
4. THE PWA SHALL have app-like navigation
5. THE PWA SHALL be available for all plans

---

### Pilier 10: IA & Automatisation

### Requirement 10.1: Face Recognition (Tri par Visage)

**User Story:** As an event guest, I want to find my photos, so that I don't scroll through hundreds of images.

#### Acceptance Criteria

1. THE System SHALL detect faces in uploaded images
2. THE Guest SHALL upload selfie to find matching photos
3. THE System SHALL return photos containing matching face
4. THE Face_Data SHALL be processed securely and deleted after
5. WHERE plan is Pro, THE Face_Recognition SHALL be available

### Requirement 10.2: Auto-Captioning / Alt-Text IA

**User Story:** As a photographer, I want automatic descriptions, so that my galleries are accessible.

#### Acceptance Criteria

1. THE System SHALL generate alt-text for each image via AI
2. THE Alt_Text SHALL describe image content accurately
3. THE Photographer SHALL be able to edit generated text
4. THE Alt_Text SHALL improve SEO and accessibility
5. WHERE plan is Premium or Pro, THE Auto_Caption SHALL be available

### Requirement 10.3: Smart Culling (Tri Intelligent)

**User Story:** As a photographer, I want AI to detect bad photos, so that I can hide them before sending.

#### Acceptance Criteria

1. THE System SHALL detect blurry images
2. THE System SHALL detect closed eyes
3. THE System SHALL detect duplicate/similar images
4. THE System SHALL suggest hiding flagged images
5. WHERE plan is Pro, THE Smart_Culling SHALL be available

---

## Plan Feature Matrix

| Feature | Free | Premium | Pro |
|---------|------|---------|-----|
| Masonry Grid | ✓ | ✓ | ✓ |
| Lightbox | ✓ | ✓ | ✓ |
| Dark/Light Mode | ✓ | ✓ | ✓ |
| Slideshow | ✗ | ✓ | ✓ |
| Folder Upload | ✓ | ✓ | ✓ |
| Gallery Management | ✓ | ✓ | ✓ |
| Smart Sort | ✓ | ✓ | ✓ |
| Expiration (max days) | 7 | 90 | 365 |
| Password Protection | ✓ | ✓ | ✓ |
| Favorites System | ✗ | ✓ | ✓ |
| Comments | ✗ | ✓ | ✓ |
| Analytics | Basic | Basic | Detailed |
| CTA Button | ✗ | ✗ | ✓ |
| Watermark | PikSend | Custom | Custom |
| Bulk Download ZIP | ✗ | ✓ | ✓ |
| HD Quality Lock | ✓ | ✓ | ✓ |
| Paywall/Stripe | ✗ | ✗ | ✓ |
| White Label | ✗ | ✗ | ✓ |
| Custom Domain | ✗ | ✗ | ✓ |
| Brand Colors | ✗ | ✗ | ✓ |
| Profile Page | ✗ | ✗ | ✓ |
| Zero Compression | ✓ | ✓ | ✓ |
| CDN Delivery | ✓ | ✓ | ✓ |
| SEO Opt-Out | ✓ | ✓ | ✓ |
| Multi-Language | ✓ | ✓ | ✓ |
| Deadline Timer | ✗ | ✓ | ✓ |
| Lead Magnet | ✗ | ✗ | ✓ |
| QR Code | ✓ | ✓ | ✓ |
| Video Cover | ✗ | ✗ | ✓ |
| Audio Gallery | ✗ | ✗ | ✓ |
| Testimonial Collector | ✗ | ✓ | ✓ |
| Lightroom Plugin | ✗ | ✗ | ✓ |
| PWA | ✓ | ✓ | ✓ |
| Face Recognition | ✗ | ✗ | ✓ |
| Auto-Caption AI | ✗ | ✓ | ✓ |
| Smart Culling AI | ✗ | ✗ | ✓ |

---

## Admin Controls

### Requirement A.1: Stripe Toggle

**User Story:** As an admin, I want to enable/disable Stripe payments, so that I can control monetization features.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL include Stripe toggle
2. WHEN Stripe is disabled, THE Paywall features SHALL be hidden
3. WHEN Stripe is disabled, THE System SHALL display "Payments temporarily unavailable" message
4. THE Toggle_State SHALL be persisted in database
5. THE Change SHALL take effect immediately without restart
