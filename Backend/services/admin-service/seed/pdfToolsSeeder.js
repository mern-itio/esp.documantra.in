require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { connectDB } = require('../config/db');
const PDFTool = require('../models/PDFTool');

// Seed list: derive names from ids by title-casing dashes
const toolIds = [
  'pdf-to-word','word-to-pdf','pdf-to-excel','excel-to-pdf','pdf-to-powerpoint','powerpoint-to-pdf','pdf-to-img','img-to-pdf','pdf-to-text','text-to-pdf','pdf-to-html','html-to-pdf','pdf-to-epub','batch-conversion','smart-conversion',
  'pdf-editor','add-text','add-images','add-shapes','highlight-text','add-comments','draw-annotations','redact-content','add-stamps','find-replace','spell-check','edit-metadata',
  'merge-pdf','split-pdf','extract-pdf','delete-pdf','reorder-pdf','rotate-pdf','crop-pdf','insert-pdf','add-page-numbers','add-header-footer',
  'add-password','remove-password','digital-signature','set-permissions','add-watermark','remove-metadata','document-tracking',
  'compress-pdf','optimize-image','optimize-font','remove-unused-objects','linearize-pdf','color-optimization','quality-analysis','batch-optimization',
  'ocr','make-searchable','extract-tables','handwriting-recognition',
  'create-form','fill-form','form-recognition','calculate-fields',
  'pdf-info','pdf-validator','pdf-compare','pdf-repair','pdf-bookmarks','pdf-statistics'
];

const toName = (id) => id
  .split('-')
  .map((w) => w.length ? w[0].toUpperCase() + w.slice(1) : w)
  .join(' ');

function buildMetaFromMock() {
  try {
    const mockPath = path.resolve(__dirname, '../../../../Frontend/src/data/pdfMockData.ts');
    const content = fs.readFileSync(mockPath, 'utf8');
    const map = new Map();
    // Capture category, id, name, description
    const categoryBlocks = content.split(/\n\s*[a-zA-Z]+:\s*\{\s*category:\s*"([^"]+)"[\s\S]*?tools:\s*\[/g);
    // Fallback: regex per tool with optional category field
    const regex = /\{[^{}]*?id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?description:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"[\s\S]*?\}/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      const id = m[1];
      const name = m[2];
      const description = m[3];
      const category = m[4];
      map.set(id, { name, description, category });
    }
    return map;
  } catch {
    return new Map();
  }
}

async function run() {
  try {
    await connectDB();
    const meta = buildMetaFromMock();
    const ops = toolIds.map(async (id, idx) => {
      const fallbackName = toName(id);
      const fromMock = meta.get(id);
      const name = fromMock?.name || fallbackName;
      const description = fromMock?.description || '';
      const category = fromMock?.category || 'general';
      const priority = idx; // order from toolIds list
      await PDFTool.updateOne({ id }, { $set: { name, description, category, priority } }, { upsert: true });
    });
    await Promise.all(ops);
    console.log(`Seeded/updated ${toolIds.length} PDF tools.`);
  } catch (e) {
    console.error('Seeder failed:', e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();


