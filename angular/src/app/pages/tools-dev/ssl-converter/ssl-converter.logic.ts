import { KEYUTIL, X509, KJUR, ASN1HEX } from 'jsrsasign';

/* =========================================================================
 * SSL Converter — pure detection / conversion / metadata logic.
 * No Angular imports. All jsrsasign access is `any` (declared module shim),
 * so calls compile without type errors; every call is wrapped in try/catch.
 * ========================================================================= */

export enum Encoding { PEM = 'PEM', BASE64_DER = 'BASE64_DER', BINARY_DER = 'BINARY_DER', UNKNOWN = 'UNKNOWN' }

export enum SslType {
  CERT = 'CERT',
  PRV_PKCS1 = 'PRV_PKCS1',
  PRV_PKCS5 = 'PRV_PKCS5',
  PRV_PKCS8 = 'PRV_PKCS8',
  PUB_KEY = 'PUB_KEY',
  CSR = 'CSR',
  P7B = 'P7B',
  CRL = 'CRL',
  PKCS12 = 'PKCS12',
  JKS = 'JKS',
  UNKNOWN = 'UNKNOWN',
}

export enum OutputFormat {
  PEM = 'PEM',
  DER = 'DER',
  PKCS1PRV = 'PKCS1PRV',
  PKCS8PRV = 'PKCS8PRV',
  JWK = 'JWK',
  PEM_CHAIN = 'PEM_CHAIN',
  OPENSSL_CMD = 'OPENSSL_CMD',
  KEYTOOL_CMD = 'KEYTOOL_CMD',
}

export type KeyAlg = 'RSA' | 'EC' | 'DSA' | undefined;

export interface DetectionResult {
  type: SslType;
  encoding: Encoding;
  label: string;
  isEncrypted: boolean;
  raw: string;        // original text (PEM/base64) or base64 of binary
  bytes?: Uint8Array; // present for binary / DER inputs
  fileName?: string;
}

export interface SslMetadata {
  [k: string]: string | undefined;
  subject?: string;
  issuer?: string;
  serial?: string;
  notBefore?: string;
  notAfter?: string;
  sigAlg?: string;
  san?: string;
  keyAlg?: string;
  keySize?: string;
  verified?: string;
  // P7B chain summary (parseMetadata for SslType.P7B).
  chainCount?: string;
  subjects?: string;
}

export interface ConvertOutput {
  text?: string;
  bytes?: Uint8Array;
  mime: string;
  fileName: string;
  error?: string;
}

/* ----------------------------- base64 / PEM ----------------------------- */

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, i + chunk);
    for (let j = 0; j < sub.length; j++) bin += String.fromCharCode(sub[j]);
  }
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  let h = '';
  for (let i = 0; i < bytes.length; i++) h += bytes[i].toString(16).padStart(2, '0');
  return h;
}

