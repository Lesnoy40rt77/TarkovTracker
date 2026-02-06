#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import JSON5 from 'json5';

const LOCALES_DIR = join(process.cwd(), 'app', 'locales');
const SOURCE_LOCALE = 'en';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function alignWithSource(sourceValue, targetValue) {
  if (isObject(sourceValue)) {
    const sourceObject = sourceValue;
    const targetObject = isObject(targetValue) ? targetValue : {};
    const aligned = {};

    for (const key of Object.keys(sourceObject)) {
      aligned[key] = alignWithSource(sourceObject[key], targetObject[key]);
    }

    return aligned;
  }

  if (targetValue === undefined) {
    return sourceValue;
  }

  if (isObject(targetValue) || Array.isArray(targetValue)) {
    return sourceValue;
  }

  return targetValue;
}

function readLocaleRaw(code) {
  const filePath = join(LOCALES_DIR, `${code}.json5`);
  return readFileSync(filePath, 'utf-8');
}

function parseLocale(raw) {
  return JSON5.parse(raw);
}

function getLeadingCommentBlock(raw) {
  const match = raw.match(/^\{\n((?:\s*\/\/.*\n)+)/);
  return match?.[1] ?? '';
}

function stringifyLocale(localeObject, commentBlock) {
  const content = JSON5.stringify(localeObject, null, 2);
  if (commentBlock.length === 0) {
    return `${content}\n`;
  }
  return `${content.replace('{\n', `{\n${commentBlock}`)}\n`;
}

function countLeaves(value) {
  if (isObject(value)) {
    return Object.values(value).reduce((sum, entry) => sum + countLeaves(entry), 0);
  }
  return 1;
}

function main() {
  const localeFiles = readdirSync(LOCALES_DIR).filter((file) => file.endsWith('.json5'));
  const localeCodes = localeFiles.map((file) => file.replace('.json5', ''));

  if (!localeCodes.includes(SOURCE_LOCALE)) {
    console.error(`Source locale "${SOURCE_LOCALE}.json5" not found in ${LOCALES_DIR}`);
    process.exit(1);
  }

  const sourceRaw = readLocaleRaw(SOURCE_LOCALE);
  const sourceLocale = parseLocale(sourceRaw);
  const sourceLeafCount = countLeaves(sourceLocale);
  const targetCodes = localeCodes.filter((code) => code !== SOURCE_LOCALE).sort();

  for (const code of targetCodes) {
    const targetRaw = readLocaleRaw(code);
    const targetLocale = parseLocale(targetRaw);
    const aligned = alignWithSource(sourceLocale, targetLocale);
    const commentBlock = getLeadingCommentBlock(targetRaw);
    const nextContent = stringifyLocale(aligned, commentBlock);
    writeFileSync(join(LOCALES_DIR, `${code}.json5`), nextContent, 'utf-8');
  }

  console.log(`Synced ${targetCodes.length} locale(s) to ${SOURCE_LOCALE}.json5 structure (${sourceLeafCount} keys).`);
}

main();
