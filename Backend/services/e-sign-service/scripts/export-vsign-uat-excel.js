/**
 * Export completed VSign UAT transactions to Verasys Excel format (Sr No, DATE, TXN ID).
 * Uses Node for MongoDB; invokes Python openpyxl for .xlsx write.
 *
 * Usage:
 *   node scripts/export-vsign-uat-excel.js
 *   node scripts/export-vsign-uat-excel.js --out "C:/Users/DELL/Desktop/50 eSign Transaction Format.xlsx"
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const mongoose = require('mongoose');
const SignatureTransaction = require('../models/signatureTransactions');

function parseArgs() {
  const args = process.argv.slice(2);
  let out = 'C:\\Users\\DELL\\Desktop\\50 eSign Transaction Format.xlsx';
  let limit = 50;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--out' && args[i + 1]) {
      out = args[i + 1];
      i += 1;
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = Number(args[i + 1]);
      i += 1;
    }
  }
  return { out: path.resolve(out), limit };
}

async function main() {
  const { out, limit } = parseArgs();
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/draftnsign';
  await mongoose.connect(mongoUri);

  const all = await SignatureTransaction.find({}).sort({ txn: 1 }).lean();
  const completed = [];

  for (const t of all) {
    if (t.signedFilePath && fs.existsSync(t.signedFilePath)) {
      const created = t._id.getTimestamp();
      completed.push({
        txn: String(t.txn),
        date: created.toISOString(),
      });
    }
    if (completed.length >= limit) break;
  }

  await mongoose.disconnect();

  const tmpJson = path.join(__dirname, `.vsign-excel-export-${Date.now()}.json`);
  fs.writeFileSync(tmpJson, JSON.stringify({ out, rows: completed, targetRows: 50 }));

  const py = `
import json, sys
from pathlib import Path
from datetime import datetime
from openpyxl import load_workbook, Workbook

data = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
out = Path(data['out'])
rows = data['rows']
target = data.get('targetRows', 50)

if out.exists():
    wb = load_workbook(out)
    ws = wb.active
else:
    wb = Workbook()
    ws = wb.active
    ws.title = 'Sheet1'
    ws.cell(1, 1, 'Sr. No.')
    ws.cell(1, 2, 'DATE')
    ws.cell(1, 3, 'TXN ID')

for i in range(target):
    r = i + 2
    ws.cell(r, 1, i + 1)
    if i < len(rows):
        dt = datetime.fromisoformat(rows[i]['date'].replace('Z', '+00:00')).replace(tzinfo=None)
        ws.cell(r, 2, dt)
        txn = rows[i]['txn']
        ws.cell(r, 3, int(txn) if str(txn).isdigit() else txn)
    else:
        ws.cell(r, 2, None)
        ws.cell(r, 3, None)

wb.save(out)
print(f'Wrote {len(rows)} completed txns to {out}')
`;

  const pyFile = path.join(__dirname, `.vsign-excel-write-${Date.now()}.py`);
  fs.writeFileSync(pyFile, py);
  const result = spawnSync('python', [pyFile, tmpJson], { encoding: 'utf-8' });
  fs.unlinkSync(tmpJson);
  fs.unlinkSync(pyFile);

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }

  console.log(result.stdout.trim());
  console.log(`Genuine completed: ${completed.length} / 50`);
  completed.forEach((r, i) => console.log(`  ${i + 1}. ${r.txn}`));
  if (completed.length < 50) {
    console.log(`\nRemaining: ${50 - completed.length} — each needs real Aadhaar OTP on esignuat.vsign.in`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
