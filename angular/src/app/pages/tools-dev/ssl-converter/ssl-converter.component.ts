import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

/* =========================================================================
 * SSL Converter — pure detection / conversion / metadata logic (ponytail: inlined
 * from ssl-converter.logic.ts to keep the 3-file page pattern).
 * ========================================================================= */

import { KEYUTIL, X509, KJUR, ASN1HEX } from 'jsrsasign';

export enum Encoding {
  PEM = 'PEM',
  BASE64_DER = 'BASE64_DER',
  BINARY_DER = 'BINARY_DER',
  UNKNOWN = 'UNKNOWN',
}

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
  raw: string;
  bytes?: Uint8Array;
  fileName?: string;
}

export interface SslMetadata {
  [k: string]: string | string[] | { key: string; value: string }[] | undefined;
  subject?: string;
  issuer?: string;
  serial?: string;
  notBefore?: string;
  notAfter?: string;
  sigAlg?: string;
  san?: string;
  sanList?: string[];
  csrSubjectPairs?: { key: string; value: string }[];
  keyAlg?: string;
  keySize?: string;
  verified?: string;
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

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, i + chunk);
    for (let j = 0; j < sub.length; j++) bin += String.fromCharCode(sub[j]);
  }
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  let h = '';
  for (let i = 0; i < bytes.length; i++)
    h += bytes[i].toString(16).padStart(2, '0');
  return h;
}

