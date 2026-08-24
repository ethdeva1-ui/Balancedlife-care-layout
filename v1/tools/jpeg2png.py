#!/usr/bin/env python3
"""Pure-stdlib baseline-JPEG decoder + PNG encoder.

Written because this environment has no Pillow/ImageMagick. Handles the
baseline sequential DCT subset (SOF0) with Huffman coding and arbitrary
chroma subsampling -- which is all the source logo needs.
"""
import struct, zlib, math

ZIGZAG = [
     0, 1, 8,16, 9, 2, 3,10,17,24,32,25,18,11, 4, 5,
    12,19,26,33,40,48,41,34,27,20,13, 6, 7,14,21,28,
    35,42,49,56,57,50,43,36,29,22,15,23,30,37,44,51,
    58,59,52,45,38,31,39,46,53,60,61,54,47,55,62,63]

# separable IDCT basis
COS = [[math.cos((2*x+1)*u*math.pi/16) * (math.sqrt(0.5) if u == 0 else 1.0)
        for u in range(8)] for x in range(8)]


class Huff:
    def __init__(self, counts, symbols):
        self.lookup = {}
        code = 0; k = 0
        for length in range(1, 17):
            for _ in range(counts[length-1]):
                self.lookup[(length, code)] = symbols[k]
                code += 1; k += 1
            code <<= 1


class BitReader:
    def __init__(self, data):
        self.d = data; self.p = 0; self.b = 0; self.n = 0

    def bit(self):
        if self.n == 0:
            if self.p >= len(self.d):
                return 0
            byte = self.d[self.p]; self.p += 1
            if byte == 0xFF:
                nxt = self.d[self.p] if self.p < len(self.d) else 0
                if nxt == 0x00:
                    self.p += 1
                elif 0xD0 <= nxt <= 0xD7:
                    pass
                else:
                    return 0
            self.b = byte; self.n = 8
        self.n -= 1
        return (self.b >> self.n) & 1

    def bits(self, count):
        v = 0
        for _ in range(count):
            v = (v << 1) | self.bit()
        return v

    def decode(self, table):
        code = 0
        for length in range(1, 17):
            code = (code << 1) | self.bit()
            s = table.lookup.get((length, code))
            if s is not None:
                return s
        raise ValueError("bad huffman code")

    def align_restart(self):
        self.n = 0
        while self.p + 1 < len(self.d):
            if self.d[self.p] == 0xFF and 0xD0 <= self.d[self.p+1] <= 0xD7:
                self.p += 2
                return
            self.p += 1


def extend(v, t):
    return v - (1 << t) + 1 if t and v < (1 << (t-1)) else v


def idct(block):
    tmp = [0.0]*64
    for y in range(8):
        row = block[y*8:y*8+8]
        if not any(row[1:]):
            val = row[0] * 0.5
            for x in range(8):
                tmp[y*8+x] = val
        else:
            cy = COS
            for x in range(8):
                cx = cy[x]
                tmp[y*8+x] = 0.5*sum(row[u]*cx[u] for u in range(8))
    out = [0]*64
    for x in range(8):
        col = [tmp[y*8+x] for y in range(8)]
        for y in range(8):
            cy = COS[y]
            s = 0.5*sum(col[v]*cy[v] for v in range(8))
            out[y*8+x] = s
    return out