export function pemFromBytes(bytes: Uint8Array, marker: string): string {
  const b64 = bytesToBase64(bytes);
  const lines = b64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${marker}-----\n${lines.join('\n')}\n-----END ${marker}-----`;
}

export function bytesFromPem(pem: string): Uint8Array {
  // Match BEGIN/END arms containing any non-dash chars (PKCS7, X509 CRL, TRUSTED CERTIFICATE...).
  // Take only the FIRST block: a paste may contain a certificate chain (several
  // CERTIFICATE blocks) and a single DER blob can't represent more than one
  // cert/key. Detection already matched the first marker; P7B is a single PKCS7
  // block, so this is safe there too. Fall back to strip-all if no clean block.
  const first = pem.match(/-----BEGIN[^-]*-----\s*([\s\S]*?)-----END[^-]*-----/);
  const b64 = (first ? first[1] : pem.replace(/-----BEGIN[^-]*-----|-----END[^-]*-----/g, '')).replace(/\s+/g, '');
  return base64ToBytes(b64);
}

function markerFor(type: SslType): string {
  switch (type) {
    case SslType.CERT: return 'CERTIFICATE';
    case SslType.CSR: return 'CERTIFICATE REQUEST';
    case SslType.PUB_KEY: return 'PUBLIC KEY';
    case SslType.CRL: return 'X509 CRL';
    case SslType.P7B: return 'PKCS7';
    default: return 'CERTIFICATE';
  }
}

function labelFor(type: SslType): string {
  switch (type) {
    case SslType.CERT: return 'X.509 Certificate';
    case SslType.PRV_PKCS1: return 'RSA Private Key (PKCS#1)';
    case SslType.PRV_PKCS8: return 'Private Key (PKCS#8)';
    case SslType.PRV_PKCS5: return 'Encrypted Private Key (PKCS#5)';
    case SslType.PUB_KEY: return 'Public Key';
    case SslType.CSR: return 'Certificate Signing Request (CSR)';
    case SslType.P7B: return 'PKCS#7 / P7B Certificate Chain';
    case SslType.CRL: return 'Certificate Revocation List (CRL)';
    case SslType.PKCS12: return 'PKCS#12 / PFX Keystore';
    case SslType.JKS: return 'Java Keystore (JKS)';
    default: return 'Unknown';
  }
}

/* ------------------------------- detection ------------------------------ */

const PEM_MARKER_TYPE: { re: RegExp; type: SslType; encrypted?: boolean }[] = [
  { re: /-----BEGIN TRUSTED CERTIFICATE-----/, type: SslType.CERT },
  { re: /-----BEGIN CERTIFICATE-----/, type: SslType.CERT },
  { re: /-----BEGIN RSA PRIVATE KEY-----/, type: SslType.PRV_PKCS1 },
  { re: /-----BEGIN EC PRIVATE KEY-----/, type: SslType.PRV_PKCS8 },
  { re: /-----BEGIN ENCRYPTED PRIVATE KEY-----/, type: SslType.PRV_PKCS5, encrypted: true },
  { re: /-----BEGIN PRIVATE KEY-----/, type: SslType.PRV_PKCS8 },
  { re: /-----BEGIN RSA PUBLIC KEY-----/, type: SslType.PUB_KEY },
  { re: /-----BEGIN PUBLIC KEY-----/, type: SslType.PUB_KEY },
  { re: /-----BEGIN NEW CERTIFICATE REQUEST-----/, type: SslType.CSR },
  { re: /-----BEGIN CERTIFICATE REQUEST-----/, type: SslType.CSR },
  { re: /-----BEGIN PKCS7-----/, type: SslType.P7B },
  { re: /-----BEGIN X509 CRL-----/, type: SslType.CRL },
];

function pemMarkerToType(text: string): { type: SslType; encrypted: boolean } | null {
  for (const m of PEM_MARKER_TYPE) {
    if (m.re.test(text)) return { type: m.type, encrypted: !!m.encrypted };
  }
  return null;
}

function isBase64Charset(s: string): boolean {
  return /^[A-Za-z0-9+/=\s]+$/.test(s) && s.replace(/\s/g, '').length > 0;
}

/** Cheap "this looks like an ASN.1 DER SEQUENCE" guard for the binary / base64
 *  detection paths. Matches a `0x30` (SEQUENCE) tag followed by either a
 *  short-form length (1..127 bytes — e.g. a small EC SEC1 key, ~119 B) or one of
 *  the long-form length-of-length prefixes 0x80/0x81/0x82 (certs, big RSA keys). */
function looksLikeDerSeq(b0: number, b1: number): boolean {
  return b0 === 0x30 && ((b1 > 0 && b1 < 0x80) || b1 === 0x80 || b1 === 0x81 || b1 === 0x82);
}

/** PEM markers → SslType for keys supplied without their own armor (DER / base64).
 *  Third tuple element is the algorithm the loaded key MUST report (via
 *  `k.type`) for the marker to be considered a match, or `undefined` when any
 *  algorithm is acceptable (generic PKCS#8 / SubjectPublicKeyInfo).
 *
 *  This check is required because jsrsasign's key loaders are permissive:
 *  `RSA PRIVATE KEY` happily parses a bare SEC1 EC key (returning an EC key),
 *  and `EC PRIVATE KEY` parses an RSA PKCS#1 key (returning an RSA key). Without
 *  validating `k.type` against the marker, an EC key would be misclassified as
 *  PKCS#1 (or an RSA key as PKCS#8). The generic `PRIVATE KEY` (PKCS#8) marker
 *  carries the real algorithm inside, so it accepts any type. */
const KEY_MARKERS: ReadonlyArray<[string, SslType, string | undefined]> = [
  ['EC PRIVATE KEY', SslType.PRV_PKCS8, 'EC'],
  ['PRIVATE KEY', SslType.PRV_PKCS8, undefined],
  ['RSA PRIVATE KEY', SslType.PRV_PKCS1, 'RSA'],
  ['PUBLIC KEY', SslType.PUB_KEY, undefined],
  ['RSA PUBLIC KEY', SslType.PUB_KEY, 'RSA'],
];

/** Try to classify an ASN.1 SEQUENCE (given as bytes) as cert / CSR / P7B / key / unknown. */
function classifyDer(bytes: Uint8Array): SslType {
  const pem = pemFromBytes(bytes, 'CERTIFICATE');
  try {
    const x = new X509();
    x.readCertPEM(pem);
    // Sanity gate: readCertPEM is lenient enough to swallow a bare public key
    // (SubjectPublicKeyInfo) — a real X.509 cert has validity dates, an SPKI does not.
    x.getNotAfter();
    return SslType.CERT;
  } catch { /* not a cert */ }
  try {
    (KJUR as any).asn1.csr.CSRUtil.getParam(pemFromBytes(bytes, 'CERTIFICATE REQUEST'));
    return SslType.CSR;
  } catch { /* not a csr */ }
  // PKCS#7 SignedData (P7B cert chain) — no PEM armor in DER/base64 inputs.
  try {
    const hex = bytesToHex(bytes);
    const signed = new (KJUR as any).asn1.cms.CMSParser().getCMSSignedData(hex);
    if (signed && Array.isArray(signed?.certs?.array) && signed.certs.array.length) {
      return SslType.P7B;
    }
  } catch { /* not a PKCS#7 */ }
  // Keys (PKCS#1/#8, RSA/EC) supplied as DER or base64 — no armor to match on.
  // NOTE: an *encrypted* PKCS#8 DER/base64 key stays UNKNOWN here because
  // KEYUTIL.getKey needs the passphrase to decrypt it (no password available at
  // detection time). That is intentional — the user must supply a password via
  // the UI before such a key can be classified.
  for (const [marker, type, expAlg] of KEY_MARKERS) {
    try {
      const k: any = KEYUTIL.getKey(pemFromBytes(bytes, marker));
      // Reject lenient-loader mismatches (e.g. EC PRIVATE KEY marker that
      // actually returned an RSA key, or vice-versa).
      if (expAlg && k?.type !== expAlg) continue;
      return type;
    } catch { /* try next marker */ }
  }
  return SslType.UNKNOWN;
}

export function detect(input: string | Uint8Array, fileName?: string): DetectionResult {
  const lowerName = (fileName || '').toLowerCase();

  // ----- binary path -----
  if (input instanceof Uint8Array) {
    const bytes = input;
    if (bytes.length >= 4 && bytes[0] === 0xfe && bytes[1] === 0xed && bytes[2] === 0xfe && bytes[3] === 0xed) {
      return mk(SslType.JKS, Encoding.BINARY_DER, '', bytes, fileName);
    }
    if (lowerName.endsWith('.p12') || lowerName.endsWith('.pfx')) {
      return mk(SslType.PKCS12, Encoding.BINARY_DER, '', bytes, fileName);
    }
    if (bytes.length >= 2 && looksLikeDerSeq(bytes[0], bytes[1])) {
      const type = classifyDer(bytes);
      return mk(type === SslType.UNKNOWN ? SslType.UNKNOWN : type, Encoding.BINARY_DER, '', bytes, fileName);
    }
    return mk(SslType.UNKNOWN, Encoding.BINARY_DER, '', bytes, fileName);
  }

  // ----- text path -----
  const text = input;
  const marker = pemMarkerToType(text);
  if (marker) {
    return mk(marker.type, Encoding.PEM, text, undefined, fileName, marker.encrypted);
  }
  if (isBase64Charset(text)) {
    try {
      const bytes = base64ToBytes(text.replace(/\s/g, ''));
      if (bytes.length >= 2 && looksLikeDerSeq(bytes[0], bytes[1])) {
        const type = classifyDer(bytes);
        return mk(type, Encoding.BASE64_DER, text, bytes, fileName);
      }
    } catch { /* fall through */ }
  }
  return mk(SslType.UNKNOWN, Encoding.UNKNOWN, text, undefined, fileName);
}

function mk(type: SslType, encoding: Encoding, raw: string, bytes?: Uint8Array, fileName?: string, isEncrypted = false): DetectionResult {
  return {
    type,
    encoding,
    label: labelFor(type),
    isEncrypted,
    raw: bytes ? bytesToBase64(bytes) : raw,
    bytes,
    fileName,
  };
}

/* --------------------------- key algorithm ------------------------------ */

export function resolveKeyAlg(d: DetectionResult, password?: string): KeyAlg {
  if (![SslType.PRV_PKCS1, SslType.PRV_PKCS8, SslType.PRV_PKCS5, SslType.PUB_KEY].includes(d.type)) return undefined;
  try {
    const k: any = loadKey(d, password);
    return (k as any).type as KeyAlg;
  } catch {
    return undefined;
  }
}

/** jsrsasign getKey wants a PEM string; rebuild one from any encoding. */
function pemForJsrsasign(d: DetectionResult): string {
  if (d.encoding === Encoding.PEM) return d.raw;
  if (d.bytes) return pemFromBytes(d.bytes, 'PRIVATE KEY');
  if (d.encoding === Encoding.BASE64_DER) {
    try { return pemFromBytes(base64ToBytes(d.raw.replace(/\s/g, '')), 'PRIVATE KEY'); } catch { return d.raw; }
  }
  return d.raw;
}

function rsaBitLen(k: any): number {
  try {
    const n = k?.n;
    if (n == null) return 0;
    // jsrsasign exposes modulus as a jsbn BigInteger (.n), not a hex string.
    if (typeof n.bitLength === 'function') return n.bitLength();
    if (typeof n.toString === 'function') {
      const hex = n.toString(16).replace(/^0+/, '');
      return hex.length * 4;
    }
    return 0;
  } catch { return 0; }
}

/* ----------------------------- metadata --------------------------------- */

function parseUtcTime(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const m = s.match(/^(\d{2,4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!m) return s;
  let yr = m[1];
  if (yr.length === 2) yr = (Number(yr) >= 50 ? '19' : '20') + yr;
  return `${yr}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}