function pemFromBytes(bytes: Uint8Array, marker: string): string {
  const b64 = bytesToBase64(bytes);
  const lines = b64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${marker}-----\n${lines.join('\n')}\n-----END ${marker}-----`;
}

function bytesFromPem(pem: string): Uint8Array {
  const first = pem.match(
    /-----BEGIN[^-]*-----\s*([\s\S]*?)-----END[^-]*-----/,
  );
  const b64 = (
    first
      ? first[1]
      : pem.replace(/-----BEGIN[^-]*-----|-----END[^-]*-----/g, '')
  ).replace(/\s+/g, '');
  return base64ToBytes(b64);
}

function markerFor(type: SslType): string {
  switch (type) {
    case SslType.CERT:
      return 'CERTIFICATE';
    case SslType.CSR:
      return 'CERTIFICATE REQUEST';
    case SslType.PUB_KEY:
      return 'PUBLIC KEY';
    case SslType.CRL:
      return 'X509 CRL';
    case SslType.P7B:
      return 'PKCS7';
    default:
      return 'CERTIFICATE';
  }
}

function labelFor(type: SslType): string {
  switch (type) {
    case SslType.CERT:
      return 'X.509 Certificate';
    case SslType.PRV_PKCS1:
      return 'RSA Private Key (PKCS#1)';
    case SslType.PRV_PKCS8:
      return 'Private Key (PKCS#8)';
    case SslType.PRV_PKCS5:
      return 'Encrypted Private Key (PKCS#5)';
    case SslType.PUB_KEY:
      return 'Public Key';
    case SslType.CSR:
      return 'Certificate Signing Request (CSR)';
    case SslType.P7B:
      return 'PKCS#7 / P7B Certificate Chain';
    case SslType.CRL:
      return 'Certificate Revocation List (CRL)';
    case SslType.PKCS12:
      return 'PKCS#12 / PFX Keystore';
    case SslType.JKS:
      return 'Java Keystore (JKS)';
    default:
      return 'Unknown';
  }
}

const PEM_MARKER_TYPE: { re: RegExp; type: SslType; encrypted?: boolean }[] = [
  { re: /-----BEGIN TRUSTED CERTIFICATE-----/, type: SslType.CERT },
  { re: /-----BEGIN CERTIFICATE-----/, type: SslType.CERT },
  { re: /-----BEGIN RSA PRIVATE KEY-----/, type: SslType.PRV_PKCS1 },
  { re: /-----BEGIN EC PRIVATE KEY-----/, type: SslType.PRV_PKCS8 },
  {
    re: /-----BEGIN ENCRYPTED PRIVATE KEY-----/,
    type: SslType.PRV_PKCS5,
    encrypted: true,
  },
  { re: /-----BEGIN PRIVATE KEY-----/, type: SslType.PRV_PKCS8 },
  { re: /-----BEGIN RSA PUBLIC KEY-----/, type: SslType.PUB_KEY },
  { re: /-----BEGIN PUBLIC KEY-----/, type: SslType.PUB_KEY },
  { re: /-----BEGIN NEW CERTIFICATE REQUEST-----/, type: SslType.CSR },
  { re: /-----BEGIN CERTIFICATE REQUEST-----/, type: SslType.CSR },
  { re: /-----BEGIN PKCS7-----/, type: SslType.P7B },
  { re: /-----BEGIN X509 CRL-----/, type: SslType.CRL },
];

function pemMarkerToType(
  text: string,
): { type: SslType; encrypted: boolean } | null {
  for (const m of PEM_MARKER_TYPE) {
    if (m.re.test(text)) return { type: m.type, encrypted: !!m.encrypted };
  }
  return null;
}

function isBase64Charset(s: string): boolean {
  return /^[A-Za-z0-9+/=\s]+$/.test(s) && s.replace(/\s/g, '').length > 0;
}

function looksLikeDerSeq(b0: number, b1: number): boolean {
  return (
    b0 === 0x30 &&
    ((b1 > 0 && b1 < 0x80) || b1 === 0x80 || b1 === 0x81 || b1 === 0x82)
  );
}

const KEY_MARKERS: ReadonlyArray<[string, SslType, string | undefined]> = [
  ['EC PRIVATE KEY', SslType.PRV_PKCS8, 'EC'],
  ['PRIVATE KEY', SslType.PRV_PKCS8, undefined],
  ['RSA PRIVATE KEY', SslType.PRV_PKCS1, 'RSA'],
  ['PUBLIC KEY', SslType.PUB_KEY, undefined],
  ['RSA PUBLIC KEY', SslType.PUB_KEY, 'RSA'],
];

function classifyDer(bytes: Uint8Array): SslType {
  const pem = pemFromBytes(bytes, 'CERTIFICATE');
  try {
    const x = new X509();
    x.readCertPEM(pem);
    x.getNotAfter();
    return SslType.CERT;
  } catch {
    /* not a cert */
  }
  try {
    (KJUR as any).asn1.csr.CSRUtil.getParam(
      pemFromBytes(bytes, 'CERTIFICATE REQUEST'),
    );
    return SslType.CSR;
  } catch {
    /* not a csr */
  }
  try {
    const hex = bytesToHex(bytes);
    const signed = new (KJUR as any).asn1.cms.CMSParser().getCMSSignedData(hex);
    if (
      signed &&
      Array.isArray(signed?.certs?.array) &&
      signed.certs.array.length
    ) {
      return SslType.P7B;
    }
  } catch {
    /* not a PKCS#7 */
  }
  for (const [marker, type, expAlg] of KEY_MARKERS) {
    try {
      const k: any = KEYUTIL.getKey(pemFromBytes(bytes, marker));
      if (expAlg && k?.type !== expAlg) continue;
      return type;
    } catch {
      /* try next marker */
    }
  }
  return SslType.UNKNOWN;
}

export function detect(
  input: string | Uint8Array,
  fileName?: string,
): DetectionResult {
  const lowerName = (fileName || '').toLowerCase();

  if (input instanceof Uint8Array) {
    const bytes = input;
    if (
      bytes.length >= 4 &&
      bytes[0] === 0xfe &&
      bytes[1] === 0xed &&
      bytes[2] === 0xfe &&
      bytes[3] === 0xed
    ) {
      return mk(SslType.JKS, Encoding.BINARY_DER, '', bytes, fileName);
    }
    if (lowerName.endsWith('.p12') || lowerName.endsWith('.pfx')) {
      return mk(SslType.PKCS12, Encoding.BINARY_DER, '', bytes, fileName);
    }
    if (bytes.length >= 2 && looksLikeDerSeq(bytes[0], bytes[1])) {
      const type = classifyDer(bytes);
      return mk(
        type === SslType.UNKNOWN ? SslType.UNKNOWN : type,
        Encoding.BINARY_DER,
        '',
        bytes,
        fileName,
      );
    }
    return mk(SslType.UNKNOWN, Encoding.BINARY_DER, '', bytes, fileName);
  }

  const text = input;
  const marker = pemMarkerToType(text);
  if (marker) {
    return mk(
      marker.type,
      Encoding.PEM,
      text,
      undefined,
      fileName,
      marker.encrypted,
    );
  }
  if (isBase64Charset(text)) {
    try {
      const bytes = base64ToBytes(text.replace(/\s/g, ''));
      if (bytes.length >= 2 && looksLikeDerSeq(bytes[0], bytes[1])) {
        const type = classifyDer(bytes);
        return mk(type, Encoding.BASE64_DER, text, bytes, fileName);
      }
    } catch {
      /* fall through */
    }
  }
  return mk(SslType.UNKNOWN, Encoding.UNKNOWN, text, undefined, fileName);
}

function mk(
  type: SslType,
  encoding: Encoding,
  raw: string,
  bytes?: Uint8Array,
  fileName?: string,
  isEncrypted = false,
): DetectionResult {
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

export function resolveKeyAlg(d: DetectionResult, password?: string): KeyAlg {
  if (
    ![
      SslType.PRV_PKCS1,
      SslType.PRV_PKCS8,
      SslType.PRV_PKCS5,
      SslType.PUB_KEY,
    ].includes(d.type)
  )
    return undefined;
  try {
    const k: any = loadKey(d, password);
    return (k as any).type as KeyAlg;
  } catch {
    return undefined;
  }
}

function pemForJsrsasign(d: DetectionResult): string {
  if (d.encoding === Encoding.PEM) return d.raw;
  if (d.bytes) return pemFromBytes(d.bytes, 'PRIVATE KEY');
  if (d.encoding === Encoding.BASE64_DER) {
    try {
      return pemFromBytes(
        base64ToBytes(d.raw.replace(/\s/g, '')),
        'PRIVATE KEY',
      );
    } catch {
      return d.raw;
    }
  }
  return d.raw;
}

function rsaBitLen(k: any): number {
  try {
    const n = k?.n;
    if (n == null) return 0;
    if (typeof n.bitLength === 'function') return n.bitLength();
    if (typeof n.toString === 'function') {
      const hex = n.toString(16).replace(/^0+/, '');
      return hex.length * 4;
    }
    return 0;
  } catch {
    return 0;
  }
}

function parseUtcTime(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const m = s.match(/^(\d{2,4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!m) return s;
  let yr = m[1];
  if (yr.length === 2) yr = (Number(yr) >= 50 ? '19' : '20') + yr;
  return `${yr}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}

