/**
 * Property-Based Tests for ZIP Service
 * 
 * Feature: piksend-complete-features, Property 15: ZIP Download Integrity
 * 
 * Tests that ZIP downloads contain all original images with matching checksums.
 * Validates: Requirements 4.2.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ZipService } from '../zip.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import JSZip from 'jszip';

/**
 * Mock image data for testing
 */
interface MockImage {
  id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  order_index: number;
  file_size_mb: number;
  content: ArrayBuffer;
  checksum: string;
}

/**
 * Create a mock Supabase client for testing
 */
const createMockSupabase = (
  galleryData: any,
  imagesData: MockImage[]
) => {
  return {
    from: (table: string) => ({
      select: () => {
        const chainable: any = {
          eq: (column: string, _value: string) => {
            if (table === 'galleries' && column === 'id') {
              return {
                single: () => ({ data: galleryData, error: null })
              };
            }
            if (table === 'images' && column === 'gallery_id') {
              return {
                order: () => ({ data: imagesData, error: null })
              };
            }
            return chainable;
          },
          order: () => ({ data: imagesData, error: null }),
          single: () => ({ data: galleryData, error: null })
        };
        return chainable;
      }
    })
  } as unknown as SupabaseClient<Database>;
};

/**
 * Calculate a simple checksum for an ArrayBuffer
 */
function calculateChecksum(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);
  let sum = 0;
  for (let i = 0; i < view.length; i++) {
    sum = (sum + view[i]!) % 65536;
  }
  return sum.toString(16).padStart(4, '0');
}

/**
 * Create a mock image with random content
 */
function createMockImage(
  id: string,
  orderIndex: number,
  contentSize: number
): MockImage {
  // Create random content
  const content = new ArrayBuffer(contentSize);
  const view = new Uint8Array(content);
  for (let i = 0; i < contentSize; i++) {
    view[i] = Math.floor(Math.random() * 256);
  }
  
  const checksum = calculateChecksum(content);
  
  return {
    id,
    cloudinary_url: `https://res.cloudinary.com/test/image/upload/v1/${id}.jpg`,
    cloudinary_public_id: id,
    order_index: orderIndex,
    file_size_mb: contentSize / (1024 * 1024),
    content,
    checksum
  };
}

/**
 * Mock global fetch for image downloads
 */
function mockFetch(images: MockImage[]) {
  const imageMap = new Map(images.map(img => [img.cloudinary_url, img]));
  
  global.fetch = async (url: string | URL | Request) => {
    const urlString = typeof url === 'string' ? url : url.toString();
    const image = imageMap.get(urlString);
    
    if (!image) {
      return {
        ok: false,
        status: 404,
        arrayBuffer: async () => new ArrayBuffer(0)
      } as Response;
    }
    
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => image.content
    } as Response;
  };
}

/**
 * Arbitrary generators for test data
 */
const uuidArb = fc.string({ minLength: 36, maxLength: 36 }).map(() => 
  crypto.randomUUID()
);

const galleryTitleArb = fc.string({ minLength: 1, maxLength: 50 });

const imageCountArb = fc.integer({ min: 1, max: 10 });

const imageSizeArb = fc.integer({ min: 100, max: 5000 });

