# Implementation Plan: Complete Internationalization

## Overview

This implementation plan systematically extends the i18n system to support 9 additional languages, adds RTL support for Arabic, and ensures all hardcoded strings are replaced with translation keys. The approach follows an incremental strategy: first extending the infrastructure, then auditing and migrating existing code, then adding translations, and finally comprehensive testing.

## Tasks

- [x] 1. Extend i18n type definitions and configuration
  - Update `src/lib/i18n/types.ts` to include all new locale codes (sv, no, da, fi, ja, ko, zh-CN, zh-TW, ar)
  - Add LocaleConfig entries for each new language with native names, flags, direction, and formatting rules
  - Update SupportedLocale type union to include all new locales
  - Update I18N_CONFIG with complete list of supported locales
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1_

- [ ]* 1.1 Write property test for supported locale recognition
  - **Property 4: Supported locale recognition**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1**

- [x] 2. Create RTL layout manager
  - [x] 2.1 Implement RTLManager class in `src/lib/i18n/rtl.ts`
    - Create isRTL() method to check if locale uses RTL
    - Create getDirection() method to get text direction
    - Create applyDirection() method to set document attributes
    - Create getDirectionClass() method for CSS classes
    - _Requirements: 4.2, 4.4_

  - [ ]* 2.2 Write property test for RTL direction detection
    - **Property 7: RTL direction for Arabic**
    - **Validates: Requirements 4.2**

  - [ ]* 2.3 Write unit tests for RTL manager
    - Test isRTL() returns true for Arabic
    - Test isRTL() returns false for LTR languages
    - Test getDirection() returns correct values
    - Test applyDirection() sets document.dir and document.lang
    - _Requirements: 4.2, 4.4_

- [x] 3. Enhance I18n context with RTL and formatting
  - [x] 3.1 Update I18nContextValue interface in `src/lib/i18n/context.tsx`
    - Add isRTL boolean property
    - Add direction property ('ltr' | 'rtl')
    - Add formatDate function
    - Add formatNumber function
    - _Requirements: 4.2, 7.1, 7.2_

  - [x] 3.2 Import all new locale dictionaries
    - Import sv, no, da, fi, ja, ko, zh-CN, zh-TW, ar JSON files
    - Add to dictionaries record
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1_

  - [x] 3.3 Add RTL management to I18nProvider
    - Use RTLManager.applyDirection() in useEffect when locale changes
    - Calculate isRTL and direction from current locale
    - Add to context value
    - _Requirements: 4.2, 4.4_

  - [x] 3.4 Implement formatDate function
    - Use Intl.DateTimeFormat with current locale
    - Support optional format parameter
    - Add to context value
    - _Requirements: 7.1_

  - [x] 3.5 Implement formatNumber function
    - Use Intl.NumberFormat with current locale
    - Add to context value
    - _Requirements: 7.2_

  - [ ]* 3.6 Write property test for reactive direction updates
    - **Property 8: Reactive direction updates**
    - **Validates: Requirements 4.4**

  - [ ]* 3.7 Write property test for date formatting
    - **Property 13: Date formatting locale awareness**
    - **Validates: Requirements 7.1**

  - [ ]* 3.8 Write property test for number formatting
    - **Property 14: Number formatting locale awareness**
    - **Validates: Requirements 7.2**

- [ ] 4. Create empty locale files for new languages
  - Create `src/locales/sv.json` with empty structure matching en.json
  - Create `src/locales/no.json` with empty structure matching en.json
  - Create `src/locales/da.json` with empty structure matching en.json
  - Create `src/locales/fi.json` with empty structure matching en.json
  - Create `src/locales/ja.json` with empty structure matching en.json
  - Create `src/locales/ko.json` with empty structure matching en.json
  - Create `src/locales/zh-CN.json` with empty structure matching en.json
  - Create `src/locales/zh-TW.json` with empty structure matching en.json
  - Create `src/locales/ar.json` with empty structure matching en.json
  - _Requirements: 6.2, 6.4_

- [ ]* 4.1 Write property test for locale file structure consistency
  - **Property 3: Locale file structure consistency**
  - **Validates: Requirements 1.4, 1.5, 6.4**

- [ ] 5. Checkpoint - Verify infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement hardcoded string audit tool
  - [ ] 6.1 Create I18nAuditor class in `scripts/audit-i18n.ts`
    - Implement scanDirectory() to recursively find files
    - Implement scanFile() to find hardcoded strings in JSX and attributes
    - Implement isHardcodedString() to filter translatable strings
    - Implement generateKey() to suggest translation keys
    - Implement generateReport() to output findings
    - _Requirements: 1.1_

  - [ ]* 6.2 Write property test for audit tool completeness
    - **Property 1: Audit tool completeness**
    - **Validates: Requirements 1.1**

  - [ ]* 6.3 Write unit tests for audit tool
    - Test scanFile() finds JSX text content
    - Test scanFile() finds attribute strings
    - Test scanFile() ignores variables and expressions
    - Test isHardcodedString() filters correctly
    - Test generateKey() creates valid keys
    - _Requirements: 1.1_