export function parseMetadata(d: DetectionResult, password?: string): SslMetadata | null {
  switch (d.type) {
    case SslType.CERT: return certMetadata(d);
    case SslType.PRV_PKCS1:
    case SslType.PRV_PKCS8:
    case SslType.PRV_PKCS5:
    case SslType.PUB_KEY: return keyMetadata(d, password);
    case SslType.CSR: return csrMetadata(d);
    case SslType.P7B: return p7bMetadata(d);
    // CRL metadata is unsupported: jsrsasign only ships a CRL *generator*
    // (KJUR.asn1.x509.CRL), no parser to read issuer/nextUpdate from a blob.
    case SslType.CRL: return null;
    default: return null;
  }
}

function certMetadata(d: DetectionResult): SslMetadata | null {
  try {
    const pem = d.encoding === Encoding.PEM ? d.raw : pemFromBytes(d.bytes || base64ToBytes(d.raw.replace(/\s/g, '')), 'CERTIFICATE');
    const x = new X509();
    x.readCertPEM(pem);
    const meta: SslMetadata = {
      subject: safe(x.getSubjectString()),
      issuer: safe(x.getIssuerString()),
      serial: safe(x.getSerialNumberHex()),
      notBefore: parseUtcTime(safe(x.getNotBefore())),
      notAfter: parseUtcTime(safe(x.getNotAfter())),
      sigAlg: safe(x.getSignatureAlgorithmName()),
    };
    try {
      const san = x.getExtSubjectAltName();
      if (san) meta['san'] = JSON.stringify(san);
    } catch { /* no SAN */ }
    try {
      const pk: any = x.getPublicKey();
      if (pk) {
        meta['keyAlg'] = safe(pk.type);
        meta['keySize'] = pk.type === 'RSA' ? String(rsaBitLen(pk)) + ' bit' : safe(pk.curveName);
      }
    } catch { /* pubkey parse fail */ }
    return meta;
  } catch {
    return null;
  }
}

