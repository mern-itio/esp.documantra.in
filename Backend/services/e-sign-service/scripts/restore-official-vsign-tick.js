/** Restore official ASP kit tick (transparent + green check only — utility adds light-blue box). */
const fs = require('fs');
const path = require('path');

const utility = path.join(__dirname, '..', 'utility');
const src = path.join(utility, 'tick-official-src.png');
const kit = path.join(
  'C:',
  'Users',
  'DELL',
  'Desktop',
  'ASP eSign 2.1_ITIO Innovex Private Limited(UAT)_17-Feb-26',
  'ASP eSign 2.1_ITIO Innovex Private Limited(UAT)_17-Feb-26',
  'UAT',
  'tick.png',
);

let source = src;
if (!fs.existsSync(source) && fs.existsSync(kit)) source = kit;
if (!fs.existsSync(source)) {
  console.error('Official tick source not found:', src);
  process.exit(1);
}

for (const dest of [
  path.join(utility, 'tick.png'),
  path.join(__dirname, '..', 'uploads', 'vSign', 'tick.png'),
]) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
  console.log('Restored', dest, fs.statSync(dest).size, 'bytes');
}
