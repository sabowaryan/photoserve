/**
 * I18n Audit Tool
 * 
 * Scans the codebase for hardcoded text strings that should be translated.
 * Identifies potential translation candidates in JSX text content and attributes.
 * 
 * Usage:
 *   npx ts-node scripts/audit-i18n.ts [directory]
 * 
 * Example:
 *   npx ts-node scripts/audit-i18n.ts src/components
 */

import * as fs from 'fs';
import * as path from 'path';

export interface AuditResult {
  file: string;
  line: number;
  column: number;
  content: string;
  context: string;
  type: 'jsx-text' | 'attribute' | 'string-literal';
  suggestion: string;
}

export interface AuditReport {
  totalFiles: number;
  filesWithIssues: number;
  totalIssues: number;
  results: AuditResult[];
  byFile: Record<string, AuditResult[]>;
  byType: Record<string, AuditResult[]>;
}

export class I18nAuditor {
  private results: AuditResult[] = [];
  private scannedFiles: number = 0;
  
  private excludePatterns: RegExp[] = [
    /node_modules/,
    /\.next/,
    /\.git/,
    /\.test\./,
    /\.spec\./,
    /\.d\.ts$/,
    /__tests__/,
    /\.config\./,
    /locales\//,
  ];

  private translatableAttributes = [
    'placeholder',
    'title',
    'alt',
    'aria-label',
    'aria-description',
    'aria-placeholder',
    'label',
  ];

  /**
   * Scan a directory recursively for hardcoded strings
   */
  async scanDirectory(dir: string): Promise<AuditResult[]> {
    this.results = [];
    this.scannedFiles = 0;
    
    const files = this.getFiles(dir);
    
    for (const file of files) {
      await this.scanFile(file);
      this.scannedFiles++;
    }
    
    return this.results;
  }

