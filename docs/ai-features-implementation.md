# AI Features Implementation

## Overview

This document describes the AI-powered features implemented in PikSend using Google Gemini AI. These features are part of Phase 2 and are available for Premium and Pro plan users.

## Features

### 1. Face Recognition (Requirement 10.1)

**Description:** Allows event guests to find their photos by uploading a selfie. The system detects faces in gallery images and matches them against the uploaded selfie.

**API Endpoints:**

- `POST /api/ai/detect-faces` - Detect faces in an image
  ```json
  {
    "imageUrl": "https://..."
  }
  ```

- `POST /api/ai/face-match` - Match a selfie against gallery images
  ```json
  {
    "selfieUrl": "https://...",
    "galleryId": "uuid"
  }
  ```

**Plan Requirements:**
- Available for: Pro plan only
- Requires: `ai_features_enabled` admin setting

**Implementation Details:**
- Uses Gemini 1.5 Flash model for face detection
- Returns bounding boxes and confidence scores
- Matches faces with >70% confidence threshold
- Processes images in base64 format

### 2. Auto-Caption / Alt-Text Generation (Requirement 10.2)

**Description:** Automatically generates descriptive alt-text for images to improve accessibility and SEO. Photographers can edit the generated text.

**API Endpoints:**

- `POST /api/ai/generate-caption` - Generate caption for an image
  ```json
  {
    "imageId": "uuid",
    "imageUrl": "https://..."
  }
  ```

- `PATCH /api/ai/generate-caption` - Update caption manually
  ```json
  {
    "imageId": "uuid",
    "altText": "Updated description"
  }
  ```

**Plan Requirements:**
- Available for: Premium and Pro plans
- Requires: `ai_features_enabled` admin setting

**Implementation Details:**
- Generates 1-2 sentence descriptions
- Focuses on main subject and key visual elements
- Stores in `images.alt_text` column
- Can be edited by photographer

**Database Schema:**
```sql
ALTER TABLE images ADD COLUMN alt_text TEXT;
```

### 3. Smart Culling (Requirement 10.3)

**Description:** Analyzes image quality to detect blurry images, closed eyes, and suggests which photos to hide before sending to clients.

**API Endpoints:**

- `POST /api/ai/analyze-quality` - Analyze single image quality
  ```json
  {
    "imageId": "uuid",
    "imageUrl": "https://..."
  }
  ```

- `PUT /api/ai/analyze-quality` - Batch analyze all images in a gallery
  ```json
  {
    "galleryId": "uuid"
  }
  ```

**Plan Requirements:**
- Available for: Pro plan only
- Requires: `ai_features_enabled` admin setting

**Implementation Details:**
- Detects blur, closed eyes
- Provides quality score (0-100)
- Suggests hiding images with score < 50
- Stores results in `images.quality_score` and `images.quality_flags`

**Database Schema:**
```sql
ALTER TABLE images 
ADD COLUMN quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
ADD COLUMN quality_flags JSONB DEFAULT '{}'::jsonb;
```

**Quality Flags Structure:**
```json
{
  "isBlurry": boolean,
  "hasClosedEyes": boolean,
  "isDuplicate": boolean,
  "duplicateOf": "image_id",
  "analyzedAt": "timestamp"
}
```

## Service Architecture

### AIService Class

Located in `src/lib/services/ai.service.ts`

**Methods:**
- `detectFaces(imageUrl: string): Promise<FaceDetection[]>`
- `matchFace(selfieUrl: string, galleryId: string): Promise<string[]>`
- `generateCaption(imageUrl: string): Promise<string>`
- `analyzeQuality(imageUrl: string): Promise<QualityAnalysis>`

**Configuration:**
- Uses `GEMINI_API_KEY` environment variable
- Checks `ai_features_enabled` admin setting before processing
- Uses Gemini 1.5 Flash model for all operations

### Error Handling

All AI endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "code": 400|401|403|404|500|503
}
```

**Common Errors:**
- `400` - Validation error (missing parameters)
- `401` - Authentication required
- `403` - Permission denied (not gallery owner)
- `404` - Resource not found
- `500` - AI processing failed
- `503` - AI features disabled

## Admin Controls

AI features can be globally enabled/disabled via admin settings:

```sql
UPDATE admin_settings 
SET value = 'true'::jsonb 
WHERE key = 'ai_features_enabled';
```

When disabled, all AI endpoints return:
```json
{
  "error": "AI features are currently disabled",
  "status": 503
}
```

## Performance Considerations

### Rate Limiting
- Face matching processes images sequentially to avoid API rate limits
- Batch quality analysis processes all images but may take time for large galleries
- Consider implementing queue system for large batches

### Caching
- Face detection results are not cached (privacy)
- Alt-text is stored in database after generation
- Quality analysis results are stored in database

### Cost Optimization
- Use Gemini 1.5 Flash (cheaper, faster) instead of Pro
- Process images at reduced resolution when possible
- Implement user-facing rate limits per plan

## Security & Privacy

### Face Data
- Face embeddings are not stored permanently
- Face detection data is processed in-memory only
- Selfie URLs should be temporary/signed

### Image Access
- All endpoints verify gallery ownership
- Only authenticated users can trigger AI analysis
- Public galleries allow face matching for guests

### GDPR Compliance
- Face data is not retained after matching
- Users should be informed about AI processing
- Provide opt-out mechanism for AI features

## Testing

### Manual Testing

1. **Face Detection:**
   ```bash
   curl -X POST http://localhost:3000/api/ai/detect-faces \
     -H "Content-Type: application/json" \
     -d '{"imageUrl": "https://..."}'
   ```

2. **Caption Generation:**
   ```bash
   curl -X POST http://localhost:3000/api/ai/generate-caption \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"imageId": "uuid", "imageUrl": "https://..."}'
   ```

3. **Quality Analysis:**
   ```bash
   curl -X POST http://localhost:3000/api/ai/analyze-quality \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"imageId": "uuid", "imageUrl": "https://..."}'
   ```

### Integration Testing

Test files should be created in `src/lib/services/__tests__/ai.service.test.ts`

## Future Enhancements

### Duplicate Detection
Currently returns `isDuplicate: false`. Future implementation should:
- Compare image embeddings
- Use perceptual hashing
- Group similar images

### Face Embeddings
Store face embeddings for faster matching:
- Create `face_embeddings` table
- Store vector embeddings
- Use vector similarity search

### Batch Processing
Implement background job queue:
- Process large galleries asynchronously
- Send notification when complete
- Show progress indicator

### Advanced Quality Metrics
- Composition analysis
- Color balance
- Exposure detection
- Sharpness measurement

## Troubleshooting

### "AI model not initialized"
- Check `GEMINI_API_KEY` is set in `.env`
- Verify API key is valid
- Check Gemini API quota

### "AI features are currently disabled"
- Check admin settings: `SELECT * FROM admin_settings WHERE key = 'ai_features_enabled'`
- Enable via admin panel or SQL

### Slow Performance
- Reduce image resolution before sending to API
- Implement caching for repeated requests
- Use batch endpoints for multiple images

### Low Accuracy
- Ensure images are high quality
- Check lighting conditions
- Verify face is clearly visible
- Adjust confidence threshold

## References

- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [Requirements Document](../.kiro/specs/piksend-complete-features/requirements.md)
- [Design Document](../.kiro/specs/piksend-complete-features/design.md)