function keyMetadata(d: DetectionResult, password?: string): SslMetadata | null {
  let k: any;
  try {
    k = loadKey(d, password);
  } catch {
    // Fallback for SEC1 EC DER/base64 if getKey can't load it (some jsrsasign
    // builds reject a bare `EC PRIVATE KEY`). Parse the ASN.1 ourselves to at
    // least report keyAlg='EC' and the curve name / bit length.
    const ec = parseEcSec1Bytes(keyBytes(d));
    if (ec) {
      const meta: SslMetadata = { keyAlg: 'EC' };
      meta['keySize'] = ec.curveName + (ec.keyBits ? ` (${ec.keyBits} bit)` : '');
      return meta;
    }
    return null;
  }
  const meta: SslMetadata = {
    keyAlg: safe(k.type),
  };
  if (k.type === 'RSA') meta['keySize'] = String(rsaBitLen(k)) + ' bit';
  else if (k.type === 'EC') {
    const cn = safe(k.curveName);
    if (cn) meta['keySize'] = cn;
    else {
      const ec = parseEcSec1Bytes(keyBytes(d));
      meta['keySize'] = ec ? (ec.curveName + (ec.keyBits ? ` (${ec.keyBits} bit)` : '')) : 'EC';
    }
  }
  return meta;
}

