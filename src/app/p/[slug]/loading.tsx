/**
 * Loading state for public profile page
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Skeleton */}
      <div className="relative h-64 md:h-96 bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse" />
      
      {/* Profile Header Skeleton */}
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
          {/* Avatar Skeleton */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background bg-muted animate-pulse" />
          
          {/* Name and Tagline Skeleton */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="h-8 bg-muted rounded w-64 mx-auto md:mx-0 animate-pulse" />
            <div className="h-6 bg-muted rounded w-48 mx-auto md:mx-0 animate-pulse" />
            <div className="h-4 bg-muted rounded w-32 mx-auto md:mx-0 animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Main Content Skeleton */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio Skeleton */}
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              </div>
            </div>
            
            {/* Galleries Skeleton */}
            <div>
              <div className="h-6 bg-muted rounded w-32 mb-6 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card rounded-lg overflow-hidden shadow-sm">
                    <div className="aspect-video bg-muted animate-pulse" />
                    <div className="p-4 space-y-2">
                      <div className="h-5 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            {/* Contact Skeleton */}
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="h-6 bg-muted rounded w-24 mb-4 animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded flex-1 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Social Links Skeleton */}
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse" />
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