- [ ] 7. Implement translation key generator
  - [ ] 7.1 Create TranslationKeyGenerator class in `scripts/generate-keys.ts`
    - Implement addKey() to add keys to all locale files
    - Implement setNestedKey() to create nested structure
    - Implement validateStructure() to check consistency
    - Implement getKeys() to extract all keys
    - _Requirements: 1.3, 1.4, 6.4_

  - [ ]* 7.2 Write property test for translation key naming convention
    - **Property 2: Translation key naming convention**
    - **Validates: Requirements 1.3**

  - [ ]* 7.3 Write unit tests for key generator
    - Test addKey() adds to all files
    - Test setNestedKey() creates correct structure
    - Test validateStructure() detects mismatches
    - Test getKeys() extracts all keys
    - _Requirements: 1.3, 1.4_

- [ ] 8. Run audit and generate migration report
  - Run audit tool on src/ directory
  - Generate comprehensive report of hardcoded strings
  - Review report and categorize findings
  - Create migration plan for replacing strings
  - _Requirements: 1.1_

- [ ] 9. Checkpoint - Review audit results
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Migrate hardcoded strings to translation keys
  - [ ] 10.1 Add missing translation keys to en.json and fr.json
    - Add keys for all hardcoded strings found in audit
    - Maintain existing structure and naming conventions
    - Ensure alphabetical ordering within sections
    - _Requirements: 1.2, 1.3_

  - [ ] 10.2 Replace hardcoded strings in components
    - Replace JSX text content with {t('key')}
    - Replace attribute strings with t('key')
    - Add useTranslation() hook where needed
    - _Requirements: 1.2_

  - [ ] 10.3 Replace hardcoded strings in pages
    - Replace page-level text with translation keys
    - Update metadata and SEO content
    - _Requirements: 1.2, 8.1_

  - [ ] 10.4 Replace hardcoded strings in API responses
    - Replace error messages with translation keys
    - Ensure API errors are localized
    - _Requirements: 1.2, 9.1_

- [ ]* 10.5 Write property test for translation retrieval
  - **Property 5: Translation retrieval correctness**
  - **Validates: Requirements 2.5, 3.5, 10.1, 10.2, 10.4**

- [ ]* 10.6 Write property test for fallback mechanism
  - **Property 6: Fallback to English**
  - **Validates: Requirements 2.6, 3.6**

- [ ]* 10.7 Write property test for missing key warnings
  - **Property 12: Missing key warning**
  - **Validates: Requirements 6.5**

- [ ] 11. Update language switcher component
  - Update `src/components/shared/language-switcher.tsx` to show all new languages
  - Display native language names
  - Show appropriate flags
  - Group languages by region (optional)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1_

- [ ] 12. Add RTL CSS support
  - [ ] 12.1 Create RTL-specific CSS utilities in `src/app/globals.css`
    - Add [dir="rtl"] selectors for layout adjustments
    - Mirror padding, margin, and positioning for RTL
    - Adjust icon and button positioning
    - _Requirements: 4.3_

  - [ ] 12.2 Update Tailwind configuration for RTL
    - Add RTL plugin if needed
    - Configure directional utilities
    - _Requirements: 4.3_

- [ ] 13. Enhance language detector
  - [ ] 13.1 Update language detector in `src/lib/i18n/detector.ts`
    - Ensure detect() handles all new locale codes
    - Test with various browser language settings
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 13.2 Write property test for browser language detection
    - **Property 9: Browser language detection**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [ ]* 13.3 Write property test for locale persistence
    - **Property 10: Locale persistence**
    - **Validates: Requirements 5.4**

  - [ ]* 13.4 Write property test for stored preference priority
    - **Property 11: Stored preference priority**
    - **Validates: Requirements 5.5**

