#!/usr/bin/env node
/**
 * 설교 보관함 잠그기
 *
 *   sermons-archive.json  →  sermons-archive.enc  (암호로 잠근 파일)
 *
 * 암호는 ARCHIVE_PASSPHRASE 환경변수로 받는다. 어디에도 저장하지 않는다.
 * 잠근 뒤에는 원본(sermons-archive.json)을 지운다 — 홈페이지에 그대로 두면
 * 주소만 알면 누구나 읽을 수 있기 때문이다.
 *
 *   ARCHIVE_PASSPHRASE='...' node scripts/lock-archive.js
 *   ARCHIVE_PASSPHRASE='...' node scripts/lock-archive.js --keep   (원본 남김)
 *
 * 잠근 파일은 vault.html 에서 같은 암호를 넣으면 브라우저가 풀어서 보여준다.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'sermons-archive.json');
const OUT = path.join(ROOT, 'sermons-archive.enc');

// vault.html 의 풀이 방식과 반드시 같아야 한다.
const ITER = 250000;
const KEYLEN = 32; // AES-256
const DIGEST = 'sha256';

function fail(msg) {
  console.error('✗ ' + msg);
  process.exit(1);
}

const pass = process.env.ARCHIVE_PASSPHRASE;
if (!pass || pass.length < 6) {
  fail('ARCHIVE_PASSPHRASE 가 없습니다(6자 이상). 예: ARCHIVE_PASSPHRASE=\'...\' node scripts/lock-archive.js');
}
if (!fs.existsSync(SRC)) {
  if (fs.existsSync(OUT)) {
    console.log('이미 잠겨 있습니다 — sermons-archive.json 이 없고 sermons-archive.enc 만 있습니다.');
    process.exit(0);
  }
  fail('sermons-archive.json 을 찾지 못했습니다.');
}

const raw = fs.readFileSync(SRC, 'utf8');
let db;
try { db = JSON.parse(raw); } catch (e) { fail('sermons-archive.json 을 읽지 못했습니다: ' + e.message); }
const count = Array.isArray(db.sermons) ? db.sermons.length : 0;

const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(Buffer.from(pass, 'utf8'), salt, ITER, KEYLEN, DIGEST);

const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const body = Buffer.concat([cipher.update(Buffer.from(raw, 'utf8')), cipher.final()]);
// WebCrypto 의 AES-GCM 은 본문 뒤에 인증표(16바이트)가 붙어 있는 형태를 쓴다.
const ct = Buffer.concat([body, cipher.getAuthTag()]);

fs.writeFileSync(OUT, JSON.stringify({
  v: 1,
  alg: 'AES-GCM',
  kdf: 'PBKDF2-SHA256',
  iter: ITER,
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  ct: ct.toString('base64'),
  count,
  lockedAt: new Date().toISOString().slice(0, 10),
}, null, 2) + '\n');

if (process.argv.includes('--keep')) {
  console.log('원본을 남겨 둡니다 (--keep). 홈페이지에 올리면 누구나 읽을 수 있으니 주의하세요.');
} else {
  fs.unlinkSync(SRC);
}

console.log('✓ 설교 보관함 ' + count + '편을 잠갔습니다 → sermons-archive.enc');
console.log('  vault.html 에서 같은 암호를 넣으면 열립니다.');
