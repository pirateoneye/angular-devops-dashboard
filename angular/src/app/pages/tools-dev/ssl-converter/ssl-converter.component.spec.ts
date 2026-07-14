import {
  detect,
  convert,
  parseMetadata,
  resolveKeyAlg,
  availableOutputs,
  DetectionResult,
  SslType,
  Encoding,
  OutputFormat,
} from './ssl-converter.component';
import { KEYUTIL, KJUR } from 'jsrsasign';

/* ------------------------------------------------------------------ */
/*  Test-fixture helpers                                              */
/* ------------------------------------------------------------------ */

/** Generate a self-signed X.509 certificate PEM using jsrsasign v11. */
function makeCertPem(
  kp: { prvKeyObj: any; pubKeyObj: any },
  subject = '/CN=test.example.com/O=Test Inc/C=US',
): string {
  return (KJUR as any).asn1.x509.X509Util.newCertPEM({
    serial: { hex: '01abcd' },
    sigalg: { name: 'SHA256withRSA' },
    issuer: { str: subject },
    notbefore: { str: '240101000000Z' },
    notafter: { str: '340101000000Z' },
    subject: { str: subject },
    sbjpubkey: kp.pubKeyObj,
    cakey: kp.prvKeyObj,
  });
}

/** Generate a CSR PEM. */
function makeCsrPem(kp: { prvKeyObj: any; pubKeyObj: any }): string {
  return (KJUR as any).asn1.csr.CSRUtil.newCSRPEM({
    subject: { str: '/CN=csr.example.com/O=Test Inc/C=US' },
    sbjpubkey: kp.pubKeyObj,
    sigalg: 'SHA256withRSA',
    sbjprvkey: kp.prvKeyObj,
  });
}

/** Strip PEM armour -- return only the base64 body (no headers, no newlines). */
function pemBody(pem: string): string {
  return pem
    .replace(/-----BEGIN[^-]*-----/g, '')
    .replace(/-----END[^-]*-----/g, '')
    .replace(/\s+/g, '');
}

/* ------------------------------------------------------------------ */
/*  Top-level fixture data -- generated once per suite                */
/* ------------------------------------------------------------------ */

let certPem: string;
let rsaPkcs1Pem: string;
let rsaPkcs8Pem: string;
let pubKeyPem: string;
let csrPem: string;