- [ ] 14. Checkpoint - Verify migration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Add professional translations for new languages
  - [ ] 15.1 Translate all keys to Swedish (sv.json)
    - Use professional translation service or native speaker
    - Validate translations for accuracy and cultural appropriateness
    - _Requirements: 2.1_

  - [ ] 15.2 Translate all keys to Norwegian (no.json)
    - Use professional translation service or native speaker
    - Validate translations for accuracy and cultural appropriateness
    - _Requirements: 2.2_

  - [ ] 15.3 Translate all keys to Danish (da.json)
    - Use professional translation service or native speaker
    - Validate translations for accuracy and cultural appropriateness
    - _Requirements: 2.3_

  - [ ] 15.4 Translate all keys to Finnish (fi.json)
    - Use professional translation service or native speaker
    - Validate translations for accuracy and cultural appropriateness
    - _Requirements: 2.4_

  - [ ] 15.5 Translate all keys to Japanese (ja.json)
    - Use professional translation service or native speaker
    - Validate translations for accuracy and cultural appropriateness
    - _Requirements: 3.1_

  - [ ] 15.6 Translate all keys to Korean (ko.json)
    - Use professional translation service or native speaker
    - Validate translations for accuracy and cultural appropriateness
    - _Requirements: 3.2_

  - [ ] 15.7 Translate all keys to Simplified Chinese (zh-CN.json)
    - Use professional translation service or native speaker
    - Validate translations for accuracy and cultural appropriateness
    - _Requirements: 3.3_

  - [ ] 15.8 Translate all keys to Traditional Chinese (zh-TW.json)
    - Use professional translation service or native speaker
    - Validate translations for accuracy and cultural appropriateness
    - _Requirements: 3.4_

  - [ ] 15.9 Translate all keys to Arabic (ar.json)
    - Use professional translation service or native speaker
    - Validate translations for accuracy and cultural appropriateness
    - Ensure RTL-appropriate phrasing
    - _Requirements: 4.1_

- [ ] 16. Add SEO metadata localization
  - [ ] 16.1 Create localized metadata in page files
    - Add generateMetadata() functions to pages
    - Use t() function for titles and descriptions
    - Set lang attribute based on locale
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 16.2 Update sitemap generation
    - Generate language-specific sitemaps
    - Include hreflang tags
    - _Requirements: 8.5_

  - [ ]* 16.3 Write property test for HTML lang attribute
    - **Property 16: HTML lang attribute synchronization**
    - **Validates: Requirements 8.1**

- [ ] 17. Localize error messages and validation
  - [ ] 17.1 Add error message keys to all locale files
    - Add validation error keys
    - Add API error keys
    - Add network error keys
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [ ] 17.2 Update error handling to use translations
    - Update form validation to use t()
    - Update API error handlers to use t()
    - Update toast notifications to use t()
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 17.3 Write property test for error message localization
    - **Property 17: Error message localization**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [ ] 18. Enhance variable interpolation
  - [ ] 18.1 Update interpolate() function in context
    - Support number parameters (not just strings)
    - Handle missing parameters gracefully
    - _Requirements: 7.4, 7.5_

  - [ ]* 18.2 Write property test for variable interpolation
    - **Property 15: Variable interpolation preservation**
    - **Validates: Requirements 7.4, 7.5**

  - [ ]* 18.3 Write unit tests for interpolation
    - Test with string parameters
    - Test with number parameters
    - Test with missing parameters
    - Test with multiple placeholders
    - _Requirements: 7.4, 7.5_

- [ ] 19. Checkpoint - Verify translations
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Write integration tests
  - [ ]* 20.1 Write full locale switching flow test
    - Mount I18nProvider with initial locale
    - Switch to different locale
    - Verify UI text updates
    - Verify direction updates for RTL
    - Verify localStorage persistence
    - _Requirements: 4.4, 5.4_

  - [ ]* 20.2 Write SSR hydration test
    - Render on server with initial locale
    - Hydrate on client
    - Verify no hydration mismatches
    - Verify client-side detection works
    - _Requirements: 5.1, 5.2_

  - [ ]* 20.3 Write fallback chain test
    - Request translation with missing key
    - Verify fallback to English
    - Verify warning logged
    - Verify UI doesn't break
    - _Requirements: 2.6, 6.5_

- [ ] 21. Manual QA in all languages
  - Test complete user flows in each language
  - Verify RTL layout in Arabic
  - Test language switching
  - Verify date and number formatting
  - Check for layout issues
  - Validate translations with native speakers
  - _Requirements: All_

- [ ] 22. Create documentation
  - [ ] 22.1 Document translation key conventions
    - Explain dot notation structure
    - Provide examples of good keys
    - Document naming patterns
    - _Requirements: 1.3_

  - [ ] 22.2 Create guide for adding new languages
    - Step-by-step process
    - Required configuration changes
    - Translation workflow
    - _Requirements: 6.2_

  - [ ] 22.3 Document RTL considerations
    - CSS patterns for RTL
    - Layout best practices
    - Testing RTL layouts
    - _Requirements: 4.3_

  - [ ] 22.4 Create translation contribution guide
    - How to add new keys
    - Translation quality standards
    - Review process
    - _Requirements: 1.2, 1.3_

- [ ] 23. Final checkpoint - Complete verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Professional translation services should be used for production-quality translations
- RTL testing requires special attention to layout and visual design
- The audit tool should be run periodically to catch new hardcoded strings
