/**
 * AI Service
 * Business logic for AI-powered features: face recognition, auto-captioning, smart culling
 * 
 * @module lib/services/ai.service
 * Requirements: 10.1, 10.2, 10.3
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { FaceDetection, QualityAnalysis } from '@/types';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { GoogleGenAI } from '@google/genai';

/**
 * AI Service Interface
 * Defines the contract for AI-powered features
 */
export interface IAIService {
  detectFaces(imageUrl: string): Promise<FaceDetection[]>;
  matchFace(selfieUrl: string, galleryId: string): Promise<string[]>;
  generateCaption(imageUrl: string): Promise<string>;
  analyzeQuality(imageUrl: string): Promise<QualityAnalysis>;
}

/**
 * AI Service Implementation
 * Uses Google Gemini AI for vision tasks
 */
export class AIService implements IAIService {
  private genAI: GoogleGenAI | null = null;

  constructor(
    private supabase: SupabaseClient<Database>,
    apiKey?: string
  ) {
    // Initialize Gemini AI if API key is provided
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Check if AI features are enabled
   */
  private async checkAIEnabled(): Promise<void> {
    const { data: settings } = await this.supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'ai_features_enabled')
      .single();

    if (!settings || settings.value !== true) {
      throw new Error('AI features are currently disabled');
    }
  }

  /**
   * Check if AI model is initialized
   */
  private checkModelInitialized(): void {
    if (!this.genAI) {
      throw new Error('AI model not initialized. Please configure GEMINI_API_KEY');
    }
  }

