/**
 * I18n Auto-Translation Script
 * 
 * Generates translations automatically using Gemini AI and fallback dictionaries.
 * Supports batch translation and caching to minimize API calls.
 * 
 * Usage:
 *   npx tsx scripts/i18n/translate.ts --locale fr --section galleryAnalytics
 *   npx tsx scripts/i18n/translate.ts --locale all --dry-run
 *   npx tsx scripts/i18n/translate.ts --from-audit
 * 
 * Supported locales: en, fr, sv, no, da, fi, ja, ko, zh-CN, zh-TW, ar
 */

import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenAI } from '@google/genai';

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

export interface TranslationEntry {
  key: string;
  english: string;
  translation: string;
}

export interface TranslationResult {
  locale: string;
  translations: TranslationEntry[];
  success: boolean;
  error?: string;
}

// Language codes mapping for translation services
const LANGUAGE_MAP: Record<string, string> = {
  'en': 'English',
  'fr': 'French',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'da': 'Danish',
  'fi': 'Finnish',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'ar': 'Arabic',
};

// Simple translation dictionary for common UI terms
// This provides instant translations without API calls
const TRANSLATION_DICTIONARY: Record<string, Record<string, string>> = {
  // French translations
  'fr': {
    'Overview': 'Aperçu',
    'Analytics': 'Statistiques',
    'Views': 'Vues',
    'Downloads': 'Téléchargements',
    'Engagement': 'Engagement',
    'Events': 'Événements',
    'Countries': 'Pays',
    'Images': 'Images',
    'Total': 'Total',
    'Today': 'Aujourd\'hui',
    'This week': 'Cette semaine',
    'This month': 'Ce mois',
    'Last 7 days': '7 derniers jours',
    'Last 30 days': '30 derniers jours',
    'Last 90 days': '90 derniers jours',
    'All time': 'Tout le temps',
    'No data': 'Aucune donnée',
    'Loading': 'Chargement',
    'Error': 'Erreur',
    'Success': 'Succès',
    'Save': 'Enregistrer',
    'Cancel': 'Annuler',
    'Delete': 'Supprimer',
    'Edit': 'Modifier',
    'Create': 'Créer',
    'Search': 'Rechercher',
    'Filter': 'Filtrer',
    'Sort': 'Trier',
    'Settings': 'Paramètres',
    'Profile': 'Profil',
    'Dashboard': 'Tableau de bord',
    'Gallery': 'Galerie',
    'Photo': 'Photo',
    'Photos': 'Photos',
    'Upload': 'Téléverser',
    'Download': 'Télécharger',
    'Share': 'Partager',
    'Copy': 'Copier',
    'Link': 'Lien',
    'View': 'Voir',
    'Popular photos': 'Photos populaires',
    'Top images': 'Meilleures images',
    'Most viewed': 'Les plus vues',
    'Most downloaded': 'Les plus téléchargées',
    'Unique visitors': 'Visiteurs uniques',
    'Page views': 'Pages vues',
    'Average time': 'Temps moyen',
    'Bounce rate': 'Taux de rebond',
    'Click rate': 'Taux de clic',
    'Conversion rate': 'Taux de conversion',
  },
  // Swedish translations
  'sv': {
    'Overview': 'Översikt',
    'Analytics': 'Statistik',
    'Views': 'Visningar',
    'Downloads': 'Nedladdningar',
    'Engagement': 'Engagemang',
    'Events': 'Händelser',
    'Countries': 'Länder',
    'Images': 'Bilder',
    'Total': 'Totalt',
    'Today': 'Idag',
    'This week': 'Denna vecka',
    'This month': 'Denna månad',
    'Last 7 days': 'Senaste 7 dagarna',
    'Last 30 days': 'Senaste 30 dagarna',
    'Last 90 days': 'Senaste 90 dagarna',
    'All time': 'All tid',
    'No data': 'Ingen data',
    'Loading': 'Laddar',
    'Error': 'Fel',
    'Success': 'Lyckades',
    'Popular photos': 'Populära foton',
    'Top images': 'Toppbilder',
    'Most viewed': 'Mest visade',
    'Most downloaded': 'Mest nedladdade',
    'Unique visitors': 'Unika besökare',
    'Page views': 'Sidvisningar',
  },
  // Norwegian translations
  'no': {
    'Overview': 'Oversikt',
    'Analytics': 'Statistikk',
    'Views': 'Visninger',
    'Downloads': 'Nedlastinger',
    'Engagement': 'Engasjement',
    'Events': 'Hendelser',
    'Countries': 'Land',
    'Images': 'Bilder',
    'Total': 'Totalt',
    'Today': 'I dag',
    'This week': 'Denne uken',
    'This month': 'Denne måneden',
    'Last 7 days': 'Siste 7 dager',
    'Last 30 days': 'Siste 30 dager',
    'Last 90 days': 'Siste 90 dager',
    'All time': 'All tid',
    'No data': 'Ingen data',
    'Loading': 'Laster',
    'Popular photos': 'Populære bilder',
    'Top images': 'Toppbilder',
    'Unique visitors': 'Unike besøkende',
  },
  // Danish translations
  'da': {
    'Overview': 'Oversigt',
    'Analytics': 'Statistik',
    'Views': 'Visninger',
    'Downloads': 'Downloads',
    'Engagement': 'Engagement',
    'Events': 'Begivenheder',
    'Countries': 'Lande',
    'Images': 'Billeder',
    'Total': 'Total',
    'Today': 'I dag',
    'This week': 'Denne uge',
    'This month': 'Denne måned',
    'Last 7 days': 'Sidste 7 dage',
    'Last 30 days': 'Sidste 30 dage',
    'Last 90 days': 'Sidste 90 dage',
    'All time': 'Al tid',
    'No data': 'Ingen data',
    'Loading': 'Indlæser',
    'Popular photos': 'Populære billeder',
    'Top images': 'Topbilleder',
    'Unique visitors': 'Unikke besøgende',
  },
  // Finnish translations
  'fi': {
    'Overview': 'Yleiskatsaus',
    'Analytics': 'Analytiikka',
    'Views': 'Katselut',
    'Downloads': 'Lataukset',
    'Engagement': 'Sitoutuminen',
    'Events': 'Tapahtumat',
    'Countries': 'Maat',
    'Images': 'Kuvat',
    'Total': 'Yhteensä',
    'Today': 'Tänään',
    'This week': 'Tällä viikolla',
    'This month': 'Tässä kuussa',
    'Last 7 days': 'Viimeiset 7 päivää',
    'Last 30 days': 'Viimeiset 30 päivää',
    'Last 90 days': 'Viimeiset 90 päivää',
    'All time': 'Kaikki aika',
    'No data': 'Ei tietoja',
    'Loading': 'Ladataan',
    'Popular photos': 'Suositut kuvat',
    'Top images': 'Parhaat kuvat',
    'Unique visitors': 'Yksilölliset kävijät',
  },
  // Japanese translations
  'ja': {
    'Overview': '概要',
    'Analytics': '分析',
    'Views': '閲覧数',
    'Downloads': 'ダウンロード',
    'Engagement': 'エンゲージメント',
    'Events': 'イベント',
    'Countries': '国',
    'Images': '画像',
    'Total': '合計',
    'Today': '今日',
    'This week': '今週',
    'This month': '今月',
    'Last 7 days': '過去7日間',
    'Last 30 days': '過去30日間',
    'Last 90 days': '過去90日間',
    'All time': '全期間',
    'No data': 'データなし',
    'Loading': '読み込み中',
    'Popular photos': '人気の写真',
    'Top images': 'トップ画像',
    'Unique visitors': 'ユニーク訪問者',
  },
  // Korean translations
  'ko': {
    'Overview': '개요',
    'Analytics': '분석',
    'Views': '조회수',
    'Downloads': '다운로드',
    'Engagement': '참여',
    'Events': '이벤트',
    'Countries': '국가',
    'Images': '이미지',
    'Total': '총',
    'Today': '오늘',
    'This week': '이번 주',
    'This month': '이번 달',
    'Last 7 days': '지난 7일',
    'Last 30 days': '지난 30일',
    'Last 90 days': '지난 90일',
    'All time': '전체 기간',
    'No data': '데이터 없음',
    'Loading': '로딩 중',
    'Popular photos': '인기 사진',
    'Top images': '인기 이미지',
    'Unique visitors': '고유 방문자',
  },
  // Chinese Simplified translations
  'zh-CN': {
    'Overview': '概览',
    'Analytics': '分析',
    'Views': '浏览量',
    'Downloads': '下载',
    'Engagement': '互动',
    'Events': '事件',
    'Countries': '国家',
    'Images': '图片',
    'Total': '总计',
    'Today': '今天',
    'This week': '本周',
    'This month': '本月',
    'Last 7 days': '过去7天',
    'Last 30 days': '过去30天',
    'Last 90 days': '过去90天',
    'All time': '所有时间',
    'No data': '无数据',
    'Loading': '加载中',
    'Popular photos': '热门照片',
    'Top images': '热门图片',
    'Unique visitors': '独立访客',
  },
  // Chinese Traditional translations
  'zh-TW': {
    'Overview': '概覽',
    'Analytics': '分析',
    'Views': '瀏覽量',
    'Downloads': '下載',
    'Engagement': '互動',
    'Events': '事件',
    'Countries': '國家',
    'Images': '圖片',
    'Total': '總計',
    'Today': '今天',
    'This week': '本週',
    'This month': '本月',
    'Last 7 days': '過去7天',
    'Last 30 days': '過去30天',
    'Last 90 days': '過去90天',
    'All time': '所有時間',
    'No data': '無資料',
    'Loading': '載入中',
    'Popular photos': '熱門照片',
    'Top images': '熱門圖片',
    'Unique visitors': '獨立訪客',
  },
  // Arabic translations
  'ar': {
    'Overview': 'نظرة عامة',
    'Analytics': 'التحليلات',
    'Views': 'المشاهدات',
    'Downloads': 'التنزيلات',
    'Engagement': 'التفاعل',
    'Events': 'الأحداث',
    'Countries': 'البلدان',
    'Images': 'الصور',
    'Total': 'المجموع',
    'Today': 'اليوم',
    'This week': 'هذا الأسبوع',
    'This month': 'هذا الشهر',
    'Last 7 days': 'آخر 7 أيام',
    'Last 30 days': 'آخر 30 يوم',
    'Last 90 days': 'آخر 90 يوم',
    'All time': 'كل الوقت',
    'No data': 'لا توجد بيانات',
    'Loading': 'جاري التحميل',
    'Popular photos': 'الصور الشائعة',
    'Top images': 'أفضل الصور',
    'Unique visitors': 'الزوار الفريدون',
  },
};

