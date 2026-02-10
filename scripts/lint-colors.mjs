#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
const SEMANTIC_PALETTES = [
  'primary',
  'secondary',
  'accent',
  'surface',
  'success',
  'warning',
  'error',
  'info',
  'pvp',
  'pve',
  'kappa',
  'lightkeeper',
  'brand',
  'rarity-common',
  'rarity-uncommon',
  'rarity-rare',
  'rarity-epic',
  'rarity-legendary',
  'extract-pmc',
  'extract-scav',
  'extract-shared-primary',
  'extract-shared-secondary',
  'extract-shared-coop',
];
const RAW_PALETTES = [
  'gray',
  'red',
  'blue',
  'green',
  'yellow',
  'orange',
  'purple',
  'pink',
  'slate',
  'stone',
  'zinc',
  'neutral',
  'cyan',
  'amber',
  'emerald',
  'teal',
  'indigo',
  'violet',
  'fuchsia',
  'rose',
  'lime',
  'sky',
  'gold',
];
const COLOR_UTILITIES = ['ring-offset', 'text', 'bg', 'border', 'ring', 'from', 'to', 'via'];
const allColorPattern = new RegExp(
  `\\b(${COLOR_UTILITIES.join('|')})-((?:[a-z]+(?:-[a-z]+)*))-(\\d{2,3})\\b`,
  'g'
);
const ALLOWED_PALETTES = [
  ...SEMANTIC_PALETTES,
  'white',
  'black',
  'transparent',
  'current',
  'inherit',
  'opacity',
];
function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}
function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const violations = [];
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const matches = line.matchAll(allColorPattern);
    for (const match of matches) {
      const palette = match[2];
      if (!ALLOWED_PALETTES.includes(palette)) {
        let type = 'unknown-palette';
        if (RAW_PALETTES.includes(palette)) {
          type = 'raw-palette';
        }
        violations.push({
          file: filePath,
          line: idx + 1,
          match: match[0],
          utility: match[1],
          palette: match[2],
          shade: match[3],
          type,
        });
      }
    }
  });
  return violations;
}
function main() {
  const appDir = join(process.cwd(), 'app');
  const baselineFile = join(process.cwd(), '.color-lint-baseline');
  let baseline = null;
  if (!existsSync(appDir)) {
    console.error('Error: app/ directory not found');
    process.exit(1);
  }
  try {
    const baselineValue = parseInt(readFileSync(baselineFile, 'utf-8').trim(), 10);
    baseline = Number.isNaN(baselineValue) ? null : baselineValue;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  console.log('🎨 Scanning for raw palette color usage...\n');
  const allFiles = getAllFiles(appDir);
  let allViolations = [];
  allFiles.forEach((file) => {
    const violations = scanFile(file);
    allViolations = allViolations.concat(violations);
  });
  const violationsByFile = {};
  allViolations.forEach((v) => {
    const relPath = relative(process.cwd(), v.file);
    if (!violationsByFile[relPath]) {
      violationsByFile[relPath] = [];
    }
    violationsByFile[relPath].push(v);
  });
  if (allViolations.length === 0) {
    console.log('✅ No raw palette violations found!\n');
    if (baseline !== null) {
      writeFileSync(baselineFile, '0');
    }
    process.exit(0);
  }
  console.log(`Found ${allViolations.length} raw palette violations:\n`);
  Object.keys(violationsByFile)
    .sort()
    .forEach((file) => {
      console.log(`  ${file}:`);
      violationsByFile[file].forEach((v) => {
        console.log(`    Line ${v.line}: ${v.match}`);
      });
      console.log('');
    });
  if (baseline !== null) {
    console.log(`📊 Baseline: ${baseline} violations`);
    console.log(`📊 Current:  ${allViolations.length} violations\n`);
    if (allViolations.length > baseline) {
      console.error(`❌ FAILED: ${allViolations.length - baseline} new violations introduced!\n`);
      console.error('Please use semantic color tokens instead of raw palettes.');
      console.error('See docs/theme-exceptions.md for guidelines.\n');
      process.exit(1);
    } else if (allViolations.length < baseline) {
      console.log(`✨ Good work! ${baseline - allViolations.length} violations fixed.\n`);
      console.log('Updating baseline...');
      writeFileSync(baselineFile, allViolations.length.toString());
    } else {
      console.log('✅ No new violations (baseline unchanged)\n');
    }
  } else {
    console.log('📝 No baseline found. Creating baseline file...\n');
    writeFileSync(baselineFile, allViolations.length.toString());
    console.log(`✅ Baseline set to ${allViolations.length} violations\n`);
    console.log('Run this script again after fixing violations to update the baseline.\n');
  }
  process.exit(0);
}
main();
