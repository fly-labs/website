#!/usr/bin/env node

/**
 * Translation Coverage Checker + Auto-Translator
 *
 * Finds keys that exist in en/ but not in pt-BR/.
 * With --translate flag, uses Claude Haiku to translate missing keys.
 *
 * Usage:
 *   node scripts/translate-missing.mjs          # Check coverage only
 *   node scripts/translate-missing.mjs --translate  # Translate missing keys
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const I18N_DIR = resolve(__dirname, '../apps/web/src/i18n');

const shouldTranslate = process.argv.includes('--translate');

function flattenKeys(obj, prefix = '') {
  const keys = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(keys, flattenKeys(value, fullKey));
    } else {
      keys[fullKey] = value;
    }
  }
  return keys;
}

function unflattenKeys(flat) {
  const result = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

async function translateBatch(missingEntries) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic();

  const prompt = `Translate these UI strings from English to natural Brazilian Portuguese.

Rules:
- Use "voce" not "tu", natural BR Portuguese, never Portugal Portuguese
- Keep it short and informal, like a friend talking
- Technical terms stay in English: BUILD, VALIDATE, SKIP, FL score, FlyBot, Ideas Lab
- Prompt names and product names stay in English
- Never use AI slop words: delve, tapestry, pivotal, leverage, groundbreaking, transformative
- Return ONLY a valid JSON object with the same keys, translated values

Strings to translate:
${JSON.stringify(Object.fromEntries(missingEntries), null, 2)}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text;
  // Extract JSON from response (may be wrapped in markdown code block)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in translation response');
  return JSON.parse(jsonMatch[0]);
}

async function main() {
  const enDir = resolve(I18N_DIR, 'en');
  const ptDir = resolve(I18N_DIR, 'pt-BR');

  const enFiles = readdirSync(enDir).filter(f => f.endsWith('.json'));
  let totalMissing = 0;
  let totalKeys = 0;

  for (const file of enFiles) {
    const enData = JSON.parse(readFileSync(resolve(enDir, file), 'utf-8'));
    let ptData = {};
    try {
      ptData = JSON.parse(readFileSync(resolve(ptDir, file), 'utf-8'));
    } catch {
      // PT file doesn't exist yet
    }

    const enFlat = flattenKeys(enData);
    const ptFlat = flattenKeys(ptData);

    const missing = Object.entries(enFlat).filter(([key]) => !(key in ptFlat));
    totalKeys += Object.keys(enFlat).length;
    totalMissing += missing.length;

    if (missing.length > 0) {
      console.log(`\n${file}: ${missing.length} missing keys`);
      for (const [key] of missing) {
        console.log(`  - ${key}`);
      }

      if (shouldTranslate && missing.length > 0) {
        console.log(`  Translating ${missing.length} keys...`);
        try {
          const translations = await translateBatch(missing);
          const merged = deepMerge(ptData, unflattenKeys(translations));
          writeFileSync(
            resolve(ptDir, file),
            JSON.stringify(merged, null, 2) + '\n',
            'utf-8'
          );
          console.log(`  Wrote ${missing.length} translations to pt-BR/${file}`);
        } catch (err) {
          console.error(`  Translation failed: ${err.message}`);
        }
      }
    }
  }

  const coverage = totalKeys > 0
    ? Math.round(((totalKeys - totalMissing) / totalKeys) * 100)
    : 100;

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Total: ${totalKeys} keys, ${totalMissing} missing, ${coverage}% coverage`);
  if (totalMissing > 0 && !shouldTranslate) {
    console.log(`Run with --translate to auto-translate missing keys.`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
