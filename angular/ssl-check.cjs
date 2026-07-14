// ssl-check.cjs — Cek SSL expired, detail, full chain. CLI only.
// Usage: node ssl-check.cjs <host:port>
// Contoh: node ssl-check.cjs 192.168.1.11:443

const tls = require('tls');

const target = process.argv[2];
if (!target) {
  console.log('Usage:  node ssl-check.cjs <host:port>');
  console.log('Contoh: node ssl-check.cjs 192.168.1.1:443');
  console.log('        node ssl-check.cjs google.com');
  process.exit(1);
}

const [host, portStr = '443'] = target.split(':');
const port = parseInt(portStr);

function fmtDate(d) {
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function cn(dn) { return dn?.CN || 'N/A'; }
function org(dn) { return dn?.O || ''; }

const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: false }, () => {
  const cert = socket.getPeerCertificate(true);
  const proto = socket.getProtocol();
  const cipher = socket.getCipher();
  const authorized = socket.authorized;
  const authError = socket.authorizationError;

  socket.end();

  if (!cert || !cert.valid_to) {
    console.error('❌ No certificate found on ' + target);
    process.exit(1);
  }

  const notAfter = new Date(cert.valid_to);
  const notBefore = new Date(cert.valid_from);
  const daysLeft = Math.ceil((notAfter - Date.now()) / 86400000);
  const status = daysLeft > 0 ? '✅ VALID' : '❌ EXPIRED';
  const expiredColor = daysLeft > 30 ? 2 : daysLeft > 7 ? 3 : 1;
  const reset = '\x1b[0m';
  const c1 = `\x1b[3${expiredColor}m`;

  const stripDNS = s => s.trim().replace(/^DNS:/, '').replace(/^IP Address:/, '');

  // Full chain
  const chain = [];
  let c = cert;
  while (c) {
    chain.push({
      subject: cn(c.subject),
      issuer: cn(c.issuer) || org(c.issuer) || 'N/A',
      serial: (c.serialNumber || '').slice(0, 16),
      validTo: c.valid_to ? fmtDate(new Date(c.valid_to)) : '?',
      fingerprint: (c.fingerprint || '').slice(0, 23) + '...',
    });
    c = c.issuerCertificate;
    if (c && c === cert) break; // self-signed
  }

  // Output
  console.log('');
  console.log('  ███████╗ ███████╗ ██╗         ██████╗██╗  ██╗███████╗ ██████╗██╗  ██╗');
  console.log('  ██╔════╝ ██╔════╝ ██║        ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝');
  console.log('  ███████╗ ███████╗ ██║        ██║     ███████║█████╗  ██║     █████╔╝ ');
  console.log('  ╚════██║ ╚════██║ ██║        ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗ ');
  console.log('  ███████║ ███████║ ███████╗██╗╚██████╗██║  ██║███████╗╚██████╗██║  ██╗');
  console.log('  ╚══════╝ ╚══════╝ ╚══════╝╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝');
  console.log('');
  console.log(`  Target:    ${host}:${port}`);
  console.log(`  Subject:   ${cn(cert.subject)}`);
  console.log(`  Issuer:    ${[org(cert.issuer), cn(cert.issuer)].filter(Boolean).join(' / ') || 'N/A'}`);
  console.log(`  Status:    ${c1}${status}${reset}`);
  console.log(`  Expired:   ${c1}${daysLeft} hari${reset}   (${fmtDate(notBefore)} — ${fmtDate(notAfter)})`);
  console.log('');
  console.log('  ── Connection ──');
  console.log(`  TLS:       ${proto || '?'}`);
  console.log(`  Cipher:    ${cipher?.name || '?'}`);
  console.log(`  Verified:  ${authorized ? '✅ Chain trusted' : '⚠ ' + (authError || 'untrusted')}`);
  console.log(`  Key:       ${cert.bits || '?'}-bit`);
  console.log(`  Serial:    ${cert.serialNumber || '?'}`);
  console.log('');
  console.log('  ── Fingerprints ──');
  console.log(`  SHA1:      ${cert.fingerprint || '?'}`);
  console.log(`  SHA256:    ${cert.fingerprint256 || '?'}`);
  console.log('');

  // SAN list
  const sans = (cert.subjectaltname || '').split(',').map(stripDNS).filter(Boolean);
  if (sans.length > 0) {
    console.log(`  ── SAN (${sans.length}) ──`);
    sans.forEach(s => console.log(`  ${s}`));
    console.log('');
  }

  // Chain
  console.log(`  ── Certificate Chain (${chain.length}) ──`);
  chain.forEach((c, i) => {
    const pad = i === 0 ? '►' : '  ';
    const indent = i === 0 ? ' ' : '↳';
    console.log(`  ${pad} ${indent} ${c.subject}  →  ${c.issuer}`);
    console.log(`     Serial:${c.serial}  Valid until:${c.validTo}  SHA1:${c.fingerprint}`);
  });
  console.log('');
});

socket.setTimeout(8000, () => {
  socket.destroy();
  console.error('❌ Timeout — cannot reach ' + target);
  process.exit(1);
});

socket.on('error', err => {
  console.error('❌ ' + err.message);
  process.exit(1);
});