/** Raw key bytes for any encoding (used by the SEC1 fallback). */
function keyBytes(d: DetectionResult): Uint8Array {
  if (d.bytes) return d.bytes;
  if (d.encoding === Encoding.PEM) return bytesFromPem(d.raw);
  return base64ToBytes(d.raw.replace(/\s/g, ''));
}

/** Parse a SEC1 ECPrivateKey (RFC 5915) directly with ASN1HEX to recover the
 *  curve name and bit length. Structure:
 *    ECPrivateKey ::= SEQUENCE { version, privateKey OCTET STRING,
 *                                parameters [0] EXPLICIT ECParameters OPTIONAL,
 *                                publicKey [1] EXPLICIT BIT STRING OPTIONAL }
 *  The `parameters` field carries the named-curve OID. Used as a fallback when
 *  KEYUTIL.getKey refuses a bare SEC1 EC key. Returns null if not a SEC1 EC key. */
function parseEcSec1Bytes(bytes: Uint8Array): { curveName: string; keyBits: number } | null {
  try {
    const hex = bytesToHex(bytes);
    const kids: number[] = (ASN1HEX as any).getChildIdx(hex, 0);
    if (!kids || kids.length < 2) return null;
    for (let i = 2; i < kids.length; i++) {
      const tlv: string = (ASN1HEX as any).getTLV(hex, kids[i]);
      // [0] EXPLICIT context tag → hex starts with 'a0'.
      if (tlv && /^a0/i.test(tlv)) {
        const inner: number[] = (ASN1HEX as any).getChildIdx(hex, kids[i]);
        if (inner && inner.length) {
          const oid: string = (ASN1HEX as any).getOID(hex, inner[0]);
          let name: string | undefined = (KJUR as any).asn1.x509.OID.oid2name(oid);
          if (!name || name === oid) name = oid;
          let bits = 0;
          try { bits = (KJUR as any).crypto.ECParameterDB.getByName(name).keylen; } catch { /* unknown curve */ }
          return { curveName: name || 'EC', keyBits: bits || 0 };
        }
      }
    }
    return null;
  } catch { return null; }
}

