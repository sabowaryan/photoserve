/**
 * Plugin Version Service
 * Handles plugin version management, downloads, and distribution for the Lightroom plugin
 * 
 * Features:
 * - Semantic version comparison and ordering
 * - Plugin file distribution via Cloudinary CDN
 * - Download tracking and statistics
 * - Version stability management (stable vs beta/alpha)
 * - Caching for optimal performance
 * - Circuit breaker for graceful degradation
 * 
 * Requirements: 14.8 - Graceful degradation for external service failures
 */
import { createAdminClient } from '@/lib/supabase/server';
import { getCacheService } from '@/lib/services/cache.service';
import { z } from 'zod';

/**
 * Plugin version record from database
 */
export interface PluginVersion {
  id: string;
  version: string;  // Semantic version: "1.0.0"
  fileUrl: string;  // Cloudinary URL
  fileSize: number;
  changelog: string;
  isStable: boolean;
  minLightroomVersion: string;
  releaseDate: string;
  downloadCount: number;
  createdAt: string;
}

/**
 * Parameters for creating a new plugin version
 */
export interface CreateVersionParams {
  version: string;
  fileUrl: string;
  fileSize: number;
  changelog: string;
  isStable?: boolean;
  minLightroomVersion?: string;
}

/**
 * Metadata captured during plugin download
 */
export interface DownloadMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Download statistics for a plugin version
 */
export interface DownloadStats {
  versionId: string;
  totalDownloads: number;
  authenticatedDownloads: number;
  unauthenticatedDownloads: number;
  downloadsByDate: Record<string, number>;
}

/**
 * Service interface for plugin version operations
 */
export interface IPluginVersionService {
  createVersion(params: CreateVersionParams): Promise<PluginVersion>;
  getLatestStableVersion(): Promise<PluginVersion | null>;
  getAllVersions(includeUnstable?: boolean): Promise<PluginVersion[]>;
  getVersionById(id: string): Promise<PluginVersion | null>;
  updateVersion(id: string, updates: Partial<PluginVersion>): Promise<PluginVersion>;
  recordDownload(versionId: string, userId: string | null, metadata: DownloadMetadata): Promise<void>;
  getDownloadStats(versionId: string): Promise<DownloadStats>;
}

/**
 * Zod schema for semantic version validation
 * Supports: major.minor.patch and major.minor.patch-prerelease
 * Examples: "1.0.0", "2.1.3", "1.0.0-beta", "2.0.0-alpha"
 */
export const semanticVersionSchema = z.string()
  .regex(
    /^\d+\.\d+\.\d+(-[a-z]+)?$/,
    'Version must follow semantic versioning (e.g., "1.0.0" or "1.0.0-beta")'
  );

/**
 * Zod schema for creating a plugin version
 */
export const createVersionSchema = z.object({
  version: semanticVersionSchema,
  fileUrl: z.string().url('File URL must be a valid URL'),
  fileSize: z.number().positive('File size must be positive'),
  changelog: z.string().min(1, 'Changelog is required'),
  isStable: z.boolean().optional().default(false),
  minLightroomVersion: z.string()
    .regex(/^\d+\.\d+$/, 'Lightroom version must be in format "X.Y" (e.g., "11.0")')
    .optional()
    .default('11.0'),
});

/**
 * Type for validated create version params
 */
export type ValidatedCreateVersionParams = z.infer<typeof createVersionSchema>;

/**
 * Parsed semantic version components
 */
interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}

/**
 * Plugin Version Service Implementation
 */
export class PluginVersionService implements IPluginVersionService {
  private static readonly CACHE_KEY_LATEST_STABLE = 'plugin:version:latest-stable';
  private static readonly CACHE_TTL_SECONDS = 5 * 60; // 5 minutes
  
  private cacheService = getCacheService();
  