export class I18nTranslator {
  private localesDir: string;
  private cacheDir: string;
  private referenceLocale: string = 'en';
  private geminiAI: GoogleGenAI | null = null;

  constructor(localesDir?: string) {
    this.localesDir = localesDir || path.join(process.cwd(), 'src/locales');
    this.cacheDir = path.join(process.cwd(), '.i18n-cache');
    
    // Ensure cache directory exists
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }

    // Initialize Gemini AI if API key is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        this.geminiAI = new GoogleGenAI({});
        console.log('✅ Gemini AI initialized for high-quality translations');
      } catch (error) {
        console.warn('⚠️  Gemini AI initialization failed, falling back to dictionary translations');
        this.geminiAI = null;
      }
    } else {
      console.log('ℹ️  No Gemini API key found, using dictionary translations only');
    }
  }

  /**
   * Get supported locales
   */
  getSupportedLocales(): string[] {
    return Object.keys(LANGUAGE_MAP).filter(l => l !== 'en');
  }

  /**
   * Read a locale file
   */
  private readLocaleFile(locale: string): Record<string, unknown> {
    const filePath = path.join(this.localesDir, `${locale}.json`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Locale file not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Get all keys from a nested object
   */
  private getKeys(obj: Record<string, unknown>, prefix: string = ''): string[] {
    const keys: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...this.getKeys(value as Record<string, unknown>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: Record<string, unknown>, keyPath: string): unknown {
    const keys = keyPath.split('.');
    let current: unknown = obj;
    
    for (const key of keys) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }
    
    return current;
  }

  /**
   * Translate a single text using Gemini AI or dictionary lookup
   */
  async translateText(text: string, targetLocale: string, sourceLocale?: string): Promise<string> {
    // Try dictionary lookup first for common terms (only if source is English or unknown)
    if (!sourceLocale || sourceLocale === 'en') {
      const dictTranslation = this.translateWithDictionary(text, targetLocale);
      if (dictTranslation !== text) {
        return dictTranslation;
      }
    }

    // Use Gemini AI for more complex translations
    if (this.geminiAI) {
      try {
        return await this.translateWithGemini(text, targetLocale, sourceLocale);
      } catch (error) {
        console.warn(`⚠️  Gemini translation failed for "${text}": ${error instanceof Error ? error.message : error}`);
        return text; // Return original if translation fails
      }
    }

    return text; // Return original if no translation available
  }

  /**
   * Translate using dictionary lookup (fast, for common terms)
   */
  private translateWithDictionary(text: string, targetLocale: string): string {
    const dict = TRANSLATION_DICTIONARY[targetLocale];
    if (!dict) return text;
    
    // Try exact match first
    if (dict[text]) {
      return dict[text];
    }
    
    // Try case-insensitive match
    const lowerText = text.toLowerCase();
    for (const [key, value] of Object.entries(dict)) {
      if (key.toLowerCase() === lowerText) {
        return value;
      }
    }
    
    return text; // Return original if no translation found
  }

  /**
   * Translate using Gemini AI (high quality, for complex text)
   */
  private async translateWithGemini(text: string, targetLocale: string, sourceLocale?: string): Promise<string> {
    if (!this.geminiAI) {
      throw new Error('Gemini AI not initialized');
    }

    const targetLanguage = LANGUAGE_MAP[targetLocale] || targetLocale;
    const sourceLanguage = sourceLocale ? (LANGUAGE_MAP[sourceLocale] || sourceLocale) : null;
    
    const sourceInstruction = sourceLanguage 
      ? `from ${sourceLanguage} to ${targetLanguage}`
      : `to ${targetLanguage} (auto-detect source language)`;
    
    const prompt = `You are a professional translator for a photo gallery web application called "PikSend".

Context:
- This is a SaaS platform for photographers to share and manage photo galleries
- The UI should be professional, modern, and user-friendly
- Translations should be natural and idiomatic in the target language
- Keep technical terms consistent (e.g., "gallery", "download", "analytics")

Task: Translate the following UI text ${sourceInstruction}.

Rules:
1. First, detect the source language if not specified
2. Keep the translation concise and appropriate for a web interface
3. Preserve any placeholders like {count}, {name}, {{variable}}
4. Maintain the same tone (formal/informal) as the original
5. For ${targetLocale === 'ar' ? 'Arabic, use Modern Standard Arabic suitable for web interfaces' : targetLanguage}
6. If the text is already in ${targetLanguage}, return it unchanged
7. Only return the translated text, nothing else

Text to translate:
"${text}"

Translation:`;

    const response = await this.geminiAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const translation = response.text?.trim();
    if (!translation) {
      throw new Error('Empty response from Gemini');
    }

    // Clean up the response (remove quotes if present)
    return translation.replace(/^["']|["']$/g, '').trim();
  }

  /**
   * Batch translate multiple texts using Gemini AI (more efficient)
   */
  private async batchTranslateWithGemini(texts: string[], targetLocale: string, sourceLocale?: string): Promise<string[]> {
    if (!this.geminiAI) {
      throw new Error('Gemini AI not initialized');
    }

    if (texts.length === 0) return [];
    
    // For small batches, use individual translation
    if (texts.length <= 3) {
      const results: string[] = [];
      for (const text of texts) {
        results.push(await this.translateWithGemini(text, targetLocale, sourceLocale));
      }
      return results;
    }

    const targetLanguage = LANGUAGE_MAP[targetLocale] || targetLocale;
    const sourceLanguage = sourceLocale ? (LANGUAGE_MAP[sourceLocale] || sourceLocale) : null;
    
    const sourceInstruction = sourceLanguage 
      ? `from ${sourceLanguage} to ${targetLanguage}`
      : `to ${targetLanguage} (auto-detect source language for each text)`;
    
    // Create numbered list of texts
    const numberedTexts = texts.map((t, i) => `${i + 1}. "${t}"`).join('\n');
    
    const prompt = `You are a professional translator for a photo gallery web application called "PikSend".

Context:
- This is a SaaS platform for photographers to share and manage photo galleries
- The UI should be professional, modern, and user-friendly
- Translations should be natural and idiomatic in the target language

Task: Translate the following UI texts ${sourceInstruction}.

Rules:
1. Auto-detect the source language for each text if not specified
2. Keep translations concise and appropriate for a web interface
3. Preserve any placeholders like {count}, {name}, {{variable}}
4. Maintain the same tone as the original
5. If a text is already in ${targetLanguage}, return it unchanged
6. Return ONLY the translations in the same numbered format
7. One translation per line, matching the input numbers

Texts to translate:
${numberedTexts}

Translations (same numbered format):`;

    const response = await this.geminiAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error('Empty response from Gemini');
    }

    // Parse numbered responses
    const lines = responseText.split('\n').filter(l => l.trim());
    const translations: string[] = [];
    
    for (let i = 0; i < texts.length; i++) {
      const line = lines.find(l => l.match(new RegExp(`^${i + 1}\\.\\s*`)));
      if (line) {
        // Remove number prefix and quotes
        const translation = line.replace(/^\d+\.\s*/, '').replace(/^["']|["']$/g, '').trim();
        translations.push(translation);
      } else {
        // Fallback to original if parsing fails
        translations.push(texts[i] ?? '');
      }
    }
    
    return translations;
  }

  /**
   * Get keys that need translation for a locale
   */
  getKeysNeedingTranslation(locale: string, section?: string): TranslationEntry[] {
    const enContent = this.readLocaleFile(this.referenceLocale);
    const localeContent = this.readLocaleFile(locale);
    
    let enKeys = this.getKeys(enContent);
    
    if (section) {
      enKeys = enKeys.filter(k => k.startsWith(section));
    }
    
    const needsTranslation: TranslationEntry[] = [];
    
    for (const key of enKeys) {
      const enValue = this.getNestedValue(enContent, key);
      const localeValue = this.getNestedValue(localeContent, key);
      
      // Skip if not a string
      if (typeof enValue !== 'string') continue;
      
      // Needs translation if missing or same as English
      const isMissing = localeValue === undefined;
      const isSameAsEnglish = localeValue === enValue;
      
      if (isMissing || isSameAsEnglish) {
        needsTranslation.push({
          key,
          english: enValue,
          translation: '', // Will be filled by translation
        });
      }
    }
    
    return needsTranslation;
  }

  /**
   * Generate translations for a locale
   */
  async generateTranslations(
    locale: string, 
    section?: string,
    dryRun: boolean = false,
    sourceLocale?: string // Optional: specify source language (auto-detect if not provided)
  ): Promise<TranslationResult> {
    const entries = this.getKeysNeedingTranslation(locale, section);
    
    if (entries.length === 0) {
      return {
        locale,
        translations: [],
        success: true,
      };
    }
    
    console.log(`  Translating ${entries.length} keys to ${LANGUAGE_MAP[locale] || locale}...`);
    
    const translations: TranslationEntry[] = [];
    let geminiCount = 0;
    let dictCount = 0;
    
    // Separate entries that can use dictionary vs need Gemini
    const dictEntries: TranslationEntry[] = [];
    const geminiEntries: TranslationEntry[] = [];
    
    for (const entry of entries) {
      // Check if dictionary can handle this (only for English source)
      if (!sourceLocale || sourceLocale === 'en') {
        const dictTranslation = this.translateWithDictionary(entry.english, locale);
        if (dictTranslation !== entry.english) {
          dictEntries.push({ ...entry, translation: dictTranslation });
          dictCount++;
          continue;
        }
      }
      geminiEntries.push(entry);
    }
    
    // Add dictionary translations
    translations.push(...dictEntries);
    
    // Batch translate with Gemini if available and needed
    if (geminiEntries.length > 0 && this.geminiAI) {
      try {
        const textsToTranslate = geminiEntries.map(e => e.english);
        const batchSize = 20; // Translate in batches of 20
        
        for (let i = 0; i < textsToTranslate.length; i += batchSize) {
          const batch = textsToTranslate.slice(i, i + batchSize);
          const batchEntries = geminiEntries.slice(i, i + batchSize);
          
          console.log(`    Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(textsToTranslate.length / batchSize)}...`);
          
          const translatedBatch = await this.batchTranslateWithGemini(batch, locale, sourceLocale);
          
          for (let j = 0; j < batchEntries.length; j++) {
            const entry = batchEntries[j];
            if (!entry) continue;
            const translated = translatedBatch[j] || entry.english;
            translations.push({
              key: entry.key,
              english: entry.english,
              translation: translated,
            });
            if (translated !== entry.english) {
              geminiCount++;
            }
          }
        }
      } catch (error) {
        console.warn(`  ⚠️  Batch translation failed: ${error instanceof Error ? error.message : error}`);
        // Fallback: add untranslated entries
        for (const entry of geminiEntries) {
          translations.push({
            key: entry.key,
            english: entry.english,
            translation: entry.english,
          });
        }
      }
    } else {
      // No Gemini available, keep original
      for (const entry of geminiEntries) {
        translations.push({
          key: entry.key,
          english: entry.english,
          translation: entry.english,
        });
      }
    }
    
    // Count how many were actually translated vs kept as English
    const actuallyTranslated = translations.filter(t => t.translation !== t.english).length;
    const fallbackCount = translations.length - actuallyTranslated;
    console.log(`  ✓ Translated: ${actuallyTranslated}/${translations.length} (Dictionary: ${dictCount}, Gemini: ${geminiCount}, Fallback: ${fallbackCount})`);
    
    if (!dryRun) {
      // Save to cache for review
      const cacheFile = path.join(this.cacheDir, `${locale}${section ? `-${section.replace(/\./g, '-')}` : ''}.json`);
      fs.writeFileSync(cacheFile, JSON.stringify({
        locale,
        section: section || 'all',
        sourceLocale: sourceLocale || 'auto-detect',
        generatedAt: new Date().toISOString(),
        translationMethods: {
          dictionary: dictCount,
          gemini: geminiCount,
          fallback: fallbackCount
        },
        translations,
      }, null, 2), 'utf-8');
      console.log(`  ✓ Saved to cache: ${cacheFile}`);
    }
    
    return {
      locale,
      translations,
      success: true,
    };
  }

  /**
   * Generate translations for all locales
   */
  async generateAllTranslations(section?: string, dryRun: boolean = false): Promise<TranslationResult[]> {
    const locales = this.getSupportedLocales();
    const results: TranslationResult[] = [];
    
    for (const locale of locales) {
      try {
        const result = await this.generateTranslations(locale, section, dryRun);
        results.push(result);
      } catch (error) {
        results.push({
          locale,
          translations: [],
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    return results;
  }

  /**
   * Load cached translations
   */
  loadCachedTranslations(locale: string, section?: string): TranslationEntry[] | null {
    const cacheFile = path.join(this.cacheDir, `${locale}${section ? `-${section.replace(/\./g, '-')}` : ''}.json`);
    
    if (!fs.existsSync(cacheFile)) {
      return null;
    }
    
    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    return data.translations;
  }

  /**
   * Get language name for a locale code
   */
  getLanguageName(locale: string): string {
    return LANGUAGE_MAP[locale] || locale;
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  
  let locale: string | undefined;
  let section: string | undefined;
  let dryRun = false;
  let fromAudit = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--locale' && args[i + 1]) {
      locale = args[++i];
    } else if (args[i] === '--section' && args[i + 1]) {
      section = args[++i];
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--from-audit') {
      fromAudit = true;
    } else if (args[i] === '--help') {
      console.log(`
I18n Auto-Translation Script

Usage:
  npx tsx scripts/i18n/translate.ts [options]

Options:
  --locale <code>    Target locale (e.g., fr, sv, ja) or 'all' for all locales
  --section <name>   Only translate keys in this section (e.g., galleryAnalytics)
  --dry-run          Preview translations without saving
  --from-audit       Use audit results to determine what needs translation
  --help             Show this help message

Supported locales: ${Object.keys(LANGUAGE_MAP).join(', ')}

Examples:
  npx tsx scripts/i18n/translate.ts --locale fr --section galleryAnalytics
  npx tsx scripts/i18n/translate.ts --locale all --dry-run
  npx tsx scripts/i18n/translate.ts --locale ja
`);
      process.exit(0);
    }
  }
  
  const translator = new I18nTranslator();
  
  console.log('\n🌐 I18n Auto-Translation\n');
  
  if (dryRun) {
    console.log('📋 DRY RUN - No files will be modified\n');
  }
  
  (async () => {
    try {
      // If --from-audit is specified, run locale audit first to identify what needs translation
      if (fromAudit) {
        console.log('📋 Running locale audit to identify missing translations...\n');
        const { LocaleAuditor } = await import('../audit-locales');
        const auditor = new LocaleAuditor();
        const auditResults = auditor.auditAll(section);
        
        // Show audit summary
        for (const result of auditResults) {
          const needsWork = result.missingKeys.length + result.englishFallbackKeys.length;
          if (needsWork > 0) {
            console.log(`  ${result.locale}: ${needsWork} keys need translation (${result.completionRate.toFixed(1)}% complete)`);
          }
        }
        console.log('');
      }

      if (locale === 'all') {
        const results = await translator.generateAllTranslations(section, dryRun);
        
        console.log('\n📊 Summary:\n');
        for (const result of results) {
          const status = result.success ? '✅' : '❌';
          const count = result.translations.length;
          console.log(`  ${status} ${result.locale}: ${count} translations`);
          if (result.error) {
            console.log(`     Error: ${result.error}`);
          }
        }
      } else if (locale) {
        await translator.generateTranslations(locale, section, dryRun);
      } else {
        console.log('Please specify --locale <code> or --locale all');
        console.log('Run with --help for more information');
        process.exit(1);
      }
      
      console.log('\n✅ Done!\n');
    } catch (error) {
      console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}\n`);
      process.exit(1);
    }
  })();
}

export { LANGUAGE_MAP, TRANSLATION_DICTIONARY };