def decode_jpeg(path):
    data = open(path, 'rb').read()
    qt = {}; hdc = {}; hac = {}; comps = []; W = H = 0; restart = 0
    i = 2
    while i < len(data):
        if data[i] != 0xFF:
            i += 1; continue
        m = data[i+1]; i += 2
        if m in (0xD8, 0x01) or 0xD0 <= m <= 0xD7:
            continue
        ln = struct.unpack('>H', data[i:i+2])[0]
        seg = data[i+2:i+ln]
        if m == 0xDB:                                   # quant tables
            p = 0
            while p < len(seg):
                pq, tq = seg[p] >> 4, seg[p] & 15; p += 1
                n = 64*(2 if pq else 1)
                vals = (list(struct.unpack('>64H', seg[p:p+128])) if pq
                        else list(seg[p:p+64]))
                qt[tq] = vals; p += n
        elif m == 0xC4:                                 # huffman tables
            p = 0
            while p < len(seg):
                tc, th = seg[p] >> 4, seg[p] & 15; p += 1
                counts = list(seg[p:p+16]); p += 16
                total = sum(counts)
                syms = list(seg[p:p+total]); p += total
                (hac if tc else hdc)[th] = Huff(counts, syms)
        elif m == 0xC0:                                 # baseline SOF
            H, W = struct.unpack('>HH', seg[1:5])
            for c in range(seg[5]):
                cid, hv, tq = seg[6+c*3], seg[7+c*3], seg[8+c*3]
                comps.append({'id': cid, 'h': hv >> 4, 'v': hv & 15, 'q': tq})
        elif m in (0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB):
            raise SystemExit("unsupported JPEG mode 0x%02X (not baseline)" % m)
        elif m == 0xDD:
            restart = struct.unpack('>H', seg[0:2])[0]
        elif m == 0xDA:                                 # start of scan
            ns = seg[0]
            for c in range(ns):
                cid, tt = seg[1+c*2], seg[2+c*2]
                for comp in comps:
                    if comp['id'] == cid:
                        comp['dc'] = tt >> 4; comp['ac'] = tt & 15
            scan = data[i+ln:]
            return _scan(scan, comps, qt, hdc, hac, W, H, restart)
        i += ln
    raise SystemExit("no scan found")


def _scan(scan, comps, qt, hdc, hac, W, H, restart):
    hmax = max(c['h'] for c in comps); vmax = max(c['v'] for c in comps)
    mcux = (W + 8*hmax - 1)//(8*hmax); mcuy = (H + 8*vmax - 1)//(8*vmax)
    for c in comps:
        c['bw'] = mcux*c['h']*8; c['bh'] = mcuy*c['v']*8
        c['px'] = [0]*(c['bw']*c['bh']); c['pred'] = 0
    br = BitReader(scan); n = 0
    for my in range(mcuy):
        for mx in range(mcux):
            if restart and n and n % restart == 0:
                br.align_restart()
                for c in comps:
                    c['pred'] = 0
            n += 1
            for c in comps:
                q = qt[c['q']]
                for by in range(c['v']):
                    for bx in range(c['h']):
                        blk = [0.0]*64
                        t = br.decode(hdc[c['dc']])
                        diff = extend(br.bits(t), t) if t else 0
                        c['pred'] += diff
                        blk[0] = c['pred']*q[0]
                        k = 1
                        while k < 64:
                            rs = br.decode(hac[c['ac']])
                            r, s = rs >> 4, rs & 15
                            if s == 0:
                                if r == 15:
                                    k += 16; continue
                                break
                            k += r
                            if k > 63:
                                break
                            blk[ZIGZAG[k]] = extend(br.bits(s), s)*q[k]
                            k += 1
                        out = idct(blk)
                        ox = (mx*c['h']+bx)*8; oy = (my*c['v']+by)*8
                        for yy in range(8):
                            base = (oy+yy)*c['bw']+ox
                            for xx in range(8):
                                v = int(out[yy*8+xx] + 128.5)
                                c['px'][base+xx] = 0 if v < 0 else (255 if v > 255 else v)
    # upsample + YCbCr -> RGB
    rgb = bytearray(W*H*3)
    Y, Cb, Cr = comps[0], comps[1], comps[2]
    for y in range(H):
        for x in range(W):
            yy = Y['px'][(y*Y['v']//vmax)*Y['bw'] + (x*Y['h']//hmax)]
            cb = Cb['px'][(y*Cb['v']//vmax)*Cb['bw'] + (x*Cb['h']//hmax)] - 128
            cr = Cr['px'][(y*Cr['v']//vmax)*Cr['bw'] + (x*Cr['h']//hmax)] - 128
            r = yy + 1.402*cr
            g = yy - 0.344136*cb - 0.714136*cr
            b = yy + 1.772*cb
            o = (y*W+x)*3
            rgb[o]   = 0 if r < 0 else (255 if r > 255 else int(r))
            rgb[o+1] = 0 if g < 0 else (255 if g > 255 else int(g))
            rgb[o+2] = 0 if b < 0 else (255 if b > 255 else int(b))
    return W, H, rgb


def write_png(path, w, h, rgba):
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        raw += rgba[y*w*4:(y+1)*w*4]

    def chunk(tag, payload):
        return (struct.pack('>I', len(payload)) + tag + payload +
                struct.pack('>I', zlib.crc32(tag + payload) & 0xFFFFFFFF))

    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
           + chunk(b'IEND', b''))
    open(path, 'wb').write(png)
    return len(png)
