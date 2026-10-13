// Checksum validation for donation addresses, so a mistyped address is never shown to donors.
import { sha256 } from '@noble/hashes/sha256';
import { keccak_256 } from '@noble/hashes/sha3';

const B32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Polymod(values: number[]): number {
  const G = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >>> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >>> i) & 1) chk ^= G[i];
  }
  return chk >>> 0;
}

function isBech32Btc(addr: string): boolean {
  const a = addr.toLowerCase();
  if (addr !== a && addr !== addr.toUpperCase()) return false;
  const pos = a.lastIndexOf('1');
  if (a.slice(0, pos) !== 'bc' || a.length < 14 || a.length > 74) return false;
  const data: number[] = [];
  for (const ch of a.slice(pos + 1)) { const d = B32.indexOf(ch); if (d < 0) return false; data.push(d); }
  const hrp = [...'bc'].map(c => c.charCodeAt(0) >> 5).concat([0], [...'bc'].map(c => c.charCodeAt(0) & 31));
  const pm = bech32Polymod(hrp.concat(data));
  const witVer = data[0];
  return (witVer === 0 && pm === 1) || (witVer >= 1 && witVer <= 16 && pm === 0x2bc830a3);
}

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function isBase58Btc(addr: string): boolean {
  if (!/^[13]/.test(addr)) return false;
  let n = 0n;
  for (const ch of addr) { const d = B58.indexOf(ch); if (d < 0) return false; n = n * 58n + BigInt(d); }
  const bytes: number[] = [];
  while (n > 0n) { bytes.unshift(Number(n & 0xffn)); n >>= 8n; }
  for (const ch of addr) { if (ch === '1') bytes.unshift(0); else break; }
  if (bytes.length !== 25) return false;
  const body = Uint8Array.from(bytes.slice(0, 21));
  const check = sha256(sha256(body));
  return bytes.slice(21).every((b, i) => b === check[i]);
}

export function isValidBtc(addr: string): boolean {
  return /^bc1/i.test(addr) ? isBech32Btc(addr) : isBase58Btc(addr);
}

export function isValidEth(addr: string): boolean {
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return false;
  const hex = addr.slice(2);
  if (hex === hex.toLowerCase() || hex === hex.toUpperCase()) return true; // no checksum to verify
  const hash = keccak_256(new TextEncoder().encode(hex.toLowerCase()));
  for (let i = 0; i < 40; i++) {
    const nibble = (hash[i >> 1] >> (i % 2 ? 0 : 4)) & 0xf;
    const c = hex[i];
    if (/[a-f]/i.test(c) && (nibble >= 8 ? c !== c.toUpperCase() : c !== c.toLowerCase())) return false;
  }
  return true;
}