/** Flatten a SAN object from jsrsasign into a string[] of human-readable entries. */
function flattenSan(raw: any): string[] {
  if (!raw) return [];
  const entries: string[] = [];
  const arr = raw.array || raw;
  if (Array.isArray(arr)) {
    for (const entry of arr) {
      if (typeof entry === 'string') {
        entries.push(entry);
        continue;
      }
      if (entry.dns) entries.push(`DNS: ${entry.dns}`);
      else if (entry.ip) entries.push(`IP: ${entry.ip}`);
      else if (entry.uri) entries.push(`URI: ${entry.uri}`);
      else if (entry.email) entries.push(`Email: ${entry.email}`);
      else if (entry.dn) entries.push(`DN: ${entry.dn}`);
      else entries.push(JSON.stringify(entry));
    }
  }
  return entries;
}

export function parseMetadata(
  d: DetectionResult,
  password?: string,
): SslMetadata | null {
  switch (d.type) {
    case SslType.CERT:
      return certMetadata(d);
    case SslType.PRV_PKCS1:
    case SslType.PRV_PKCS8:
    case SslType.PRV_PKCS5:
    case SslType.PUB_KEY:
      return keyMetadata(d, password);
    case SslType.CSR:
      return csrMetadata(d);
    case SslType.P7B:
      return p7bMetadata(d);
    case SslType.CRL:
      return null;
    default:
      return null;
  }
}