  /**
   * Get all relevant files recursively
   */
  private getFiles(dir: string): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) {
      console.warn(`Directory not found: ${dir}`);
      return files;
    }
    
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      if (this.shouldExclude(fullPath)) continue;

      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getFiles(fullPath));
      } else if (this.isRelevantFile(fullPath)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Check if path should be excluded from scanning
   */
  private shouldExclude(filePath: string): boolean {
    return this.excludePatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Check if file is relevant for scanning (TSX, JSX, TS, JS)
   */
  private isRelevantFile(filePath: string): boolean {
    return /\.(tsx|jsx|ts|js)$/.test(filePath) && !/\.d\.ts$/.test(filePath);
  }

  /**
   * Scan a single file for hardcoded strings
   */
  async scanFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const lineNumber = i + 1;
      
      // Skip comment lines
      if (this.isCommentLine(line)) continue;
      
      // Look for JSX text content: >text<
      this.findJsxTextContent(line, lineNumber, filePath);
      
      // Look for translatable attributes
      this.findTranslatableAttributes(line, lineNumber, filePath);
      
      // Look for string literals in specific patterns
      this.findStringLiterals(line, lineNumber, filePath);
    }
  }

  /**
   * Check if a line is a comment
   */
  private isCommentLine(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || 
           trimmed.startsWith('/*') || 
           trimmed.startsWith('*') ||
           trimmed.startsWith('{/*');
  }

  /**
   * Find JSX text content between tags
   */
  private findJsxTextContent(line: string, lineNumber: number, filePath: string): void {
    // Match text between > and < that isn't inside braces
    // This regex finds: >some text here<
    const jsxTextRegex = />([^<>{}\n]+)</g;
    let match;
    
    while ((match = jsxTextRegex.exec(line)) !== null) {
      const matchedText = match[1];
      if (!matchedText) continue;
      
      const text = matchedText.trim();
      const column = match.index + 1;
      
      if (this.isHardcodedString(text)) {
        this.results.push({
          file: filePath,
          line: lineNumber,
          column,
          content: text,
          context: line.trim(),
          type: 'jsx-text',
          suggestion: this.generateKey(text),
        });
      }
    }
  }

  /**
   * Find hardcoded strings in translatable attributes
   */
  private findTranslatableAttributes(line: string, lineNumber: number, filePath: string): void {
    for (const attr of this.translatableAttributes) {
      // Match attribute="value" or attribute='value'
      const attrRegex = new RegExp(`${attr}=["']([^"']+)["']`, 'g');
      let match;
      
      while ((match = attrRegex.exec(line)) !== null) {
        const text = match[1];
        if (!text) continue;
        
        const column = match.index + 1;
        
        if (this.isHardcodedString(text)) {
          this.results.push({
            file: filePath,
            line: lineNumber,
            column,
            content: text,
            context: line.trim(),
            type: 'attribute',
            suggestion: this.generateKey(text),
          });
        }
      }
    }
  }

  /**
   * Find string literals that might need translation
   */
  private findStringLiterals(line: string, lineNumber: number, filePath: string): void {
    // Look for patterns like: message: "text", label: "text", text: "text"
    const literalPatterns = [
      /(?:message|label|text|title|description|error|warning|info|success):\s*["']([^"']+)["']/gi,
      /(?:toast|alert|confirm)\s*\(\s*["']([^"']+)["']/gi,
    ];
    
    for (const pattern of literalPatterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const text = match[1];
        if (!text) continue;
        
        const column = match.index + 1;
        
        if (this.isHardcodedString(text)) {
          this.results.push({
            file: filePath,
            line: lineNumber,
            column,
            content: text,
            context: line.trim(),
            type: 'string-literal',
            suggestion: this.generateKey(text),
          });
        }
      }
    }
  }

  /**
   * Check if text is a hardcoded string that should be translated
   * Returns true if the text is likely translatable content
   */
  isHardcodedString(text: string): boolean {
    // Ignore if empty or only whitespace
    if (!text || !text.trim()) return false;
    
    const trimmed = text.trim();
    
    // Ignore if it's a variable or expression (contains braces)
    if (trimmed.includes('{') || trimmed.includes('}')) return false;
    
    // Ignore if it's purely numeric
    if (/^[\d.,\s%$€£¥]+$/.test(trimmed)) return false;
    
    // Ignore if it's a URL or path
    if (/^(https?:\/\/|\/|\.\/|\.\.\/)/.test(trimmed)) return false;
    
    // Ignore if it's an email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
    
    // Ignore if it's a CSS class or Tailwind utility
    if (/^[a-z-]+(-[a-z0-9]+)*$/.test(trimmed) && trimmed.includes('-')) return false;
    
    // Ignore if it's a constant (ALL_CAPS_WITH_UNDERSCORES)
    if (/^[A-Z][A-Z0-9_]+$/.test(trimmed)) return false;
    
    // Ignore if it's already using translation (t('key') or similar)
    if (/^t\(/.test(trimmed) || /^\{t\(/.test(trimmed)) return false;
    
    // Ignore if it's a dot notation key (likely already a translation key)
    if (/^[a-z]+(\.[a-z]+)+$/i.test(trimmed)) return false;
    
    // Ignore if it's a single character
    if (trimmed.length === 1) return false;
    
    // Ignore if it's a common technical string
    const technicalStrings = [
      'utf-8', 'utf8', 'json', 'html', 'css', 'js', 'ts', 'tsx', 'jsx',
      'get', 'post', 'put', 'delete', 'patch', 'head', 'options',
      'true', 'false', 'null', 'undefined', 'NaN',
      'px', 'em', 'rem', '%', 'vh', 'vw',
      'id', 'key', 'ref', 'src', 'href', 'className',
    ];
    if (technicalStrings.includes(trimmed.toLowerCase())) return false;
    
    // Ignore if it's a file extension pattern
    if (/^\*?\.[a-z]+$/i.test(trimmed)) return false;
    
    // Ignore if it's a hex color
    if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return false;
    
    // Ignore if it's a date/time format pattern
    if (/^[YMDHhms/:.\-\s]+$/.test(trimmed)) return false;
    
    // If it contains letters (any language), it's likely translatable
    // This includes Latin, CJK, Arabic, Cyrillic, etc.
    return /\p{L}/u.test(trimmed);
  }

  /**
   * Generate a suggested translation key from text
   * Creates a dot-notation key following naming conventions
   */
  generateKey(text: string): string {
    // Normalize the text
    const normalized = text
      .toLowerCase()
      // Remove accents and diacritics
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Remove non-alphanumeric characters except spaces
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
    
    // Split into words and take first 3-4 meaningful words
    const words = normalized
      .split(/\s+/)
      .filter(word => word.length > 0)
      .slice(0, 4);
    
    if (words.length === 0) {
      return 'common.text';
    }
    
    // Create the key using camelCase for the last part
    const keyPart = words.join('_');
    
    // Determine a reasonable section based on common patterns
    const section = this.inferSection(text);
    
    return `${section}.${keyPart}`;
  }

  /**
   * Infer the translation section based on text content
   */
  private inferSection(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Common section patterns
    if (/error|failed|invalid|required/i.test(lowerText)) return 'errors';
    if (/success|saved|created|updated|deleted/i.test(lowerText)) return 'success';
    if (/loading|wait|processing/i.test(lowerText)) return 'common';
    if (/sign\s*(in|out|up)|log\s*(in|out)|password|email/i.test(lowerText)) return 'auth';
    if (/gallery|photo|image|upload/i.test(lowerText)) return 'gallery';
    if (/dashboard|stats|overview/i.test(lowerText)) return 'dashboard';
    if (/settings|preferences|profile/i.test(lowerText)) return 'settings';
    if (/price|plan|subscription|premium|pro|free/i.test(lowerText)) return 'pricing';
    if (/admin|user|manage/i.test(lowerText)) return 'admin';
    if (/nav|menu|home|features|help|contact/i.test(lowerText)) return 'nav';
    
    return 'common';
  }

  /**
   * Generate a comprehensive audit report
   */
  generateReport(): AuditReport {
    const byFile: Record<string, AuditResult[]> = {};
    const byType: Record<string, AuditResult[]> = {};
    
    for (const result of this.results) {
      // Group by file
      if (!byFile[result.file]) {
        byFile[result.file] = [];
      }
      byFile[result.file]!.push(result);
      
      // Group by type
      if (!byType[result.type]) {
        byType[result.type] = [];
      }
      byType[result.type]!.push(result);
    }
    
    return {
      totalFiles: this.scannedFiles,
      filesWithIssues: Object.keys(byFile).length,
      totalIssues: this.results.length,
      results: this.results,
      byFile,
      byType,
    };
  }

  /**
   * Generate a markdown report string
   */
  generateMarkdownReport(): string {
    const report = this.generateReport();
    
    let markdown = `# I18n Audit Report\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- **Total files scanned:** ${report.totalFiles}\n`;
    markdown += `- **Files with issues:** ${report.filesWithIssues}\n`;
    markdown += `- **Total hardcoded strings found:** ${report.totalIssues}\n\n`;
    
    if (report.totalIssues === 0) {
      markdown += `✅ No hardcoded strings found!\n`;
      return markdown;
    }
    
    // Issues by type
    markdown += `## Issues by Type\n\n`;
    for (const [type, results] of Object.entries(report.byType)) {
      markdown += `- **${type}:** ${results.length} issues\n`;
    }
    markdown += `\n`;
    
    // Issues by file
    markdown += `## Issues by File\n\n`;
    
    const sortedFiles = Object.entries(report.byFile)
      .sort((a, b) => b[1].length - a[1].length);
    
    for (const [file, results] of sortedFiles) {
      const relativePath = file.replace(process.cwd(), '').replace(/^[/\\]/, '');
      markdown += `### ${relativePath}\n\n`;
      markdown += `Found ${results.length} hardcoded string(s):\n\n`;
      
      for (const result of results) {
        markdown += `- **Line ${result.line}:** \`${this.truncate(result.content, 50)}\`\n`;
        markdown += `  - Type: ${result.type}\n`;
        markdown += `  - Suggested key: \`${result.suggestion}\`\n`;
        markdown += `  - Context: \`${this.truncate(result.context, 80)}\`\n\n`;
      }
    }
    
    return markdown;
  }

  /**
   * Generate a JSON report
   */
  generateJsonReport(): string {
    return JSON.stringify(this.generateReport(), null, 2);
  }

  /**
   * Truncate text to a maximum length
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Get the results array
   */
  getResults(): AuditResult[] {
    return this.results;
  }

  /**
   * Clear results
   */
  clearResults(): void {
    this.results = [];
    this.scannedFiles = 0;
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const targetDir = args[0] || 'src';
  const outputFormat = args[1] || 'markdown';
  
  console.log(`\n🔍 Scanning ${targetDir} for hardcoded strings...\n`);
  
  const auditor = new I18nAuditor();
  
  auditor.scanDirectory(targetDir).then(() => {
    const report = auditor.generateReport();
    
    if (outputFormat === 'json') {
      console.log(auditor.generateJsonReport());
    } else {
      console.log(auditor.generateMarkdownReport());
    }
    
    if (report.totalIssues > 0) {
      console.log(`\n⚠️  Found ${report.totalIssues} hardcoded strings in ${report.filesWithIssues} files.`);
      console.log(`   Run with 'json' argument for machine-readable output.\n`);
    } else {
      console.log(`\n✅ No hardcoded strings found!\n`);
    }
  }).catch(error => {
    console.error('Error during audit:', error);
    process.exit(1);
  });
}
