import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';


import {
  Encoding,
  SslType,
  OutputFormat,
  type KeyAlg,
  type DetectionResult,
  type SslMetadata,
  type ConvertOutput,
  detect,
  resolveKeyAlg,
  parseMetadata,
  availableOutputs,
  convert,
  OUTPUT_LABELS,
} from './ssl-converter.logic';

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
    [OutputFormat.PKCS12_EXTRACT]: 'In-browser extraction',
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

  private readonly snackBar = inject(MatSnackBar);

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

    // Encrypted keys / PKCS12 / JKS need a password before convert
    if (d.isEncrypted || d.type === SslType.PKCS12 || d.type === SslType.JKS) {
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
    if (!this.detection) return;
    if (this.detection.isEncrypted || this.detection.type === SslType.PKCS12 || this.detection.type === SslType.JKS) {
      this.tryDecrypt();
    }
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
    else if (this.detection?.type === SslType.PKCS12 || this.detection?.type === SslType.JKS) {
      // PKCS12/JKS have no client-side metadata, but password change is valid
      this.error = '';
    } else this.error = 'Dekripsi gagal — periksa password.';
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
    // Only set top-level error; output.error is the source of truth
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
    if (this.output) this.output.error = undefined;
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