function csrMetadata(d: DetectionResult): SslMetadata | null {
  try {
    const pem = d.encoding === Encoding.PEM ? d.raw : pemFromBytes(d.bytes || base64ToBytes(d.raw.replace(/\s/g, '')), 'CERTIFICATE REQUEST');
    const param: any = (KJUR as any).asn1.csr.CSRUtil.getParam(pem);
    const meta: SslMetadata = {};
    try { meta['subject'] = JSON.stringify(param.subject); } catch { /* */ }
    try { meta['keyAlg'] = safe(param.sbjpubkey?.type); } catch { /**/ }
    try {
      const ok = (KJUR as any).asn1.csr.CSRUtil.verifySignature(pem);
      meta['verified'] = ok ? 'Signature valid' : 'Signature invalid';
    } catch { /**/ }
    return meta;
  } catch {
    return null;
  }
}

function safe(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  return String(v);
}

/* -------------------------- available outputs --------------------------- */

export function availableOutputs(d: DetectionResult, keyAlg?: KeyAlg): OutputFormat[] {
  switch (d.type) {
    case SslType.CERT:
    case SslType.CRL:
      return [OutputFormat.PEM, OutputFormat.DER];
    case SslType.PUB_KEY:
      return [OutputFormat.PEM, OutputFormat.DER, OutputFormat.JWK];
    case SslType.CSR:
      return [OutputFormat.PEM, OutputFormat.DER];
    case SslType.P7B:
      return [OutputFormat.PEM_CHAIN, OutputFormat.DER];
    case SslType.PKCS12:
      return [OutputFormat.OPENSSL_CMD];
    case SslType.JKS:
      return [OutputFormat.KEYTOOL_CMD];
    case SslType.PRV_PKCS1:
    case SslType.PRV_PKCS8:
    case SslType.PRV_PKCS5: {
      const alg = keyAlg; // undefined for encrypted-until-password
      const base = [OutputFormat.PKCS8PRV, OutputFormat.JWK, OutputFormat.DER];
      if (alg === 'EC' || alg === 'DSA') return base;
      // RSA, or unknown (encrypted, pre-decrypt) → offer PKCS1 too; convert() guards EC.
      return [OutputFormat.PKCS1PRV, ...base];
    }
    default:
      return [];
  }
}

export const OUTPUT_LABELS: Record<OutputFormat, string> = {
  [OutputFormat.PEM]: 'PEM',
  [OutputFormat.DER]: 'DER',
  [OutputFormat.PKCS1PRV]: 'PKCS#1',
  [OutputFormat.PKCS8PRV]: 'PKCS#8',
  [OutputFormat.JWK]: 'JWK',
  [OutputFormat.PEM_CHAIN]: 'PEM Chain',
  [OutputFormat.OPENSSL_CMD]: 'openssl cmd',
  [OutputFormat.KEYTOOL_CMD]: 'keytool cmd',
};

/* ------------------------------- convert -------------------------------- */

