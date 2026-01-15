/**
 * I18n Central Orchestrator
 * 
 * Central script that coordinates all i18n operations:
 * 1. Audit hardcoded strings in code
 * 2. Audit locale files for missing translations
 * 3. Generate translations automatically
 * 4. Apply translations to locale files
 * 5. Replace hardcoded strings in code
 * 6. Synchronize locale files
 * 
 * Usage:
 *   npx tsx scripts/i18n/index.ts                    # Interactive menu
 *   npx tsx scripts/i18n/index.ts audit              # Run all audits
 *   npx tsx scripts/i18n/index.ts translate --all    # Translate all locales
 *   npx tsx scripts/i18n/index.ts sync               # Sync locale files
 *   npx tsx scripts/i18n/index.ts full               # Full pipeline
 */

import * as fs from 'fs';
import * as path from 'path';
import { I18nAuditor } from '../audit-i18n';
import { LocaleAuditor } from '../audit-locales';
import { TranslationKeyGenerator } from '../generate-keys';
import { I18nTranslator, LANGUAGE_MAP } from './translate';
import { I18nApplier } from './apply';
import { HardcodedReplacer } from './replace-hardcoded';

interface PipelineResult {
  step: string;
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

class I18nOrchestrator {
  private auditor: I18nAuditor;
  private localeAuditor: LocaleAuditor;
  private keyGenerator: TranslationKeyGenerator;
  private translator: I18nTranslator;
  private applier: I18nApplier;
  private replacer: HardcodedReplacer;
  
  private results: PipelineResult[] = [];

  constructor() {
    this.auditor = new I18nAuditor();
    this.localeAuditor = new LocaleAuditor();
    this.keyGenerator = new TranslationKeyGenerator();
    this.translator = new I18nTranslator();
    this.applier = new I18nApplier();
    this.replacer = new HardcodedReplacer();
  }