  /**
   * Parse a semantic version string into its components
   * 
   * @param version - Semantic version string (e.g., "1.0.0" or "1.0.0-beta")
   * @returns Parsed version components
   */
  private parseVersion(version: string): ParsedVersion {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-z]+))?$/);
    
    if (!match) {
      throw new Error(`Invalid semantic version format: ${version}`);
    }
    
    return {
      major: parseInt(match[1]!, 10),
      minor: parseInt(match[2]!, 10),
      patch: parseInt(match[3]!, 10),
      prerelease: match[4] || null,
    };
  }

  /**
   * Compare two semantic version strings
   * 
   * @param v1 - First version string
   * @param v2 - Second version string
   * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parsed1 = this.parseVersion(v1);
    const parsed2 = this.parseVersion(v2);
    
    // Compare major version
    if (parsed1.major !== parsed2.major) {
      return parsed1.major > parsed2.major ? 1 : -1;
    }
    
    // Compare minor version
    if (parsed1.minor !== parsed2.minor) {
      return parsed1.minor > parsed2.minor ? 1 : -1;
    }
    
    // Compare patch version
    if (parsed1.patch !== parsed2.patch) {
      return parsed1.patch > parsed2.patch ? 1 : -1;
    }
    
    // Handle pre-release tags
    // Stable versions (no prerelease) are greater than prerelease versions
    if (parsed1.prerelease === null && parsed2.prerelease !== null) {
      return 1;  // v1 is stable, v2 is prerelease -> v1 > v2
    }
    if (parsed1.prerelease !== null && parsed2.prerelease === null) {
      return -1;  // v1 is prerelease, v2 is stable -> v1 < v2
    }
    
    // Both have prerelease tags or both are stable
    if (parsed1.prerelease !== null && parsed2.prerelease !== null) {
      // Compare prerelease tags alphabetically
      // alpha < beta < rc (release candidate)
      if (parsed1.prerelease < parsed2.prerelease) {
        return -1;
      }
      if (parsed1.prerelease > parsed2.prerelease) {
        return 1;
      }
    }
    
    // Versions are equal
    return 0;
  }

  /**
   * Sort an array of version strings in descending order (newest first)
   * 
   * @param versions - Array of version strings
   * @returns Sorted array with newest versions first
   */
  private sortVersionsDescending(versions: string[]): string[] {
    return versions.sort((a, b) => this.compareVersions(b, a));
  }
  
  async createVersion(params: CreateVersionParams): Promise<PluginVersion> {
    // Validate input
    const validatedParams = createVersionSchema.parse(params);
    
    const supabase = createAdminClient();
    
    // Note: Admin permission validation should be done at the API route level
    // This service method assumes the caller has already verified admin permissions
    
    // Insert record into plugin_versions table
    const { data: versionRecord, error: insertError } = await supabase
      .from('plugin_versions')
      .insert({
        version: validatedParams.version,
        file_url: validatedParams.fileUrl,
        file_size: validatedParams.fileSize,
        changelog: validatedParams.changelog,
        is_stable: validatedParams.isStable ?? false,
        min_lightroom_version: validatedParams.minLightroomVersion ?? '11.0',
        release_date: new Date().toISOString(),
        download_count: 0,
      })
      .select()
      .single();
    
    if (insertError || !versionRecord) {
      console.error('[PluginVersionService] Failed to create version:', insertError);
      
      // Check for unique constraint violation
      if (insertError?.code === '23505') {
        throw new Error(`Version ${validatedParams.version} already exists`);
      }
      
      throw new Error('Failed to create plugin version');
    }
    
    // Invalidate cache if this is a stable version
    if (validatedParams.isStable) {
      await this.cacheService.delete(PluginVersionService.CACHE_KEY_LATEST_STABLE);
    }
    
    // Return PluginVersion object
    const pluginVersion: PluginVersion = {
      id: versionRecord.id,
      version: versionRecord.version,
      fileUrl: versionRecord.file_url,
      fileSize: versionRecord.file_size,
      changelog: versionRecord.changelog || '',
      isStable: versionRecord.is_stable ?? false,
      minLightroomVersion: versionRecord.min_lightroom_version || '11.0',
      releaseDate: versionRecord.release_date || new Date().toISOString(),
      downloadCount: versionRecord.download_count || 0,
      createdAt: versionRecord.created_at || new Date().toISOString(),
    };
    
    return pluginVersion;
  }

  async getLatestStableVersion(): Promise<PluginVersion | null> {
    // Check cache first
    const cached = await this.cacheService.get<PluginVersion>(
      PluginVersionService.CACHE_KEY_LATEST_STABLE
    );
    
    if (cached) {
      return cached;
    }
    
    const supabase = createAdminClient();
    
    // Query plugin_versions where is_stable=true
    const { data: versions, error } = await supabase
      .from('plugin_versions')
      .select('*')
      .eq('is_stable', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[PluginVersionService] Failed to fetch stable versions:', error);
      throw new Error('Failed to fetch stable versions');
    }
    
    if (!versions || versions.length === 0) {
      return null;
    }
    
    // Sort versions using semantic comparison to find the highest
    const versionStrings = versions.map(v => v.version);
    const sortedVersions = this.sortVersionsDescending(versionStrings);
    const latestVersionString = sortedVersions[0];
    
    // Find the record with the highest version
    const latestRecord = versions.find(v => v.version === latestVersionString);
    
    if (!latestRecord) {
      return null;
    }
    
    // Map to PluginVersion interface
    const pluginVersion: PluginVersion = {
      id: latestRecord.id,
      version: latestRecord.version,
      fileUrl: latestRecord.file_url,
      fileSize: latestRecord.file_size,
      changelog: latestRecord.changelog || '',
      isStable: latestRecord.is_stable ?? false,
      minLightroomVersion: latestRecord.min_lightroom_version || '11.0',
      releaseDate: latestRecord.release_date || new Date().toISOString(),
      downloadCount: latestRecord.download_count || 0,
      createdAt: latestRecord.created_at || new Date().toISOString(),
    };
    
    // Cache the result for 5 minutes
    await this.cacheService.set(
      PluginVersionService.CACHE_KEY_LATEST_STABLE,
      pluginVersion,
      PluginVersionService.CACHE_TTL_SECONDS
    );
    
    return pluginVersion;
  }

  async getAllVersions(includeUnstable: boolean = false): Promise<PluginVersion[]> {
    const supabase = createAdminClient();
    
    // Build query based on stability filter
    let query = supabase
      .from('plugin_versions')
      .select('*');
    
    // Filter by stability based on user role
    // Note: RLS policies should handle admin vs non-admin access
    // This parameter allows explicit filtering when needed
    if (!includeUnstable) {
      query = query.eq('is_stable', true);
    }
    
    // Order by release date descending (newest first)
    query = query.order('release_date', { ascending: false });
    
    const { data: versions, error } = await query;
    
    if (error) {
      console.error('[PluginVersionService] Failed to fetch versions:', error);
      throw new Error('Failed to fetch plugin versions');
    }
    
    // Map database records to PluginVersion interface
    return (versions || []).map((record) => ({
      id: record.id,
      version: record.version,
      fileUrl: record.file_url,
      fileSize: record.file_size,
      changelog: record.changelog || '',
      isStable: record.is_stable ?? false,
      minLightroomVersion: record.min_lightroom_version || '11.0',
      releaseDate: record.release_date || new Date().toISOString(),
      downloadCount: record.download_count || 0,
      createdAt: record.created_at || new Date().toISOString(),
    }));
  }

  async getVersionById(id: string): Promise<PluginVersion | null> {
    const supabase = createAdminClient();
    
    // Query single version by ID
    const { data: versionRecord, error } = await supabase
      .from('plugin_versions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      // Return null if not found (404 case)
      if (error.code === 'PGRST116') {
        return null;
      }
      
      console.error('[PluginVersionService] Failed to fetch version:', error);
      throw new Error('Failed to fetch plugin version');
    }
    
    if (!versionRecord) {
      return null;
    }
    
    // Map to PluginVersion interface
    return {
      id: versionRecord.id,
      version: versionRecord.version,
      fileUrl: versionRecord.file_url,
      fileSize: versionRecord.file_size,
      changelog: versionRecord.changelog || '',
      isStable: versionRecord.is_stable ?? false,
      minLightroomVersion: versionRecord.min_lightroom_version || '11.0',
      releaseDate: versionRecord.release_date || new Date().toISOString(),
      downloadCount: versionRecord.download_count || 0,
      createdAt: versionRecord.created_at || new Date().toISOString(),
    };
  }

  async updateVersion(id: string, updates: Partial<PluginVersion>): Promise<PluginVersion> {
    const supabase = createAdminClient();
    
    // Map interface fields to database column names
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.version !== undefined) dbUpdates.version = updates.version;
    if (updates.fileUrl !== undefined) dbUpdates.file_url = updates.fileUrl;
    if (updates.fileSize !== undefined) dbUpdates.file_size = updates.fileSize;
    if (updates.changelog !== undefined) dbUpdates.changelog = updates.changelog;
    if (updates.isStable !== undefined) dbUpdates.is_stable = updates.isStable;
    if (updates.minLightroomVersion !== undefined) dbUpdates.min_lightroom_version = updates.minLightroomVersion;
    if (updates.releaseDate !== undefined) dbUpdates.release_date = updates.releaseDate;
    if (updates.downloadCount !== undefined) dbUpdates.download_count = updates.downloadCount;
    
    // Update the record
    const { data: versionRecord, error } = await supabase
      .from('plugin_versions')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !versionRecord) {
      console.error('[PluginVersionService] Failed to update version:', error);
      throw new Error('Failed to update plugin version');
    }
    
    // Invalidate cache if stability changed
    if (updates.isStable !== undefined) {
      await this.cacheService.delete(PluginVersionService.CACHE_KEY_LATEST_STABLE);
    }
    
    // Return updated PluginVersion object
    return {
      id: versionRecord.id,
      version: versionRecord.version,
      fileUrl: versionRecord.file_url,
      fileSize: versionRecord.file_size,
      changelog: versionRecord.changelog || '',
      isStable: versionRecord.is_stable ?? false,
      minLightroomVersion: versionRecord.min_lightroom_version || '11.0',
      releaseDate: versionRecord.release_date || new Date().toISOString(),
      downloadCount: versionRecord.download_count || 0,
      createdAt: versionRecord.created_at || new Date().toISOString(),
    };
  }

  async recordDownload(versionId: string, userId: string | null, metadata: DownloadMetadata): Promise<void> {
    const supabase = createAdminClient();
    
    // Use a transaction-like approach with error handling
    try {
      // Insert record into plugin_downloads table
      const { error: insertError } = await supabase
        .from('plugin_downloads')
        .insert({
          version_id: versionId,
          user_id: userId,
          ip_address: metadata.ipAddress || null,
          user_agent: metadata.userAgent || null,
          downloaded_at: new Date().toISOString(),
        });
      
      if (insertError) {
        console.error('[PluginVersionService] Failed to record download:', insertError);
        throw new Error('Failed to record download');
      }
      
      // Increment download_count on plugin_versions atomically
      // Note: The increment_download_count RPC function needs to be created in the database
      // For now, we'll use a direct update with a fetch-modify-write pattern
      const { data: currentVersion, error: fetchError } = await supabase
        .from('plugin_versions')
        .select('download_count')
        .eq('id', versionId)
        .single();
      
      if (fetchError || !currentVersion) {
        console.error('[PluginVersionService] Failed to fetch version for count update:', fetchError);
        // Don't throw - download was recorded, count update is secondary
        return;
      }
      
      const { error: directUpdateError } = await supabase
        .from('plugin_versions')
        .update({ download_count: (currentVersion.download_count || 0) + 1 })
        .eq('id', versionId);
      
      if (directUpdateError) {
        console.error('[PluginVersionService] Failed to update download count:', directUpdateError);
        // Don't throw - download was recorded, count update is secondary
      }
      
      // Invalidate cache since download count changed
      await this.cacheService.delete(PluginVersionService.CACHE_KEY_LATEST_STABLE);
      
    } catch (error) {
      console.error('[PluginVersionService] Error in recordDownload:', error);
      throw error;
    }
  }

  async getDownloadStats(versionId: string): Promise<DownloadStats> {
    const supabase = createAdminClient();
    
    // Get total download count from plugin_versions
    const { data: version, error: versionError } = await supabase
      .from('plugin_versions')
      .select('download_count')
      .eq('id', versionId)
      .single();
    
    if (versionError || !version) {
      console.error('[PluginVersionService] Failed to fetch version for stats:', versionError);
      throw new Error('Failed to fetch download statistics');
    }
    
    // Get download records for detailed stats
    const { data: downloads, error: downloadsError } = await supabase
      .from('plugin_downloads')
      .select('user_id, downloaded_at')
      .eq('version_id', versionId);
    
    if (downloadsError) {
      console.error('[PluginVersionService] Failed to fetch download records:', downloadsError);
      throw new Error('Failed to fetch download statistics');
    }
    
    // Calculate statistics
    const authenticatedDownloads = (downloads || []).filter(d => d.user_id !== null).length;
    const unauthenticatedDownloads = (downloads || []).filter(d => d.user_id === null).length;
    
    // Group downloads by date
    const downloadsByDate: Record<string, number> = {};
    (downloads || []).forEach(download => {
      if (download.downloaded_at) {
        const date = new Date(download.downloaded_at).toISOString().split('T')[0];
        if (date) {
          downloadsByDate[date] = (downloadsByDate[date] || 0) + 1;
        }
      }
    });
    
    return {
      versionId,
      totalDownloads: version.download_count || 0,
      authenticatedDownloads,
      unauthenticatedDownloads,
      downloadsByDate,
    };
  }
}

/**
 * Factory function to create a PluginVersionService instance
 */
export function createPluginVersionService(): IPluginVersionService {
  return new PluginVersionService();
}

/**
 * Export singleton instance
 */
export const pluginVersionService = new PluginVersionService();
