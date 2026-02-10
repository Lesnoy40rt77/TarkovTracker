#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

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

function migrateFile(filePath, replacements) {
  let content = readFileSync(filePath, 'utf-8');
  const original = content;
  let changeCount = 0;

  replacements.forEach(([pattern, replacement]) => {
    const regex = new RegExp(pattern, 'g');
    const matches = content.match(regex);
    if (matches) {
      changeCount += matches.length;
      content = content.replace(regex, replacement);
    }
  });

  if (content !== original) {
    writeFileSync(filePath, content, 'utf-8');
    return changeCount;
  }

  return 0;
}

function main() {
  const stage = process.argv[2];

  if (!stage) {
    console.log('Usage: node migrate-colors.mjs <stage>');
    console.log('Stages: text-gray, bg-gray, red');
    process.exit(1);
  }

  const appDir = join(process.cwd(), 'app');
  const allFiles = getAllFiles(appDir);

  let replacements = [];
  let stageName = '';

  if (stage === 'text-gray') {
    stageName = 'text-gray-* → text-surface-*';
    for (let i = 50; i <= 950; i += 50) {
      replacements.push([`text-gray-${i}`, `text-surface-${i}`]);
    }
  } else if (stage === 'bg-gray') {
    stageName = 'bg-gray-* → bg-surface-*';
    for (let i = 50; i <= 950; i += 50) {
      replacements.push([`bg-gray-${i}`, `bg-surface-${i}`]);
    }
    replacements.push(['border-gray-', 'border-surface-']);
    replacements.push(['ring-gray-', 'ring-surface-']);
  } else if (stage === 'red') {
    stageName = '*-red-* → *-error-*';
    for (let i = 50; i <= 950; i += 50) {
      replacements.push([`text-red-${i}`, `text-error-${i}`]);
      replacements.push([`bg-red-${i}`, `bg-error-${i}`]);
      replacements.push([`border-red-${i}`, `border-error-${i}`]);
      replacements.push([`ring-red-${i}`, `ring-error-${i}`]);
      replacements.push([`from-red-${i}`, `from-error-${i}`]);
      replacements.push([`to-red-${i}`, `to-error-${i}`]);
      replacements.push([`via-red-${i}`, `via-error-${i}`]);
    }
  } else {
    console.error('Unknown stage:', stage);
    process.exit(1);
  }

  console.log(`🔄 Migrating ${stageName}...\n`);

  let totalChanges = 0;
  const changedFiles = [];

  allFiles.forEach((file) => {
    const changes = migrateFile(file, replacements);
    if (changes > 0) {
      totalChanges += changes;
      changedFiles.push({ file: file.replace(process.cwd() + '/', ''), changes });
    }
  });

  if (totalChanges === 0) {
    console.log('✅ No changes needed!\n');
  } else {
    console.log(`✅ Migrated ${totalChanges} instances across ${changedFiles.length} files:\n`);
    changedFiles.forEach(({ file, changes }) => {
      console.log(`  ${file}: ${changes} changes`);
    });
    console.log('');
  }

  process.exit(0);
}

main();
