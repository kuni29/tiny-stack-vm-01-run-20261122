// Tiny Stack VM: faithful interpreter of make.fun's tiny stack ISA v1
// (kit: generator/subject/ISA.md; reference VM generator/subject/vm.mjs).
// A/B: per-opcode tables (index = opcode byte). A: hex digit = pops*4+pushes.
// B: immediate length in bytes. Runs /input/<id>/, writes /output/<id>/.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input', O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const A = '01146abf0000000099999995999599909990000000000000044000000000000058000000000000004414';
const B = '014000000000000000000000000000000000000000000000222200000000000000000000000000000000';
function run(p, q) {
  const D = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256), o = new Uint8Array(65536), n = p.length;
  let s = 0, c = 0, i = 0, x = 0, t = 0, l = 0;
  for (;;) {
    if (t === 1e6) return { o, l, e: 10 };
    if (x < 0 || x >= n) return { o, l, e: 9 };
    const b = p[x];
    if (!(b < 8 || (b > 15 && b < 35 && b !== 31) || (b > 47 && b < 53) || (b > 63 && b < 66) || (b > 79 && b < 84))) return { o, l, e: 5 };
    const v = parseInt(A[b], 16), im = +B[b];
    if (x + im >= n) return { o, l, e: 9 };
    t++;
    const y = x + 1 + im;
    if (s < (v >> 2)) return { o, l, e: 2 };
    if (s - (v >> 2) + (v & 3) > 256) return { o, l, e: 3 };
    x = y;
    switch (b) {
      case 0: return { o, l, e: 0 };
      case 1: D[s++] = (p[y - 1] << 24) >> 24; break;
      case 2: D[s++] = p[y - 4] | (p[y - 3] << 8) | (p[y - 2] << 16) | (p[y - 1] << 24); break;
      case 3: s--; break;
      case 4: D[s] = D[s - 1]; s++; break;
      case 5: { const g = D[s - 1]; D[s - 1] = D[s - 2]; D[s - 2] = g; break; }
      case 6: D[s] = D[s - 2]; s++; break;
      case 7: { const g = D[s - 3]; D[s - 3] = D[s - 2]; D[s - 2] = D[s - 1]; D[s - 1] = g; break; }
      case 0x17: D[s - 1] = -D[s - 1] | 0; break;
      case 0x1b: D[s - 1] = ~D[s - 1]; break;
      case 0x30: case 0x31: case 0x32: {
        const r = ((p[y - 2] | (p[y - 1] << 8)) << 16) >> 16;
        let k = true;
        if (b !== 0x30) { const g = D[--s]; k = b === 0x31 ? g === 0 : g !== 0; }
        if (k) x = y + r;
        break;
      }
      case 0x33:
        if (c === 64) return { o, l, e: 7 };
        C[c++] = y;
        x = p[y - 2] | (p[y - 1] << 8);
        break;
      case 0x34:
        if (c === 0) return { o, l, e: 8 };
        x = C[--c];
        break;
      case 0x40: {
        const g = D[s - 1];
        if (g < 0 || g >= 256) return { o, l, e: 6 };
        D[s - 1] = M[g];
        break;
      }
      case 0x41: {
        const g = D[s - 1], h = D[s - 2];
        if (g < 0 || g >= 256) return { o, l, e: 6 };
        s -= 2;
        M[g] = h;
        break;
      }
      case 0x50: {
        const g = String(D[s - 1]);
        if (l + g.length > 65536) return { o, l, e: 11 };
        s--;
        for (let j = 0; j < g.length; j++) o[l++] = g.charCodeAt(j);
        break;
      }
      case 0x51:
        if (l + 1 > 65536) return { o, l, e: 11 };
        o[l++] = D[--s] & 255;
        break;
      case 0x52: D[s++] = i < q.length ? q[i++] : -1; break;
      case 0x53: return { o, l, e: D[--s] & 255 };
      default: {
        const h = D[s - 1], g = D[s - 2];
        let r;
        if (b === 0x10) r = (g + h) | 0;
        else if (b === 0x11) r = (g - h) | 0;
        else if (b === 0x12) r = Math.imul(g, h);
        else if (b === 0x13) {
          if (h === 0) return { o, l, e: 4 };
          r = g === -2147483648 && h === -1 ? g : (g / h) | 0;
        } else if (b === 0x14) {
          if (h === 0) return { o, l, e: 4 };
          r = h === -1 ? 0 : (g % h) | 0;
        } else if (b === 0x15) {
          if (h === 0) return { o, l, e: 4 };
          r = Math.floor((g >>> 0) / (h >>> 0)) | 0;
        } else if (b === 0x16) {
          if (h === 0) return { o, l, e: 4 };
          r = ((g >>> 0) % (h >>> 0)) | 0;
        } else if (b === 0x18) r = g & h;
        else if (b === 0x19) r = g | h;
        else if (b === 0x1a) r = g ^ h;
        else if (b === 0x1c) r = g << (h & 31);
        else if (b === 0x1d) r = g >> (h & 31);
        else if (b === 0x1e) r = (g >>> (h & 31)) | 0;
        else if (b === 0x20) r = g === h ? 1 : 0;
        else if (b === 0x21) r = g < h ? 1 : 0;
        else r = (g >>> 0) < (h >>> 0) ? 1 : 0;
        s -= 2;
        D[s++] = r;
        break;
      }
    }
  }
}
for (const id of readdirSync(I).sort()) {
  const r = run(new Uint8Array(readFileSync(join(I, id, 'program.bin'))), new Uint8Array(readFileSync(join(I, id, 'input.bin'))));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), r.o.subarray(0, r.l));
  writeFileSync(join(O, id, 'exit.txt'), `${r.e}\n`);
}
