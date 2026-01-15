/**
 * I18n Replace Hardcoded Strings Script
 * 
 * Replaces hardcoded strings in source code with translation function calls.
 * Uses the audit results to identify strings that need replacement.
 * 
 * Usage:
 *   npx tsx scripts/i18n/replace-hardcoded.ts --audit
 *   npx tsx scripts/i18n/replace-hardcoded.ts --file src/components/Button.tsx
 *   npx tsx scripts/i18n/replace-hardcoded.ts --apply --dry-run
 */

import * as fs from 'fs';
import { I18nAuditor, AuditResult } from '../audit-i18n';
import { TranslationKeyGenerator } from '../generate-keys';

export interface ReplacementEntry {
  file: string;
  line: number;
  original: string;
  replacement: string;
  key: string;
  englishValue: string;
}

export interface ReplacementResult {
  file: string;
  replacements: number;
  errors: string[];
}

export class HardcodedReplacer {
  private auditor: I18nAuditor;
  private keyGenerator: TranslationKeyGenerator;
  private pendingReplacements: ReplacementEntry[] = [];

  constructor() {
    this.auditor = new I18nAuditor();
    this.keyGenerator = new TranslationKeyGenerator();
  }

  async auditAndPrepare(targetDir: string): Promise<ReplacementEntry[]> {
    const results = await this.auditor.scanDirectory(targetDir);
    this.pendingReplacements = [];

    for (const result of results) {
      const replacement = this.generateReplacement(result);
      if (replacement) {
        this.pendingReplacements.push(replacement);
      }
    }
    return this.pendingReplacements;
  }

  private generateReplacement(result: AuditResult): ReplacementEntry | null {
    const key = result.suggestion;
    const englishValue = result.content;
    let replacement: string;

    switch (result.type) {
      case 'jsx-text':
        replacement = `{t('${key}')}`;
        break;
      case 'attribute':
        replacement = `{t('${key}')}`;
        break;
      case 'string-literal':
        replacement = `t('${key}')`;
        break;
      default:
        return null;
    }

    return {
      file: result.file,
      line: result.line,
      original: result.content,
      replacement,
      key,
      englishValue,
    };
  }

  applyReplacements(dryRun: boolean = false): ReplacementResult[] {
    const results: ReplacementResult[] = [];
    const fileGroups = this.groupByFile(this.pendingReplacements);

    for (const [file, replacements] of Object.entries(fileGroups)) {
      const result = this.applyToFile(file, replacements, dryRun);
      results.push(result);
    }
    return results;
  }

  private groupByFile(replacements: ReplacementEntry[]): Record<string, ReplacementEntry[]> {
    const groups: Record<string, ReplacementEntry[]> = {};
    for (const replacement of replacements) {
      if (!groups[replacement.file]) groups[replacement.file] = [];
      groups[replacement.file]!.push(replacement);
    }
    return groups;
  }

  private applyToFile(filePath: string, replacements: ReplacementEntry[], dryRun: boolean): ReplacementResult {
    const result: ReplacementResult = { file: filePath, replacements: 0, errors: [] };

    if (!fs.existsSync(filePath)) {
      result.errors.push(`File not found: ${filePath}`);
      return result;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const sortedReplacements = [...replacements].sort((a, b) => b.line - a.line);

    for (const replacement of sortedReplacements) {
      const lineIndex = replacement.line - 1;
      if (lineIndex < 0 || lineIndex >= lines.length) {
        result.errors.push(`Line ${replacement.line} out of range`);
        continue;
      }

      const line = lines[lineIndex];
      if (!line) continue;

      if (line.includes(replacement.original)) {
        if (replacement.replacement.startsWith('{t(')) {
          const newLine = line.replace(`>${replacement.original}<`, `>${replacement.replacement}<`);
          if (newLine !== line) {
            lines[lineIndex] = newLine;
            result.replacements++;
          }
        } else {
          const newLine = line
            .replace(`"${replacement.original}"`, replacement.replacement)
            .replace(`'${replacement.original}'`, replacement.replacement);
          if (newLine !== line) {
            lines[lineIndex] = newLine;
            result.replacements++;
          }
        }
      }
    }

    if (!dryRun && result.replacements > 0) {
      const needsImport = !content.includes('useTranslation') && result.replacements > 0;
      content = lines.join('\n');
      
      if (needsImport) {
        const importStatement = "import { useTranslation } from '@/lib/i18n/context';\n";
        const importRegex = /^import .+ from .+;?\s*$/gm;
        let lastImportIndex = -1;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          lastImportIndex = match.index + match[0].length;
        }
        if (lastImportIndex > -1) {
          content = content.slice(0, lastImportIndex) + '\n' + importStatement + content.slice(lastImportIndex);
        } else {
          content = importStatement + content;
        }
      }
      fs.writeFileSync(filePath, content, 'utf-8');
    }
    return result;
  }