  /**
   * Log a step result
   */
  private logStep(step: string, success: boolean, message: string, details?: Record<string, unknown>): void {
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${step}: ${message}`);
    
    this.results.push({ step, success, message, details });
  }

  /**
   * Step 1: Audit hardcoded strings in code
   */
  async auditHardcodedStrings(targetDir: string = 'src'): Promise<number> {
    console.log('\n📋 Step 1: Auditing hardcoded strings...\n');
    
    try {
      const results = await this.auditor.scanDirectory(targetDir);
      const report = this.auditor.generateReport();
      
      this.logStep(
        'Audit Hardcoded', 
        true, 
        `Found ${report.totalIssues} hardcoded strings in ${report.filesWithIssues} files`,
        { totalIssues: report.totalIssues, filesWithIssues: report.filesWithIssues }
      );
      
      return report.totalIssues;
    } catch (error) {
      this.logStep('Audit Hardcoded', false, error instanceof Error ? error.message : String(error));
      return -1;
    }
  }

  /**
   * Step 2: Audit locale files for missing translations
   */
  auditLocales(section?: string): void {
    console.log('\n📋 Step 2: Auditing locale files...\n');
    
    try {
      const results = this.localeAuditor.auditAll(section);
      
      let totalMissing = 0;
      let totalNeedsTranslation = 0;
      
      for (const result of results) {
        totalMissing += result.missingKeys.length;
        totalNeedsTranslation += result.englishFallbackKeys.length;
        
        const completion = result.completionRate.toFixed(1);
        console.log(`  ${result.locale}: ${completion}% complete (${result.englishFallbackKeys.length} need translation)`);
      }
      
      this.logStep(
        'Audit Locales',
        true,
        `${totalNeedsTranslation} keys need translation across ${results.length} locales`,
        { totalMissing, totalNeedsTranslation, locales: results.length }
      );
    } catch (error) {
      this.logStep('Audit Locales', false, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Step 3: Generate translations
   */
  async generateTranslations(locale?: string, section?: string, dryRun: boolean = false): Promise<void> {
    console.log('\n🌐 Step 3: Generating translations...\n');
    
    try {
      if (locale && locale !== 'all') {
        const result = await this.translator.generateTranslations(locale, section, dryRun);
        this.logStep(
          'Generate Translations',
          result.success,
          `Generated ${result.translations.length} translations for ${locale}`,
          { locale, count: result.translations.length }
        );
      } else {
        const results = await this.translator.generateAllTranslations(section, dryRun);
        
        let totalTranslations = 0;
        let successCount = 0;
        
        for (const result of results) {
          totalTranslations += result.translations.length;
          if (result.success) successCount++;
        }
        
        this.logStep(
          'Generate Translations',
          successCount === results.length,
          `Generated ${totalTranslations} translations for ${successCount}/${results.length} locales`,
          { totalTranslations, successCount, totalLocales: results.length }
        );
      }
    } catch (error) {
      this.logStep('Generate Translations', false, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Step 4: Apply translations to locale files
   */
  applyTranslations(locale?: string, dryRun: boolean = false): void {
    console.log('\n📝 Step 4: Applying translations...\n');
    
    try {
      if (locale && locale !== 'all') {
        const result = this.applier.applyFromCache(locale, undefined, dryRun);
        this.logStep(
          'Apply Translations',
          result.errors.length === 0,
          `Applied ${result.applied} translations to ${locale}`,
          { locale, applied: result.applied, skipped: result.skipped }
        );
      } else {
        const results = this.applier.applyAllCached(dryRun);
        
        let totalApplied = 0;
        let errorCount = 0;
        
        for (const result of results) {
          totalApplied += result.applied;
          if (result.errors.length > 0) errorCount++;
          console.log(`  ${result.locale}: Applied ${result.applied}, Skipped ${result.skipped}`);
        }
        
        this.logStep(
          'Apply Translations',
          errorCount === 0,
          `Applied ${totalApplied} translations to ${results.length} locales`,
          { totalApplied, locales: results.length, errors: errorCount }
        );
      }
    } catch (error) {
      this.logStep('Apply Translations', false, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Step 5: Replace hardcoded strings in code
   */
  async replaceHardcodedStrings(targetDir: string = 'src', dryRun: boolean = false, addKeys: boolean = false): Promise<void> {
    console.log('\n🔄 Step 5: Replacing hardcoded strings...\n');
    
    try {
      await this.replacer.auditAndPrepare(targetDir);
      const replacements = this.replacer.getPendingReplacements();
      
      if (replacements.length === 0) {
        this.logStep('Replace Hardcoded', true, 'No hardcoded strings to replace');
        return;
      }
      
      if (addKeys) {
        const added = this.replacer.addKeysToLocales();
        console.log(`  Added ${added} keys to locale files`);
      }
      
      const results = this.replacer.applyReplacements(dryRun);
      
      let totalReplacements = 0;
      let errorCount = 0;
      
      for (const result of results) {
        totalReplacements += result.replacements;
        if (result.errors.length > 0) errorCount++;
      }
      
      this.logStep(
        'Replace Hardcoded',
        errorCount === 0,
        `Replaced ${totalReplacements} strings in ${results.length} files`,
        { totalReplacements, files: results.length, errors: errorCount }
      );
    } catch (error) {
      this.logStep('Replace Hardcoded', false, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Step 6: Synchronize locale files
   */
  syncLocales(): void {
    console.log('\n🔄 Step 6: Synchronizing locale files...\n');
    
    try {
      this.keyGenerator.synchronizeLocales();
      this.logStep('Sync Locales', true, 'All locale files synchronized with English reference');
    } catch (error) {
      this.logStep('Sync Locales', false, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Validate locale structure
   */
  validateStructure(): boolean {
    console.log('\n🔍 Validating locale structure...\n');
    
    try {
      const result = this.keyGenerator.validateStructure();
      
      if (result.isValid) {
        this.logStep('Validate Structure', true, 'All locale files have consistent structure');
        return true;
      } else {
        const missingCount = Object.values(result.missingKeys).reduce((a, b) => a + b.length, 0);
        const extraCount = Object.values(result.extraKeys).reduce((a, b) => a + b.length, 0);
        
        this.logStep(
          'Validate Structure',
          false,
          `Found ${missingCount} missing keys, ${extraCount} extra keys, ${result.structureMismatches.length} type mismatches`,
          { missingCount, extraCount, typeMismatches: result.structureMismatches.length }
        );
        return false;
      }
    } catch (error) {
      this.logStep('Validate Structure', false, error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Run full pipeline
   */
  async runFullPipeline(options: {
    targetDir?: string;
    section?: string;
    locale?: string;
    dryRun?: boolean;
    skipReplace?: boolean;
  } = {}): Promise<void> {
    const { 
      targetDir = 'src', 
      section, 
      locale = 'all',
      dryRun = false,
      skipReplace = true // Skip replace by default as it's risky
    } = options;

    console.log('\n' + '='.repeat(60));
    console.log('🚀 I18n Full Pipeline');
    console.log('='.repeat(60));
    
    if (dryRun) {
      console.log('\n📋 DRY RUN - No files will be modified\n');
    }

    // Step 1: Audit hardcoded strings
    await this.auditHardcodedStrings(targetDir);

    // Step 2: Audit locale files
    this.auditLocales(section);

    // Step 3: Generate translations
    await this.generateTranslations(locale, section, dryRun);

    // Step 4: Apply translations
    this.applyTranslations(locale, dryRun);

    // Step 5: Replace hardcoded strings (optional)
    if (!skipReplace) {
      await this.replaceHardcodedStrings(targetDir, dryRun, true);
    }

    // Step 6: Sync locales
    if (!dryRun) {
      this.syncLocales();
    }

    // Final validation
    this.validateStructure();

    // Summary
    this.printSummary();
  }

  /**
   * Print pipeline summary
   */
  printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Pipeline Summary');
    console.log('='.repeat(60) + '\n');

    const successCount = this.results.filter(r => r.success).length;
    const failCount = this.results.filter(r => !r.success).length;

    for (const result of this.results) {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.step}: ${result.message}`);
    }