function certMetadata(d: DetectionResult): SslMetadata | null {
  try {
    const pem =
      d.encoding === Encoding.PEM
        ? d.raw
        : pemFromBytes(
            d.bytes || base64ToBytes(d.raw.replace(/\s/g, '')),
            'CERTIFICATE',
          );
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
      if (san) {
        meta['san'] = JSON.stringify(san);
        meta['sanList'] = flattenSan(san);
      }
    } catch {
      /* no SAN */
    }
    try {
      const pk: any = x.getPublicKey();
      if (pk) {
        meta['keyAlg'] = safe(pk.type);
        meta['keySize'] =
          pk.type === 'RSA'
            ? String(rsaBitLen(pk)) + ' bit'
            : safe(pk.curveName);
      }
    } catch {
      /* pubkey parse fail */
    }
    return meta;
  } catch {
    return null;
  }
}

function keyMetadata(
  d: DetectionResult,
  password?: string,
): SslMetadata | null {
  let k: any;
  try {
    k = loadKey(d, password);
  } catch {
    const ec = parseEcSec1Bytes(keyBytes(d));
    if (ec) {
      const meta: SslMetadata = { keyAlg: 'EC' };
      meta['keySize'] =
        ec.curveName + (ec.keyBits ? ` (${ec.keyBits} bit)` : '');
      return meta;
    }
    return null;
  }
  const meta: SslMetadata = { keyAlg: safe(k.type) };
  if (k.type === 'RSA') meta['keySize'] = String(rsaBitLen(k)) + ' bit';
  else if (k.type === 'EC') {
    const cn = safe(k.curveName);
    if (cn) meta['keySize'] = cn;
    else {
      const ec = parseEcSec1Bytes(keyBytes(d));
      meta['keySize'] = ec
        ? ec.curveName + (ec.keyBits ? ` (${ec.keyBits} bit)` : '')
        : 'EC';
    }
  }
  return meta;
}

function keyBytes(d: DetectionResult): Uint8Array {
  if (d.bytes) return d.bytes;
  if (d.encoding === Encoding.PEM) return bytesFromPem(d.raw);
  return base64ToBytes(d.raw.replace(/\s/g, ''));
}