  /**
   * Fetch image as base64 for AI processing
   */
  private async fetchImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string }> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';

      return { data: base64, mimeType };
    } catch (error) {
      throw new Error(`Failed to fetch image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect faces in an image
   * 
   * Requirement 10.1.1: THE System SHALL detect faces in uploaded images
   */
  async detectFaces(imageUrl: string): Promise<FaceDetection[]> {
    await this.checkAIEnabled();
    this.checkModelInitialized();

    if (!imageUrl) {
      throw new ValidationError('Image URL is required');
    }

    try {
      const { data, mimeType } = await this.fetchImageAsBase64(imageUrl);

      const prompt = `Analyze this image and detect all human faces. For each face found, provide:
1. Bounding box coordinates (x, y, width, height) as percentages of image dimensions (0-100)
2. Confidence score (0-1)

Return the result as a JSON array with this exact structure:
[
  {
    "boundingBox": { "x": 25.5, "y": 30.2, "width": 15.8, "height": 20.1 },
    "confidence": 0.95
  }
]

If no faces are detected, return an empty array: []

Only return the JSON array, no additional text.`;

      const response = await this.genAI!.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data,
                  mimeType,
                },
              },
              { text: prompt },
            ],
          },
        ],
      });

      const text = response.text?.trim() || '';

      // Parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No valid JSON found in AI response:', text);
        return [];
      }

      const faces: FaceDetection[] = JSON.parse(jsonMatch[0]);
      return faces;
    } catch (error) {
      console.error('Face detection error:', error);
      throw new Error(`Face detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Match a selfie against faces in a gallery
   * 
   * Requirement 10.1.2: THE Guest SHALL upload selfie to find matching photos
   * Requirement 10.1.3: THE System SHALL return photos containing matching face
   */
  async matchFace(selfieUrl: string, galleryId: string): Promise<string[]> {
    await this.checkAIEnabled();
    this.checkModelInitialized();

    if (!selfieUrl || !galleryId) {
      throw new ValidationError('Selfie URL and gallery ID are required');
    }

    // Verify gallery exists
    const { data: gallery, error: galleryError } = await this.supabase
      .from('galleries')
      .select('id')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      throw new NotFoundError('Gallery');
    }

    // Get all images in the gallery
    const { data: images, error: imagesError } = await this.supabase
      .from('images')
      .select('id, cloudinary_url')
      .eq('gallery_id', galleryId)
      .order('order_index');

    if (imagesError) {
      throw imagesError;
    }

    if (!images || images.length === 0) {
      return [];
    }

    try {
      // Detect face in selfie
      const selfieFaces = await this.detectFaces(selfieUrl);
      if (selfieFaces.length === 0) {
        throw new ValidationError('No face detected in selfie');
      }

      // For each gallery image, check if it contains a matching face
      const matchingImageIds: string[] = [];

      for (const image of images) {
        try {
          const { data: selfieData, mimeType: selfieMimeType } = await this.fetchImageAsBase64(selfieUrl);
          const { data: imageData, mimeType: imageMimeType } = await this.fetchImageAsBase64(image.cloudinary_url);

          const prompt = `Compare the face in the first image (selfie) with faces in the second image (gallery photo).
Determine if the same person appears in both images.

Return a JSON object with this exact structure:
{
  "isMatch": true or false,
  "confidence": 0.0 to 1.0
}

Only return the JSON object, no additional text.`;

          const response = await this.genAI!.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      data: selfieData,
                      mimeType: selfieMimeType,
                    },
                  },
                  {
                    inlineData: {
                      data: imageData,
                      mimeType: imageMimeType,
                    },
                  },
                  { text: prompt },
                ],
              },
            ],
          });

          const text = response.text?.trim() || '';

          // Parse JSON response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const matchResult = JSON.parse(jsonMatch[0]);
            if (matchResult.isMatch && matchResult.confidence > 0.7) {
              matchingImageIds.push(image.id);
            }
          }
        } catch (error) {
          console.error(`Error matching face in image ${image.id}:`, error);
          // Continue with next image
        }
      }

      return matchingImageIds;
    } catch (error) {
      console.error('Face matching error:', error);
      throw new Error(`Face matching failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate caption/alt-text for an image
   * 
   * Requirement 10.2.1: THE System SHALL generate alt-text for each image via AI
   * Requirement 10.2.2: THE Alt_Text SHALL describe image content accurately
   */
  async generateCaption(imageUrl: string): Promise<string> {
    await this.checkAIEnabled();
    this.checkModelInitialized();

    if (!imageUrl) {
      throw new ValidationError('Image URL is required');
    }

    try {
      const { data, mimeType } = await this.fetchImageAsBase64(imageUrl);

      const prompt = `Analyze this image and generate a concise, descriptive alt-text suitable for accessibility and SEO.

The alt-text should:
- Be 1-2 sentences maximum
- Describe the main subject and key visual elements
- Be objective and factual
- Be suitable for screen readers
- Not include phrases like "image of" or "picture of"

Return only the alt-text, no additional formatting or explanation.`;

      const response = await this.genAI!.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data,
                  mimeType,
                },
              },
              { text: prompt },
            ],
          },
        ],
      });

      const caption = response.text?.trim() || '';

      return caption;
    } catch (error) {
      console.error('Caption generation error:', error);
      throw new Error(`Caption generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze image quality for smart culling
   * 
   * Requirement 10.3.1: THE System SHALL detect blurry images
   * Requirement 10.3.2: THE System SHALL detect closed eyes
   * Requirement 10.3.3: THE System SHALL detect duplicate/similar images
   * Requirement 10.3.4: THE System SHALL suggest hiding flagged images
   */
  async analyzeQuality(imageUrl: string): Promise<QualityAnalysis> {
    await this.checkAIEnabled();
    this.checkModelInitialized();

    if (!imageUrl) {
      throw new ValidationError('Image URL is required');
    }

    try {
      const { data, mimeType } = await this.fetchImageAsBase64(imageUrl);

      const prompt = `Analyze this image for quality issues that would make it unsuitable for a professional photo gallery.

Check for:
1. Blur: Is the image significantly blurry or out of focus?
2. Closed eyes: If there are people in the image, do any have their eyes closed?
3. Overall quality: Rate the image quality from 0 (poor) to 100 (excellent)

Return a JSON object with this exact structure:
{
  "isBlurry": true or false,
  "hasClosedEyes": true or false,
  "overallScore": 0 to 100,
  "isDuplicate": false
}

Note: Set isDuplicate to false (duplicate detection requires comparing multiple images).

Only return the JSON object, no additional text.`;

      const response = await this.genAI!.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data,
                  mimeType,
                },
              },
              { text: prompt },
            ],
          },
        ],
      });

      const text = response.text?.trim() || '';

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        isBlurry: analysis.isBlurry || false,
        hasClosedEyes: analysis.hasClosedEyes || false,
        isDuplicate: false, // Will be implemented in future with multi-image comparison
        duplicateOf: undefined,
        overallScore: analysis.overallScore || 50,
      };
    } catch (error) {
      console.error('Quality analysis error:', error);
      throw new Error(`Quality analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Factory function to create an AIService instance
 */
export function createAIService(
  supabase: SupabaseClient<Database>,
  apiKey?: string
): IAIService {
  return new AIService(supabase, apiKey || process.env.GEMINI_API_KEY);
}
