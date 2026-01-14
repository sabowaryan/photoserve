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

## Usage

Navigate to `/dashboard/gallery/[id]/analytics` to view analytics for a specific gallery.

An "Analytics" button has been added to the GalleryHero component for easy access.

## Requirements

Implements:
- Requirement 3.3.3: Track visitor country via IP geolocation
- Requirement 3.3.4: Display analytics per gallery in dashboard