    console.log('\n' + '-'.repeat(40));
    console.log(`Total: ${successCount} succeeded, ${failCount} failed`);
    console.log('');
  }

  /**
   * Get supported locales
   */
  getSupportedLocales(): string[] {
    return Object.keys(LANGUAGE_MAP);
  }

  /**
   * Clear results
   */
  clearResults(): void {
    this.results = [];
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  let locale: string | undefined;
  let section: string | undefined;
  let targetDir = 'src';
  let dryRun = false;
  let skipReplace = true;
  
  // Parse arguments
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--locale' && args[i + 1]) {
      locale = args[++i] as string;
    } else if (args[i] === '--section' && args[i + 1]) {
      section = args[++i] as string;
    } else if (args[i] === '--dir' && args[i + 1]) {
      targetDir = args[++i] as string;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--all') {
      locale = 'all';
    } else if (args[i] === '--with-replace') {
      skipReplace = false;
    }
  }
  
  const orchestrator = new I18nOrchestrator();
  
  const showHelp = () => {
    console.log(`
I18n Central Orchestrator

Usage:
  npx tsx scripts/i18n/index.ts <command> [options]

Commands:
  audit              Run all audits (hardcoded strings + locale files)
  translate          Generate translations
  apply              Apply cached translations to locale files
  replace            Replace hardcoded strings in code
  sync               Synchronize locale files with English reference
  validate           Validate locale file structure
  full               Run full pipeline (audit → translate → apply → sync)

Options:
  --locale <code>    Target locale (e.g., fr, sv, ja) or 'all'
  --section <name>   Only process keys in this section
  --dir <path>       Directory to scan (default: src)
  --dry-run          Preview changes without modifying files
  --all              Process all locales
  --with-replace     Include hardcoded string replacement in full pipeline

Supported locales: ${orchestrator.getSupportedLocales().join(', ')}

Examples:
  npx tsx scripts/i18n/index.ts audit
  npx tsx scripts/i18n/index.ts translate --all --section galleryAnalytics
  npx tsx scripts/i18n/index.ts apply --locale fr
  npx tsx scripts/i18n/index.ts full --dry-run
  npx tsx scripts/i18n/index.ts full --section galleryAnalytics
`);
  };
  
  (async () => {
    switch (command) {
      case 'audit':
        await orchestrator.auditHardcodedStrings(targetDir);
        orchestrator.auditLocales(section);
        orchestrator.printSummary();
        break;
      
      case 'translate':
        await orchestrator.generateTranslations(locale || 'all', section, dryRun);
        orchestrator.printSummary();
        break;
      
      case 'apply':
        orchestrator.applyTranslations(locale || 'all', dryRun);
        orchestrator.printSummary();
        break;
      
      case 'replace':
        await orchestrator.replaceHardcodedStrings(targetDir, dryRun, true);
        orchestrator.printSummary();
        break;
      
      case 'sync':
        orchestrator.syncLocales();
        orchestrator.printSummary();
        break;
      
      case 'validate':
        orchestrator.validateStructure();
        orchestrator.printSummary();
        break;
      
      case 'full':
        await orchestrator.runFullPipeline({
          targetDir,
          section,
          locale: locale || 'all',
          dryRun,
          skipReplace,
        });
        break;
      
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
      
      default:
        if (command) {
          console.log(`Unknown command: ${command}\n`);
        }
        showHelp();
        break;
    }
  })();
}

export { I18nOrchestrator };