export function convert(d: DetectionResult, target: OutputFormat, password?: string): ConvertOutput {
  try {
    switch (target) {
      case OutputFormat.PEM: return toPemOut(d);
      case OutputFormat.DER: return toDerOut(d);
      case OutputFormat.PKCS1PRV: return keyToPem(d, 'PKCS1PRV', 'private-pkcs1.key', password);
      case OutputFormat.PKCS8PRV: return keyToPem(d, 'PKCS8PRV', 'private-pkcs8.key', password);
      case OutputFormat.JWK: return keyToJwk(d, 'key.jwk.json', password);
      case OutputFormat.PEM_CHAIN: return p7bToChain(d);
      case OutputFormat.OPENSSL_CMD: return opensslCmd(d);
      case OutputFormat.KEYTOOL_CMD: return keytoolCmd(d);
      default: return { mime: 'text/plain', fileName: 'out.txt', error: 'Output tidak didukung' };
    }
  } catch (e) {
    return { mime: 'text/plain', fileName: 'out.txt', error: errMsg(e) };
  }
}

function curBytes(d: DetectionResult): Uint8Array {
  if (d.bytes) return d.bytes;
  if (d.encoding === Encoding.PEM) return bytesFromPem(d.raw);
  return base64ToBytes(d.raw.replace(/\s/g, ''));
}

function toPemOut(d: DetectionResult): ConvertOutput {
  if (d.type === SslType.P7B) {
    // PEM re-wrap of a P7B is just the original PEM; chain extraction is PEM_CHAIN.
    return { text: d.encoding === Encoding.PEM ? d.raw : pemFromBytes(curBytes(d), 'PKCS7'), mime: 'application/x-pem-file', fileName: 'chain.p7b.pem' };
  }
  const marker = markerFor(d.type);
  const text = d.encoding === Encoding.PEM ? d.raw : pemFromBytes(curBytes(d), marker);
  return { text, mime: 'application/x-pem-file', fileName: fileNameFor(d, 'pem') };
}

function toDerOut(d: DetectionResult): ConvertOutput {
  const bytes = curBytes(d);
  return { bytes, mime: 'application/octet-stream', fileName: fileNameFor(d, 'der') };
}

function loadKey(d: DetectionResult, password?: string): any {
  if (d.isEncrypted) {
    const pem = pemForJsrsasign(d);
    try { return KEYUTIL.getKey(pem, password); }
    catch { return KEYUTIL.getKeyFromEncryptedPKCS8(pem, password); }
  }
  // PEM inputs carry their own armor — feed the raw text straight to getKey.
  if (d.encoding === Encoding.PEM) return KEYUTIL.getKey(d.raw);
  // DER / base64 inputs have no armor. getKey is marker-strict, so wrap the bytes
  // with each candidate marker and take the first one that parses. Trying
  // `EC PRIVATE KEY` before `RSA PRIVATE KEY` is essential: the RSA loader would
  // otherwise happily swallow a bare SEC1 EC key. SEC1 EC parses via the EC
  // marker; PKCS#8 keys parse via the generic `PRIVATE KEY` marker.
  const bytes = d.bytes || base64ToBytes(d.raw.replace(/\s/g, ''));
  for (const marker of ['PRIVATE KEY', 'EC PRIVATE KEY', 'RSA PRIVATE KEY', 'PUBLIC KEY', 'RSA PUBLIC KEY']) {
    try { return KEYUTIL.getKey(pemFromBytes(bytes, marker)); } catch { /* next marker */ }
  }
  throw new Error('no matching key armor');
}

function keyToPem(d: DetectionResult, format: 'PKCS1PRV' | 'PKCS8PRV', file: string, password?: string): ConvertOutput {
  const k = loadKey(d, password);
  if (k.type === 'EC' && format === 'PKCS1PRV') {
    return { mime: 'text/plain', fileName: file, error: 'PKCS#1 hanya untuk RSA; kunci EC tidak didukung.' };
  }
  const pem: string = KEYUTIL.getPEM(k, format);
  return { text: pem, mime: 'application/x-pem-file', fileName: file };
}

function keyToJwk(d: DetectionResult, file: string, password?: string): ConvertOutput {
  const k = loadKey(d, password);
  const jwk = KEYUTIL.getJWK(k);
  return { text: JSON.stringify(jwk, null, 2), mime: 'application/json', fileName: file };
}