  addKeysToLocales(): number {
    let added = 0;
    for (const replacement of this.pendingReplacements) {
      try {
        this.keyGenerator.addKey(replacement.key, { en: replacement.englishValue });
        added++;
      } catch {
        // Key might already exist
      }
    }
    return added;
  }

  getPendingReplacements(): ReplacementEntry[] {
    return this.pendingReplacements;
  }

  generateReport(): string {
    let report = '# Hardcoded String Replacement Report\n\n';
    if (this.pendingReplacements.length === 0) {
      report += '✅ No hardcoded strings found!\n';
      return report;
    }

    report += `Found ${this.pendingReplacements.length} strings to replace:\n\n`;
    const byFile = this.groupByFile(this.pendingReplacements);

    for (const [file, replacements] of Object.entries(byFile)) {
      const relativePath = file.replace(process.cwd(), '').replace(/^[/\\]/, '');
      report += `## ${relativePath}\n\n`;
      for (const r of replacements) {
        report += `- Line ${r.line}: \`${r.original}\`\n`;
        report += `  - Key: \`${r.key}\`\n`;
        report += `  - Replacement: \`${r.replacement}\`\n\n`;
      }
    }
    return report;
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  
  let targetDir = 'src';
  let targetFile: string | undefined;
  let dryRun = false;
  let apply = false;
  let addKeys = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) targetDir = args[++i] as string;
    else if (args[i] === '--file' && args[i + 1]) targetFile = args[++i] as string;
    else if (args[i] === '--dry-run') dryRun = true;
    else if (args[i] === '--apply') apply = true;
    else if (args[i] === '--add-keys') addKeys = true;
    else if (args[i] === '--help') {
      console.log(`
I18n Replace Hardcoded Strings Script

Usage:
  npx tsx scripts/i18n/replace-hardcoded.ts [options]

Options:
  --dir <path>       Directory to scan (default: src)
  --file <path>      Scan a specific file only
  --apply            Apply replacements to files
  --add-keys         Add translation keys to locale files
  --dry-run          Preview changes without modifying files
  --help             Show this help message
`);
      process.exit(0);
    }
  }
  
  const replacer = new HardcodedReplacer();
  
  console.log('\n🔄 I18n Replace Hardcoded Strings\n');
  if (dryRun) console.log('📋 DRY RUN - No files will be modified\n');
  
  (async () => {
    try {
      const scanTarget = targetFile || targetDir;
      console.log(`🔍 Scanning ${scanTarget}...\n`);
      
      await replacer.auditAndPrepare(scanTarget);
      const replacements = replacer.getPendingReplacements();
      
      if (replacements.length === 0) {
        console.log('✅ No hardcoded strings found!\n');
        process.exit(0);
      }
      
      console.log(`Found ${replacements.length} hardcoded strings\n`);
      
      if (!apply) {
        console.log(replacer.generateReport());
        console.log('\nRun with --apply to replace these strings\n');
      } else {
        if (addKeys) {
          console.log('📝 Adding translation keys to locale files...');
          const added = replacer.addKeysToLocales();
          console.log(`  Added ${added} keys\n`);
        }
        
        console.log('🔄 Applying replacements...\n');
        const results = replacer.applyReplacements(dryRun);
        
        for (const result of results) {
          const relativePath = result.file.replace(process.cwd(), '').replace(/^[/\\]/, '');
          const status = result.errors.length === 0 ? '✅' : '⚠️';
          console.log(`  ${status} ${relativePath}: ${result.replacements} replacements`);
          result.errors.forEach(e => console.log(`     ❌ ${e}`));
        }
      }
      console.log('\n✅ Done!\n');
    } catch (error) {
      console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}\n`);
      process.exit(1);
    }
  })();
}