describe('ZIP Service - ZIP Download Integrity (Property 15)', () => {
  /**
   * Feature: piksend-complete-features, Property 15: ZIP Download Integrity
   * Validates: Requirements 4.2.3
   * 
   * For any gallery download, the ZIP SHALL contain all original images with matching checksums.
   */
  it('should contain all images with matching checksums', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        galleryTitleArb,
        imageCountArb,
        fc.array(imageSizeArb, { minLength: 1, maxLength: 10 }),
        async (galleryId, galleryTitle, imageCount, imageSizes) => {
          // Create mock images with random content
          const mockImages: MockImage[] = [];
          for (let i = 0; i < Math.min(imageCount, imageSizes.length); i++) {
            const size = imageSizes[i];
            if (size === undefined) continue;
            
            mockImages.push(createMockImage(
              crypto.randomUUID(),
              i,
              size
            ));
          }
          
          // Skip if no images
          if (mockImages.length === 0) return true;
          
          // Create mock gallery data
          const galleryData = {
            id: galleryId,
            title: galleryTitle,
            is_active: true,
            expires_at: new Date(Date.now() + 86400000).toISOString() // 1 day from now
          };
          
          // Setup mocks
          const mockSupabase = createMockSupabase(galleryData, mockImages);
          mockFetch(mockImages);
          
          // Create service and generate ZIP
          const zipService = new ZipService(mockSupabase);
          const result = await zipService.generateGalleryZip(galleryId);
          
          // Verify result metadata
          expect(result.imageCount).toBe(mockImages.length);
          expect(result.failedImages).toHaveLength(0);
          expect(result.buffer).toBeInstanceOf(ArrayBuffer);
          expect(result.size).toBeGreaterThan(0);
          
          // Extract and verify ZIP contents
          const zip = await JSZip.loadAsync(result.buffer);
          const files = Object.keys(zip.files).filter(name => !name.endsWith('/'));
          
          // Should have exactly the same number of images (excluding folder and metadata)
          const imageFiles = files.filter(name => !name.endsWith('_metadata.json'));
          expect(imageFiles.length).toBe(mockImages.length);
          
          // Verify each image's checksum matches
          for (let i = 0; i < mockImages.length; i++) {
            const mockImage = mockImages[i];
            if (!mockImage) continue;
            
            const expectedFilename = `photo_${String(i + 1).padStart(3, '0')}.jpg`;
            const zipFilePath = files.find(f => f.endsWith(expectedFilename));
            
            expect(zipFilePath).toBeDefined();
            
            if (zipFilePath) {
              const zipFile = zip.files[zipFilePath];
              expect(zipFile).toBeDefined();
              
              if (zipFile) {
                const extractedContent = await zipFile.async('arraybuffer');
                const extractedChecksum = calculateChecksum(extractedContent);
                
                // Verify checksum matches original
                expect(extractedChecksum).toBe(mockImage.checksum);
                
                // Verify size matches
                expect(extractedContent.byteLength).toBe(mockImage.content.byteLength);
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve image order in ZIP', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        galleryTitleArb,
        fc.array(imageSizeArb, { minLength: 2, maxLength: 5 }),
        async (galleryId, galleryTitle, imageSizes) => {
          // Create mock images
          const mockImages: MockImage[] = imageSizes.map((size, i) =>
            createMockImage(crypto.randomUUID(), i, size)
          );
          
          const galleryData = {
            id: galleryId,
            title: galleryTitle,
            is_active: true,
            expires_at: new Date(Date.now() + 86400000).toISOString()
          };
          
          const mockSupabase = createMockSupabase(galleryData, mockImages);
          mockFetch(mockImages);
          
          const zipService = new ZipService(mockSupabase);
          const result = await zipService.generateGalleryZip(galleryId);
          
          // Extract ZIP and verify order
          const zip = await JSZip.loadAsync(result.buffer);
          const files = Object.keys(zip.files)
            .filter(name => !name.endsWith('/') && !name.endsWith('_metadata.json'))
            .sort();
          
          // Verify sequential naming
          for (let i = 0; i < mockImages.length; i++) {
            const expectedFilename = `photo_${String(i + 1).padStart(3, '0')}.jpg`;
            expect(files[i]).toContain(expectedFilename);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle failed image downloads gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        galleryTitleArb,
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 0, max: 2 }),
        async (galleryId, galleryTitle, totalImages, failCount) => {
          // Create mock images
          const mockImages: MockImage[] = [];
          for (let i = 0; i < totalImages; i++) {
            mockImages.push(createMockImage(crypto.randomUUID(), i, 1000));
          }
          
          const galleryData = {
            id: galleryId,
            title: galleryTitle,
            is_active: true,
            expires_at: new Date(Date.now() + 86400000).toISOString()
          };
          
          // Mock fetch to fail for some images
          const successImages = mockImages.slice(0, totalImages - failCount);
          const mockSupabase = createMockSupabase(galleryData, mockImages);
          mockFetch(successImages); // Only successful images are in the fetch mock
          
          const zipService = new ZipService(mockSupabase);
          const result = await zipService.generateGalleryZip(galleryId);
          
          // Verify that successful images are included
          expect(result.imageCount).toBe(successImages.length);
          expect(result.failedImages).toHaveLength(failCount);
          
          // Verify ZIP contains only successful images
          const zip = await JSZip.loadAsync(result.buffer);
          const imageFiles = Object.keys(zip.files)
            .filter(name => !name.endsWith('/') && !name.endsWith('_metadata.json'));
          
          expect(imageFiles.length).toBe(successImages.length);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use STORE compression by default (no compression)', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        galleryTitleArb,
        imageSizeArb,
        async (galleryId, galleryTitle, imageSize) => {
          const mockImages = [createMockImage(crypto.randomUUID(), 0, imageSize)];
          
          const galleryData = {
            id: galleryId,
            title: galleryTitle,
            is_active: true,
            expires_at: new Date(Date.now() + 86400000).toISOString()
          };
          
          const mockSupabase = createMockSupabase(galleryData, mockImages);
          mockFetch(mockImages);
          
          const zipService = new ZipService(mockSupabase);
          const result = await zipService.generateGalleryZip(galleryId);
          
          // With STORE compression, ZIP size should be close to original size
          // (allowing for ZIP overhead of headers, etc.)
          const firstImage = mockImages[0];
          if (!firstImage) return true;
          
          const originalSize = firstImage.content.byteLength;
          const zipSize = result.size;
          
          // ZIP should not be significantly smaller (no compression)
          // Allow for ZIP structure overhead (typically 100-500 bytes per file)
          expect(zipSize).toBeGreaterThan(originalSize * 0.8);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid filename from gallery title', async () => {
    await fc.assert(
      fc.asyncProperty(
        uuidArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        async (galleryId, galleryTitle) => {
          const mockImages = [createMockImage(crypto.randomUUID(), 0, 500)];
          
          const galleryData = {
            id: galleryId,
            title: galleryTitle,
            is_active: true,
            expires_at: new Date(Date.now() + 86400000).toISOString()
          };
          
          const mockSupabase = createMockSupabase(galleryData, mockImages);
          mockFetch(mockImages);
          
          const zipService = new ZipService(mockSupabase);
          const result = await zipService.generateGalleryZip(galleryId);
          
          // Filename should end with .zip
          expect(result.filename).toMatch(/\.zip$/);
          
          // Filename should not contain special characters
          expect(result.filename).toMatch(/^[a-zA-Z0-9_\-]+\.zip$/);
          
          // Filename should not be empty (excluding .zip)
          const nameWithoutExt = result.filename.replace('.zip', '');
          expect(nameWithoutExt.length).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('ZIP Service - Input Validation', () => {
  it('should reject invalid gallery IDs', async () => {
    const mockSupabase = createMockSupabase(null, []);
    const zipService = new ZipService(mockSupabase);
    
    await expect(
      zipService.generateGalleryZip('invalid-id')
    ).rejects.toThrow();
  });

  it('should reject expired galleries', async () => {
    const galleryId = crypto.randomUUID();
    const mockImages = [createMockImage(crypto.randomUUID(), 0, 500)];
    
    const expiredGallery = {
      id: galleryId,
      title: 'Test Gallery',
      is_active: true,
      expires_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    };
    
    const mockSupabase = createMockSupabase(expiredGallery, mockImages);
    mockFetch(mockImages);
    
    const zipService = new ZipService(mockSupabase);
    
    await expect(
      zipService.generateGalleryZip(galleryId)
    ).rejects.toThrow('Gallery is not accessible');
  });

  it('should reject inactive galleries', async () => {
    const galleryId = crypto.randomUUID();
    const mockImages = [createMockImage(crypto.randomUUID(), 0, 500)];
    
    const inactiveGallery = {
      id: galleryId,
      title: 'Test Gallery',
      is_active: false,
      expires_at: new Date(Date.now() + 86400000).toISOString()
    };
    
    const mockSupabase = createMockSupabase(inactiveGallery, mockImages);
    mockFetch(mockImages);
    
    const zipService = new ZipService(mockSupabase);
    
    await expect(
      zipService.generateGalleryZip(galleryId)
    ).rejects.toThrow('Gallery is not accessible');
  });

  it('should reject galleries with no images', async () => {
    const galleryId = crypto.randomUUID();
    
    const galleryData = {
      id: galleryId,
      title: 'Empty Gallery',
      is_active: true,
      expires_at: new Date(Date.now() + 86400000).toISOString()
    };
    
    const mockSupabase = createMockSupabase(galleryData, []);
    
    const zipService = new ZipService(mockSupabase);
    
    await expect(
      zipService.generateGalleryZip(galleryId)
    ).rejects.toThrow('No images in gallery');
  });
});
