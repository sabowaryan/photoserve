const fs = require('fs');
const path = require('path');

// Read the English locale file
const enPath = path.join(__dirname, '..', 'src', 'locales', 'en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

// Function to recursively replace all string values with empty strings
function emptyStrings(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = emptyStrings(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(() => '');
    } else {
      result[key] = '';
    }
  }
  return result;
}

// Create empty structure
const empty = emptyStrings(en);

// List of new locales to create
const locales = ['sv', 'no', 'da', 'fi', 'ja', 'ko', 'zh-CN', 'zh-TW', 'ar'];

// Create each locale file
const localesDir = path.join(__dirname, '..', 'src', 'locales');
locales.forEach(locale => {
  const filePath = path.join(localesDir, `${locale}.json`);
  fs.writeFileSync(
    filePath,
    JSON.stringify(empty, null, 2) + '\n',
    'utf-8'
  );
  console.log(`✓ Created ${locale}.json`);
});

console.log(`\n✓ Successfully created ${locales.length} empty locale files`);