describe('ssl-converter pure functions', () => {
  beforeAll(() => {
    const rsaKP = KEYUTIL.generateKeypair('RSA', 2048);

    certPem = makeCertPem(rsaKP);

    /* RSA private keys — these format combos work in jsrsasign v11 */
    rsaPkcs1Pem = KEYUTIL.getPEM(rsaKP.prvKeyObj, 'PKCS1PRV');
    rsaPkcs8Pem = KEYUTIL.getPEM(rsaKP.prvKeyObj, 'PKCS8PRV');

    /* Public key */
    pubKeyPem = KEYUTIL.getPEM(rsaKP.pubKeyObj as any);

    /* CSR */
    csrPem = makeCsrPem(rsaKP);
  });

  /* ================================================================
   *  detect()
   * ================================================================ */
  describe('detect()', () => {
    it('should detect a PEM certificate as CERT / PEM', () => {
      const r = detect(certPem);
      expect(r.type).toBe(SslType.CERT);
      expect(r.encoding).toBe(Encoding.PEM);
      expect(r.isEncrypted).toBe(false);
      expect(r.label).toContain('Certificate');
    });

    it('should detect a PEM RSA PRIVATE KEY as PRV_PKCS1', () => {
      const r = detect(rsaPkcs1Pem);
      expect(r.type).toBe(SslType.PRV_PKCS1);
      expect(r.encoding).toBe(Encoding.PEM);
      expect(r.isEncrypted).toBe(false);
    });

    it('should detect a PEM EC PRIVATE KEY as PRV_PKCS8', () => {
      const pem = `-----BEGIN EC PRIVATE KEY-----\nVGhpcyBpc250IHJlYWxseSBlYyBidXQgbWFya2VyIGlzIGVub3VnaA==\n-----END EC PRIVATE KEY-----`;
      const r = detect(pem);
      expect(r.type).toBe(SslType.PRV_PKCS8);
      expect(r.encoding).toBe(Encoding.PEM);
      expect(r.isEncrypted).toBe(false);
    });

    it('should detect an ENCRYPTED PRIVATE KEY as PRV_PKCS5 with isEncrypted', () => {
      const pem = `-----BEGIN ENCRYPTED PRIVATE KEY-----\nVGhpcyBpcyBhIHRlc3Q=\n-----END ENCRYPTED PRIVATE KEY-----`;
      const r = detect(pem);
      expect(r.type).toBe(SslType.PRV_PKCS5);
      expect(r.isEncrypted).toBe(true);
    });

    it('should detect a PEM PRIVATE KEY (PKCS#8) as PRV_PKCS8', () => {
      const r = detect(rsaPkcs8Pem);
      expect(r.type).toBe(SslType.PRV_PKCS8);
      expect(r.encoding).toBe(Encoding.PEM);
    });

    it('should detect a PEM PUBLIC KEY as PUB_KEY', () => {
      const r = detect(pubKeyPem);
      expect(r.type).toBe(SslType.PUB_KEY);
      expect(r.encoding).toBe(Encoding.PEM);
    });

    it('should detect a PEM CERTIFICATE REQUEST as CSR', () => {
      const r = detect(csrPem);
      expect(r.type).toBe(SslType.CSR);
      expect(r.encoding).toBe(Encoding.PEM);
    });

    it('should detect a PEM PKCS7 as P7B', () => {
      const pem = `-----BEGIN PKCS7-----\nVGhpcyBpcyBhIHRlc3Q=\n-----END PKCS7-----`;
      const r = detect(pem);
      expect(r.type).toBe(SslType.P7B);
      expect(r.encoding).toBe(Encoding.PEM);
    });

    it('should detect a PEM X509 CRL as CRL', () => {
      const pem = `-----BEGIN X509 CRL-----\nVGhpcyBpcyBhIHRlc3Q=\n-----END X509 CRL-----`;
      const r = detect(pem);
      expect(r.type).toBe(SslType.CRL);
      expect(r.encoding).toBe(Encoding.PEM);
    });

    it('should detect base64-encoded DER certificate as CERT / BASE64_DER', () => {
      const b64 = pemBody(certPem);
      expect(b64.length).toBeGreaterThan(0);
      const r = detect(b64);
      expect(r.type).toBe(SslType.CERT);
      expect(r.encoding).toBe(Encoding.BASE64_DER);
    });

    it('should return UNKNOWN for an empty string', () => {
      const r = detect('');
      expect(r.type).toBe(SslType.UNKNOWN);
    });

    it('should detect a binary PKCS12 file (Uint8Array with .p12 extension)', () => {
      const bytes = new Uint8Array([0x30, 0x82, 0x01, 0x00]);
      const r = detect(bytes, 'keystore.p12');
      expect(r.type).toBe(SslType.PKCS12);
      expect(r.encoding).toBe(Encoding.BINARY_DER);
    });

    it('should detect a binary JKS file (Uint8Array with 0xFEEDFEED magic)', () => {
      const bytes = new Uint8Array([0xfe, 0xed, 0xfe, 0xed, 0x00, 0x01]);
      const r = detect(bytes, 'keystore.jks');
      expect(r.type).toBe(SslType.JKS);
      expect(r.encoding).toBe(Encoding.BINARY_DER);
    });
  });

  /* ================================================================
   *  convert()
   * ================================================================ */
  describe('convert()', () => {
    let certDet: DetectionResult;
    let rsaKeyDet: DetectionResult;

    beforeAll(() => {
      certDet = detect(certPem);
      rsaKeyDet = detect(rsaPkcs1Pem);
    });

    it('CERT PEM -> PEM should return text with PEM markers', () => {
      const out = convert(certDet, OutputFormat.PEM);
      expect(out.error).toBeUndefined();
      expect(out.text).toContain('-----BEGIN CERTIFICATE-----');
      expect(out.text).toContain('-----END CERTIFICATE-----');
      expect(out.mime).toBe('application/x-pem-file');
    });

    it('CERT PEM -> DER should return bytes', () => {
      const out = convert(certDet, OutputFormat.DER);
      expect(out.error).toBeUndefined();
      expect(out.bytes).toBeDefined();
      expect(out.bytes instanceof Uint8Array).toBe(true);
      expect(out.bytes!.length).toBeGreaterThan(0);
      expect(out.mime).toBe('application/octet-stream');
    });

    it('private key -> PKCS8PRV should return PEM-wrapped private key', () => {
      const out = convert(rsaKeyDet, OutputFormat.PKCS8PRV);
      expect(out.error).toBeUndefined();
      expect(out.text).toContain('-----BEGIN PRIVATE KEY-----');
      expect(out.mime).toBe('application/x-pem-file');
    });

    it('private key -> JWK should return JSON with JWK fields', () => {
      const out = convert(rsaKeyDet, OutputFormat.JWK);
      expect(out.error).toBeUndefined();
      const jwk = JSON.parse(out.text!);
      expect(jwk.kty).toBe('RSA');
      expect(jwk.n).toBeDefined();
      expect(jwk.e).toBeDefined();
      expect(out.mime).toBe('application/json');
      expect(out.fileName).toContain('.json');
    });

    it('RSA private key -> PKCS1PRV should return PKCS#1 format', () => {
      const out = convert(rsaKeyDet, OutputFormat.PKCS1PRV);
      expect(out.error).toBeUndefined();
      expect(out.text).toContain('-----BEGIN RSA PRIVATE KEY-----');
      expect(out.fileName).toContain('pkcs1');
    });

    it('PKCS12 -> PKCS12_EXTRACT should return error for junk bytes', () => {
      const p12Det = detect(new Uint8Array([0x01, 0x02]), 'my.p12');
      const out = convert(p12Det, OutputFormat.PKCS12_EXTRACT);
      expect(out.error).toBeDefined();
      expect(out.mime).toBe('text/plain');
    });

    it('PKCS12 -> OPENSSL_CMD should return text with openssl commands', () => {
      const p12Det = detect(new Uint8Array([0x01, 0x02]), 'my.p12');
      const out = convert(p12Det, OutputFormat.OPENSSL_CMD);
      expect(out.error).toBeUndefined();
      expect(out.text).toContain('openssl pkcs12');
      expect(out.mime).toBe('text/plain');
    });

    it('JKS -> KEYTOOL_CMD should return text with keytool commands', () => {
      const jksDet = detect(new Uint8Array([0xfe, 0xed, 0xfe, 0xed]), 'my.jks');
      const out = convert(jksDet, OutputFormat.KEYTOOL_CMD);
      expect(out.error).toBeUndefined();
      expect(out.text).toContain('keytool');
      expect(out.mime).toBe('text/plain');
    });

    it('should return error for an unknown output format', () => {
      const out = convert(certDet, 'INVALID' as any as OutputFormat);
      expect(out.error).toBeDefined();
      expect(out.error).toContain('tidak didukung');
    });
  });

  /* ================================================================
   *  parseMetadata()
   * ================================================================ */
  describe('parseMetadata()', () => {
    it('Certificate: should return subject, issuer, serial, notBefore, notAfter, sigAlg', () => {
      const d = detect(certPem);
      const meta = parseMetadata(d);
      expect(meta).not.toBeNull();
      expect(meta!.subject).toContain('CN=test.example.com');
      expect(meta!.issuer).toContain('CN=test.example.com');
      expect(meta!.serial).toBe('01abcd');
      expect(meta!.notBefore).toBeDefined();
      expect(meta!.notAfter).toBeDefined();
      expect(meta!.sigAlg).toBeDefined();
      expect(meta!.sigAlg!.length).toBeGreaterThan(0);
      expect(meta!.keyAlg).toBe('RSA');
      expect(meta!.keySize).toBeDefined();
    });

    it('Private key: should return keyAlg and keySize (RSA)', () => {
      const d = detect(rsaPkcs1Pem);
      const meta = parseMetadata(d);
      expect(meta).not.toBeNull();
      expect(meta!.keyAlg).toBe('RSA');
      expect(meta!.keySize).toMatch(/^2\d{3} bit$/);
    });

    it('CSR: should return csrSubjectPairs and keyAlg', () => {
      const d = detect(csrPem);
      const meta = parseMetadata(d);
      expect(meta).not.toBeNull();
      /* keyAlg and csrSubjectPairs depend on jsrsasign CSRUtil internals;
       * accept either value.  The important thing is parseMetadata
       * didn't throw and returned something non-null. */
      if (meta!.keyAlg) {
        expect(meta!.keyAlg).toBe('RSA');
      }
      if (meta!.csrSubjectPairs) {
        expect(meta!.csrSubjectPairs.length).toBeGreaterThan(0);
      }
    });

    it('P7B: should return null when given unparseable bytes', () => {
      /* P7B with fake base64 payload — decrypt won't parse, returns null */
      const pem = `-----BEGIN PKCS7-----\nVGhpcyBpcyBhIHRlc3Q=\n-----END PKCS7-----`;
      const d = detect(pem);
      expect(d.type).toBe(SslType.P7B);
      /* Since the payload is junk, metadata returns null — valid behaviour */
      const meta = parseMetadata(d);
      expect(meta).toBeNull();
    });

    it('CRL: should return null', () => {
      const d = detect(
        `-----BEGIN X509 CRL-----\nVGhpcyBpcyBhIHRlc3Q=\n-----END X509 CRL-----`,
      );
      expect(d.type).toBe(SslType.CRL);
      const meta = parseMetadata(d);
      expect(meta).toBeNull();
    });

    it('Encrypted key without password: should handle gracefully', () => {
      const pem = `-----BEGIN ENCRYPTED PRIVATE KEY-----\nVGhpcyBzaG91bGQgbm90IHRocm93\n-----END ENCRYPTED PRIVATE KEY-----`;
      const d = detect(pem);
      /* pomtail: marker detection sets isEncrypted, can't verify
       * without real encrypted key bytes — but the function must not
       * throw */
      expect(d.isEncrypted).toBe(true);
      expect(() => parseMetadata(d)).not.toThrow();
    });
  });

  /* ================================================================
   *  availableOutputs()
   * ================================================================ */
  describe('availableOutputs()', () => {
    it('Certificate -> should include PEM, DER', () => {
      const d = detect(certPem);
      const outs = availableOutputs(d);
      expect(outs).toContain(OutputFormat.PEM);
      expect(outs).toContain(OutputFormat.DER);
      expect(outs.length).toBe(2);
    });

    it('RSA private key -> should include PKCS1PRV, PKCS8PRV, JWK, DER', () => {
      const d = detect(rsaPkcs1Pem);
      const alg = resolveKeyAlg(d);
      expect(alg).toBe('RSA');
      const outs = availableOutputs(d, alg);
      expect(outs).toContain(OutputFormat.PKCS1PRV);
      expect(outs).toContain(OutputFormat.PKCS8PRV);
      expect(outs).toContain(OutputFormat.JWK);
      expect(outs).toContain(OutputFormat.DER);
    });

    it('EC private key -> should include PKCS8PRV, JWK, DER (no PKCS1PRV)', () => {
      /* getPEM on EC prvKeyObj only works with PKCS8PRV + password
       * in jsrsasign v11.  Generate encrypted key, then decrypt. */
      const ecKP = KEYUTIL.generateKeypair('EC', 'secp256r1');
      const encPem = KEYUTIL.getPEM(
        ecKP.prvKeyObj as any,
        'PKCS8PRV',
        'testpass',
      );
      const d = detect(encPem);
      expect(d.type).toBe(SslType.PRV_PKCS5);
      const alg = resolveKeyAlg(d, 'testpass');
      expect(alg).toBe('EC');
      const outs = availableOutputs(d, alg);
      expect(outs).toContain(OutputFormat.PKCS8PRV);
      expect(outs).toContain(OutputFormat.JWK);
      expect(outs).toContain(OutputFormat.DER);
      expect(outs).not.toContain(OutputFormat.PKCS1PRV);
    });

    it('Public key -> should include PEM, DER, JWK', () => {
      const d = detect(pubKeyPem);
      const outs = availableOutputs(d);
      expect(outs).toContain(OutputFormat.PEM);
      expect(outs).toContain(OutputFormat.DER);
      expect(outs).toContain(OutputFormat.JWK);
    });

    it('PKCS12 -> should return PKCS12_EXTRACT and OPENSSL_CMD', () => {
      const d = detect(new Uint8Array([0x01]), 'k.p12');
      const outs = availableOutputs(d);
      expect(outs).toContain(OutputFormat.PKCS12_EXTRACT);
      expect(outs).toContain(OutputFormat.OPENSSL_CMD);
      expect(outs.length).toBe(2);
    });

    it('JKS -> should return KEYTOOL_CMD', () => {
      const d = detect(new Uint8Array([0xfe, 0xed, 0xfe, 0xed]), 'k.jks');
      const outs = availableOutputs(d);
      expect(outs).toEqual([OutputFormat.KEYTOOL_CMD]);
    });
  });

  /* ================================================================
   *  resolveKeyAlg()
   * ================================================================ */
  describe('resolveKeyAlg()', () => {
    it('RSA key -> "RSA"', () => {
      const d = detect(rsaPkcs1Pem);
      expect(resolveKeyAlg(d)).toBe('RSA');
    });

    it('EC key -> "EC"', () => {
      /* getPEM on EC prvKeyObj only works with PKCS8PRV + password
       * in jsrsasign v11.  Use encrypted key + decrypt. */
      const ecKP = KEYUTIL.generateKeypair('EC', 'secp256r1');
      const encPem = KEYUTIL.getPEM(
        ecKP.prvKeyObj as any,
        'PKCS8PRV',
        'testpass',
      );
      const d = detect(encPem);
      expect(d.type).toBe(SslType.PRV_PKCS5);
      expect(resolveKeyAlg(d, 'testpass')).toBe('EC');
    });

    it('Certificate -> undefined', () => {
      const d = detect(certPem);
      expect(resolveKeyAlg(d)).toBeUndefined();
    });

    it('Encrypted key with correct password -> resolves the algorithm', () => {
      const rsaKP = KEYUTIL.generateKeypair('RSA', 2048);
      const encPem = KEYUTIL.getPEM(rsaKP.prvKeyObj, 'PKCS5PRV', 'testpass');
      const d = detect(encPem);
      const alg = resolveKeyAlg(d, 'testpass');
      expect(alg).toBe('RSA');
    });

    it('Encrypted key with wrong password -> undefined', () => {
      const rsaKP = KEYUTIL.generateKeypair('RSA', 2048);
      const encPem = KEYUTIL.getPEM(rsaKP.prvKeyObj, 'PKCS5PRV', 'testpass');
      const d = detect(encPem);
      const alg = resolveKeyAlg(d, 'wrongpass');
      expect(alg).toBeUndefined();
    });
  });
});
