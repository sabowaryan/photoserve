# Gallery Analytics Dashboard

This directory contains the analytics dashboard for individual galleries.

## Files

### `page.tsx`
Server component that:
- Authenticates the user
- Fetches gallery data
- Verifies gallery ownership
- Renders the AnalyticsClient component

### `analytics-client.tsx`
Client component that:
- Fetches analytics data from the API
- Displays loading and error states
- Renders key metrics and visualizations
- Provides navigation back to gallery
- Displays Phase 3 event tracking data

### Components

#### `components/stats-card.tsx`
Displays a single metric with:
- Icon
- Title
- Value
- Description

#### `components/views-chart.tsx`
Line chart showing:
- Views over the last 30 days
- Uses recharts library
- Responsive design

#### `components/country-map.tsx`
Bar chart showing:
- Top 10 countries by views
- Country name mapping
- Horizontal bar layout

#### `components/downloads-chart.tsx` (Phase 3)
Bar chart showing:
- Downloads by type (single, all, selection, favorites)
- Color-coded bars
- Horizontal layout

#### `components/top-images.tsx` (Phase 3)
List showing:
- Top 5 most viewed images
- Thumbnail preview
- View count with progress bar

#### `components/engagement-stats.tsx` (Phase 3)
Grid showing:
- Average session duration
- Actions per session
- Slideshow statistics
- CTA clicks

#### `components/events-breakdown.tsx` (Phase 3)
Pie chart showing:
- Distribution of event types
- Excludes session events for clarity
- Interactive legend

## Tabs

The dashboard is organized into 4 tabs:

1. **Vue d'ensemble** (Overview)
   - Views over time chart
   - Top images
   - Events breakdown
   - Secondary metrics (favorites, comments, slideshows)

2. **Engagement**
   - Session metrics
   - Favorites activity
   - Interaction statistics

3. **Téléchargements** (Downloads)
   - Downloads by type chart
   - Download rate
   - Detailed stats cards

4. **Géographie** (Geography)
   - Country distribution chart
   - Detailed country list

## Usage

Navigate to `/dashboard/gallery/[id]/analytics` to view analytics for a specific gallery.

An "Analytics" button has been added to the GalleryHero component for easy access.

## Requirements

Implements:
- Requirement 3.3.3: Track visitor country via IP geolocation
- Requirement 3.3.4: Display analytics per gallery in dashboard
- Phase 1: IP Geolocation
- Phase 2: Fingerprinting for unique visitors
- Phase 3: Event tracking (downloads, favorites, slideshows, sessions)

## Data Sources

- **gallery_analytics** table: Views, visitors, geography
- **gallery_events** table: User interactions (Phase 3)
- **favorites** table: Favorite counts
- **comments** table: Comment counts