function parseEcSec1Bytes(
  bytes: Uint8Array,
): { curveName: string; keyBits: number } | null {
  try {
    const hex = bytesToHex(bytes);
    const kids: number[] = (ASN1HEX as any).getChildIdx(hex, 0);
    if (!kids || kids.length < 2) return null;
    for (let i = 2; i < kids.length; i++) {
      const tlv: string = (ASN1HEX as any).getTLV(hex, kids[i]);
      if (tlv && /^a0/i.test(tlv)) {
        const inner: number[] = (ASN1HEX as any).getChildIdx(hex, kids[i]);
        if (inner && inner.length) {
          const oid: string = (ASN1HEX as any).getOID(hex, inner[0]);
          let name: string | undefined = (KJUR as any).asn1.x509.OID.oid2name(
            oid,
          );
          if (!name || name === oid) name = oid;
          let bits = 0;
          try {
            bits = (KJUR as any).crypto.ECParameterDB.getByName(name).keylen;
          } catch {
            /* unknown curve */
          }
          return { curveName: name || 'EC', keyBits: bits || 0 };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

function csrMetadata(d: DetectionResult): SslMetadata | null {
  try {
    const pem =
      d.encoding === Encoding.PEM
        ? d.raw
        : pemFromBytes(
            d.bytes || base64ToBytes(d.raw.replace(/\s/g, '')),
            'CERTIFICATE REQUEST',
          );
    const param: any = (KJUR as any).asn1.csr.CSRUtil.getParam(pem);
    const meta: SslMetadata = {};
    try {
      meta['subject'] = JSON.stringify(param.subject);
      if (param.subject && typeof param.subject === 'object') {
        const pairs: { key: string; value: string }[] = [];
        for (const [k, v] of Object.entries(param.subject)) {
          pairs.push({ key: k, value: String(v) });
        }
        meta['csrSubjectPairs'] = pairs;
      }
    } catch {
      /* */
    }
    try {
      meta['keyAlg'] = safe(param.sbjpubkey?.type);
    } catch {
      /**/
    }
    try {
      const ok = (KJUR as any).asn1.csr.CSRUtil.verifySignature(pem);
      meta['verified'] = ok ? 'Signature valid' : 'Signature invalid';
    } catch {
      /**/
    }
    return meta;
  } catch {
    return null;
  }
}

function safe(v: unknown): string | undefined {
  return v === null || v === undefined ? undefined : String(v);
}

export function availableOutputs(
  d: DetectionResult,
  keyAlg?: KeyAlg,
): OutputFormat[] {
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
      const alg = keyAlg;
      const base = [OutputFormat.PKCS8PRV, OutputFormat.JWK, OutputFormat.DER];
      if (alg === 'EC' || alg === 'DSA') return base;
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

export function convert(
  d: DetectionResult,
  target: OutputFormat,
  password?: string,
): ConvertOutput {
  try {
    switch (target) {
      case OutputFormat.PEM:
        return toPemOut(d);
      case OutputFormat.DER:
        return toDerOut(d);
      case OutputFormat.PKCS1PRV:
        return keyToPem(d, 'PKCS1PRV', 'private-pkcs1.key', password);
      case OutputFormat.PKCS8PRV:
        return keyToPem(d, 'PKCS8PRV', 'private-pkcs8.key', password);
      case OutputFormat.JWK:
        return keyToJwk(d, 'key.jwk.json', password);
      case OutputFormat.PEM_CHAIN:
        return p7bToChain(d);
      case OutputFormat.OPENSSL_CMD:
        return opensslCmd(d);
      case OutputFormat.KEYTOOL_CMD:
        return keytoolCmd(d);
      default:
        return {
          mime: 'text/plain',
          fileName: 'out.txt',
          error: 'Output tidak didukung',
        };
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
    return {
      text:
        d.encoding === Encoding.PEM
          ? d.raw
          : pemFromBytes(curBytes(d), 'PKCS7'),
      mime: 'application/x-pem-file',
      fileName: 'chain.p7b.pem',
    };
  }
  const marker = markerFor(d.type);
  const text =
    d.encoding === Encoding.PEM ? d.raw : pemFromBytes(curBytes(d), marker);
  return {
    text,
    mime: 'application/x-pem-file',
    fileName: fileNameFor(d, 'pem'),
  };
}

function toDerOut(d: DetectionResult): ConvertOutput {
  const bytes = curBytes(d);
  return {
    bytes,
    mime: 'application/octet-stream',
    fileName: fileNameFor(d, 'der'),
  };
}

function loadKey(d: DetectionResult, password?: string): any {
  if (d.isEncrypted) {
    const pem = pemForJsrsasign(d);
    try {
      return KEYUTIL.getKey(pem, password);
    } catch {
      return KEYUTIL.getKeyFromEncryptedPKCS8(pem, password);
    }
  }
  if (d.encoding === Encoding.PEM) return KEYUTIL.getKey(d.raw);
  const bytes = d.bytes || base64ToBytes(d.raw.replace(/\s/g, ''));
  for (const marker of [
    'PRIVATE KEY',
    'EC PRIVATE KEY',
    'RSA PRIVATE KEY',
    'PUBLIC KEY',
    'RSA PUBLIC KEY',
  ]) {
    try {
      return KEYUTIL.getKey(pemFromBytes(bytes, marker));
    } catch {
      /* next marker */
    }
  }
  throw new Error('no matching key armor');
}

function keyToPem(
  d: DetectionResult,
  format: 'PKCS1PRV' | 'PKCS8PRV',
  file: string,
  password?: string,
): ConvertOutput {
  const k = loadKey(d, password);
  if (k.type === 'EC' && format === 'PKCS1PRV') {
    return {
      mime: 'text/plain',
      fileName: file,
      error: 'PKCS#1 hanya untuk RSA; kunci EC tidak didukung.',
    };
  }
  const pem: string = KEYUTIL.getPEM(k, format);
  return { text: pem, mime: 'application/x-pem-file', fileName: file };
}

function keyToJwk(
  d: DetectionResult,
  file: string,
  password?: string,
): ConvertOutput {
  const k = loadKey(d, password);
  const jwk = KEYUTIL.getJWK(k);
  return {
    text: JSON.stringify(jwk, null, 2),
    mime: 'application/json',
    fileName: file,
  };
}

function parseP7bCerts(d: DetectionResult): string[] {
  try {
    const hex = bytesToHex(curBytes(d));
    const signed = new (KJUR as any).asn1.cms.CMSParser().getCMSSignedData(hex);
    const arr: string[] = (signed?.certs?.array as string[]) || [];
    return arr
      .map((p: string) => p.replace(/\r\n/g, '\n').trim())
      .filter(Boolean);
  } catch {
    return [];
  }
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
    } catch {
      /* skip unparseable cert */
    }
  }
  return { chainCount: String(certs.length), subjects: subjects.join('\n') };
}

function p7bToChain(d: DetectionResult): ConvertOutput {
  const certs = parseP7bCerts(d);
  if (certs.length) {
    return {
      text: certs.join('\n\n'),
      mime: 'application/x-pem-file',
      fileName: 'chain.pem',
    };
  }
  return {
    mime: 'text/plain',
    fileName: 'chain.txt',
    error:
      'Gagal mengekstrak chain P7B di sisi klien. Coba: openssl pkcs7 -print_certs -in file.p7b -out chain.pem',
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
  const base = d.fileName
    ? d.fileName.replace(/\.[^.]+$/, '')
    : (
        {
          [SslType.CERT]: 'certificate',
          [SslType.CSR]: 'request',
          [SslType.PUB_KEY]: 'publickey',
          [SslType.CRL]: 'crl',
          [SslType.P7B]: 'chain',
        } as Record<SslType, string>
      )[d.type] || 'output';
  return `${base}.${ext}`;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

interface OutButton {
  fmt: OutputFormat;
  label: string;
  hint: string;
}

@Component({
  selector: 'app-ssl-converter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './ssl-converter.component.html',
  styleUrl: './ssl-converter.component.css',
})
export class SslConverterComponent {
  readonly OutputFormat = OutputFormat;
  readonly SslType = SslType;
  readonly Encoding = Encoding;
  readonly labels = OUTPUT_LABELS;
  readonly supported = [
    '.pem',
    '.cer',
    '.crt',
    '.der',
    '.key',
    '.p7b',
    '.p7c',
    '.csr',
    '.pub',
    '.p12',
    '.pfx',
    '.jks',
  ];
  private readonly hints: Record<OutputFormat, string> = {
    [OutputFormat.PEM]: 'ASCII armor (.pem)',
    [OutputFormat.DER]: 'Binary ASN.1 (.der)',
    [OutputFormat.PKCS1PRV]: 'RSA traditional key',
    [OutputFormat.PKCS8PRV]: 'PKCS#8 private key',
    [OutputFormat.JWK]: 'JSON Web Key',
    [OutputFormat.PEM_CHAIN]: 'Concatenated certs',
    [OutputFormat.OPENSSL_CMD]: 'openssl commands',
    [OutputFormat.KEYTOOL_CMD]: 'keytool commands',
  };

  rawText = '';
  password = '';
  detection: DetectionResult | null = null;
  metadata: SslMetadata | null = null;
  keyAlg: KeyAlg = undefined;
  outputs: OutButton[] = [];
  output: ConvertOutput | null = null;
  selectedFmt: OutputFormat | null = null;
  error = '';
  byteCount = 0;
  hexPreview = '';
  dragActive = false;
  copySuccess = false;
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  private maxBytes = 1_048_576; // 1 MB cap

  constructor(private snackBar: MatSnackBar) {}

  readonly hasInput = computed(
    () =>
      !!this.detection || this.rawText.trim().length > 0 || this.byteCount > 0,
  );

  /** Preview text for the result box, capped so a huge output can't jank the DOM.
   *  The download still ships the full text. */
  readonly previewCap = 100_000;
  get previewText(): string {
    const t = this.output?.text ?? '';
    return t.length > this.previewCap ? t.slice(0, this.previewCap) : t;
  }
  get previewTruncated(): boolean {
    return (this.output?.text?.length ?? 0) > this.previewCap;
  }

  /** Validity status for a detected certificate (valid / expiring soon / expired),
   *  derived from metadata.notAfter (ISO). Empty when not applicable. */
  readonly certState = computed(() => {
    const na = this.metadata?.notAfter;
    if (!na || this.detection?.type !== SslType.CERT) return null;
    const t = Date.parse(na);
    if (Number.isNaN(t)) return null;
    const days = (t - Date.now()) / 86_400_000;
    if (days < 0) return { label: 'Kedaluwarsa', cls: 'ssl-state--expired' };
    if (days < 30) return { label: 'Berakhir segera', cls: 'ssl-state--soon' };
    return { label: 'Masih berlaku', cls: 'ssl-state--valid' };
  });

  iconForType(t: SslType | undefined): string {
    switch (t) {
      case SslType.CERT:
        return 'verified';
      case SslType.CSR:
        return 'assignment';
      case SslType.PRV_PKCS1:
      case SslType.PRV_PKCS8:
      case SslType.PRV_PKCS5:
        return 'vpn_key';
      case SslType.PUB_KEY:
        return 'key';
      case SslType.P7B:
        return 'layers';
      case SslType.CRL:
        return 'block';
      case SslType.PKCS12:
        return 'inventory_2';
      case SslType.JKS:
        return 'storage';
      default:
        return 'help_outline';
    }
  }

  onInput(): void {
    this.error = '';
    if (!this.rawText.trim()) {
      this.resetResult();
      return;
    }
    // ponytail: guard pasted text same as readFile guards binary drops (maxBytes=1MB)
    if (this.rawText.length > this.maxBytes) {
      this.error = `Input terlalu besar (maks ${this.maxBytes} karakter).`;
      return;
    }
    this.runDetect(this.rawText);
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    this.dragActive = true;
  }
  onDragLeave(ev: DragEvent): void {
    ev.preventDefault();
    // Ignore leaves caused by the pointer crossing into child elements of the dropzone.
    const zone = ev.currentTarget as HTMLElement | null;
    if (!zone || !zone.contains(ev.relatedTarget as Node | null))
      this.dragActive = false;
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.dragActive = false;
    const file = ev.dataTransfer?.files?.[0];
    if (file) this.readFile(file);
  }

  onFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.readFile(file);
    input.value = '';
  }

  private readFile(file: File): void {
    this.error = '';
    if (file.size > this.maxBytes) {
      this.error = `File terlalu besar (maks 1 MB). Ukuran: ${file.size} byte.`;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result as ArrayBuffer);
      this.byteCount = bytes.length;
      this.rawText = ''; // binary input isn't pasteable text
      this.runDetect(bytes, file.name);
    };
    reader.onerror = () => (this.error = 'Gagal membaca file.');
    reader.readAsArrayBuffer(file);
  }

  private runDetect(input: string | Uint8Array, fileName?: string): void {
    const d = detect(input, fileName);
    this.detection = d;
    this.byteCount = d.bytes ? d.bytes.length : this.byteCount;
    this.output = null;
    this.selectedFmt = null;
    this.metadata = null;
    this.keyAlg = undefined;

    if (d.type === SslType.UNKNOWN) {
      this.outputs = [];
      // We only reach here with real input (empty path returns early in onInput),
      // so surface the unrecognized-format error for text pastes and file drops alike.
      if (
        d.encoding !== Encoding.UNKNOWN ||
        input instanceof Uint8Array ||
        (typeof input === 'string' && input.trim().length > 0)
      ) {
        this.error =
          'Format tidak dikenali. Tempel PEM yang valid atau unggah file SSL.';
      }
      return;
    }

    // Encrypted keys need a password before we can inspect alg / metadata / convert.
    if (d.isEncrypted) {
      this.outputs = this.toButtons(availableOutputs(d));
      if (this.password) this.tryDecrypt();
      return;
    }

    this.keyAlg = resolveKeyAlg(d);
    this.metadata = parseMetadata(d);
    this.outputs = this.toButtons(availableOutputs(d, this.keyAlg));
  }

  private toButtons(fmts: OutputFormat[]): OutButton[] {
    return fmts.map((fmt) => ({
      fmt,
      label: OUTPUT_LABELS[fmt],
      hint: this.hints[fmt],
    }));
  }

  onPassword(): void {
    if (this.detection?.isEncrypted && this.password) this.tryDecrypt();
  }

  private tryDecrypt(): void {
    if (!this.detection) return;
    this.keyAlg = resolveKeyAlg(this.detection, this.password);
    this.metadata = parseMetadata(this.detection, this.password);
    this.outputs = this.toButtons(
      availableOutputs(this.detection, this.keyAlg),
    );
    // The previous output was produced with a (possibly wrong) password — drop it
    // so the user re-selects an output with the now-correct password.
    this.output = null;
    this.selectedFmt = null;
    this.hexPreview = '';
    if (this.metadata) this.error = '';
    else this.error = 'Dekripsi gagal — periksa password.';
  }

  doConvert(fmt: OutputFormat): void {
    if (!this.detection) return;
    if (this.detection.isEncrypted && !this.password) {
      this.error = 'Masukkan password kunci terlebih dahulu.';
      return;
    }
    const res = convert(this.detection, fmt, this.password || undefined);
    this.output = res;
    this.selectedFmt = fmt;
    this.hexPreview = res.bytes ? this.hexPreviewFrom(res.bytes) : '';
    if (res.error) this.error = res.error;
    else this.error = '';
  }

  private hexPreviewFrom(bytes: Uint8Array): string {
    const n = Math.min(bytes.length, 256);
    let h = '';
    for (let i = 0; i < n; i++)
      h += bytes[i].toString(16).padStart(2, '0') + ' ';
    return (
      h.trim() + (bytes.length > n ? `\n… (+${bytes.length - n} bytes)` : '')
    );
  }

  copy(): void {
    if (!this.output?.text) return;
    // clipboard API is only available in secure contexts (https / localhost).
    if (!navigator.clipboard?.writeText) {
      this.error =
        'Clipboard tidak tersedia di konteks ini (gunakan HTTPS atau localhost).';
      return;
    }
    if (this.copyTimer) clearTimeout(this.copyTimer);
    navigator.clipboard.writeText(this.output.text).then(
      () => {
        this.copySuccess = true;
        this.copyTimer = setTimeout(() => {
          this.copySuccess = false;
        }, 1500);
        this.snackBar.open('Disalin ke clipboard', 'Tutup', { duration: 1500 });
      },
      () => (this.error = 'Gagal menyalin ke clipboard.'),
    );
  }

  dismissError(): void {
    this.error = '';
  }

  download(): void {
    const o = this.output;
    if (!o || (!o.text && !o.bytes)) return;
    const blob = o.bytes
      ? new Blob([o.bytes as BlobPart], { type: o.mime })
      : new Blob([o.text as BlobPart], { type: o.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = o.fileName;
    // Attach before click for cross-browser reliability, then revoke after a beat
    // so the download navigation has time to start.
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  clear(): void {
    this.rawText = '';
    this.password = '';
    this.error = '';
    this.resetResult();
  }

  private resetResult(): void {
    this.detection = null;
    this.metadata = null;
    this.outputs = [];
    this.output = null;
    this.selectedFmt = null;
    this.keyAlg = undefined;
    this.hexPreview = '';
    this.byteCount = 0;
    this.dragActive = false;
    this.copySuccess = false;
  }
}