/** Extract the certificate array from a PKCS#7 SignedData blob. Returns each
 *  cert as a ready-to-use PEM string (as produced by jsrsasign's CMSParser).
 *  Shared by `p7bMetadata` and `p7bToChain` so both stay in sync. */
function parseP7bCerts(d: DetectionResult): string[] {
  try {
    const hex = bytesToHex(curBytes(d));
    const signed = new (KJUR as any).asn1.cms.CMSParser().getCMSSignedData(hex);
    const arr: string[] = (signed?.certs?.array as string[]) || [];
    return arr.map((p: string) => p.replace(/\r\n/g, '\n').trim()).filter(Boolean);
  } catch { return []; }
}

function p7bMetadata(d: DetectionResult): SslMetadata | null {
  const certs = parseP7bCerts(d);
  if (!certs.length) return null;
  const subjects: string[] = [];
  for (const pem of certs) {
    try {
      const x = new X509();
      x.readCertPEM(pem);
      const s = safe(x.getSubjectString());
      if (s) subjects.push(s);
    } catch { /* skip unparseable cert */ }
  }
  return { chainCount: String(certs.length), subjects: subjects.join('\n') };
}

function p7bToChain(d: DetectionResult): ConvertOutput {
  // Real OpenSSL P7B (PEM `-----BEGIN PKCS7-----`) carries the certs INSIDE the
  // PKCS#7 SignedData base64 — there are no embedded `-----BEGIN CERTIFICATE-----`
  // blocks to regex out. parseP7bCerts uses jsrsasign's CMSParser, which returns
  // each cert already wrapped as a PEM string under `certs.array`.
  const certs = parseP7bCerts(d);
  if (certs.length) {
    return { text: certs.join('\n\n'), mime: 'application/x-pem-file', fileName: 'chain.pem' };
  }
  return {
    mime: 'text/plain',
    fileName: 'chain.txt',
    error: 'Gagal mengekstrak chain P7B di sisi klien. Coba: openssl pkcs7 -print_certs -in file.p7b -out chain.pem',
  };
}

function opensslCmd(d: DetectionResult): ConvertOutput {
  const f = d.fileName || 'file.p12';
  const text = [
    `# Inspect / list contents`,
    `openssl pkcs12 -info -in ${f} -nodes`,
    ``,
    `# Extract certificate`,
    `openssl pkcs12 -in ${f} -clcerts -nokeys -out cert.pem`,
    ``,
    `# Extract private key (unencrypted)`,
    `openssl pkcs12 -in ${f} -nocerts -nodes -out key.pem`,
    ``,
    `# Convert PKCS#12 -> PEM keystore`,
    `openssl pkcs12 -in ${f} -out keystore.pem -nodes`,
  ].join('\n');
  return { text, mime: 'text/plain', fileName: 'openssl-commands.txt' };
}

function keytoolCmd(d: DetectionResult): ConvertOutput {
  const f = d.fileName || 'file.jks';
  const text = [
    `# List keystore contents`,
    `keytool -list -v -keystore ${f}`,
    ``,
    `# Convert JKS -> PKCS#12 (then use openssl for PEM)`,
    `keytool -importkeystore -srckeystore ${f} -srcstoretype JKS \\`,
    `  -destkeystore ${f}.p12 -deststoretype PKCS12`,
  ].join('\n');
  return { text, mime: 'text/plain', fileName: 'keytool-commands.txt' };
}

function fileNameFor(d: DetectionResult, ext: string): string {
  const base = d.fileName ? d.fileName.replace(/\.[^.]+$/, '') : ({
    [SslType.CERT]: 'certificate',
    [SslType.CSR]: 'request',
    [SslType.PUB_KEY]: 'publickey',
    [SslType.CRL]: 'crl',
    [SslType.P7B]: 'chain',
  } as Record<SslType, string>)[d.type] || 'output';
  return `${base}.${ext}`;
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}