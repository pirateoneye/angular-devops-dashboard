import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as CryptoJS from 'crypto-js';

// crypto-js types do not expose `lib` as a type namespace through the module
// import, so derive the WordArray type from the runtime factory.
type CryptoWordArray = ReturnType<typeof CryptoJS.lib.WordArray.random>;
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../module/material.module';
import { MsvFormsModule } from '../../../shared/components/msv-forms/msv-forms.module';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MaterialModule,
    MsvFormsModule,
  ],
  selector: 'crypto',
  templateUrl: './crypto.component.html',
  styleUrls: ['./crypto.component.css'],
})
export class CryptoComponent {
  iv = CryptoJS.lib.WordArray.random(128 / 16).toString();
  salt = CryptoJS.lib.WordArray.random(128 / 16).toString();
  mode = 'mcb-v2';

  // SECURITY NOTE: These passphrases are intentional shared secrets used for
  // compatibility with the existing MCB/messi protocol. They are NOT a security
  // boundary: anyone who downloads this app can decrypt or forge payloads
  // encrypted with them (especially V1 CBC mode). Only the V2 (mcb-v2) path
  // should be used for new encryption. Do not treat ciphertext produced here as
  // confidentiality-protected. (See audit findings SEC-05.)
  key: Record<string, string> = {
    messi: '9C0XAVRJ6PQB86TVTAD6SK6XD01PSCIK',
    mcb: 'tK5UTui+DPh8lIlBxya5XVsmeDCoUl6vHhdIESMB6sQ=',
    'mcb-v2': 'kob98nxO/Y/oAVIBrIyn5E/zG0TNIVUiPE8XFV2/IrQ=',
  };

  saltMcbV2: Uint8Array | string | undefined;

  inputEncrypt: string = '';
  inputDecrypt: string = '';
  inputDecode: string = '';

  resultEncrypt: string = '';
  resultDecrypt: string = '';
  resultDecode: string = '';

  isErrorDecrypt: boolean = false;
  isErrorDecode: boolean = false;

  // Form validation
  showEncryptError: boolean = false;
  showDecryptError: boolean = false;
  showDecodeError: boolean = false;

  // Copy feedback
  copyFeedbackEncrypt: boolean = false;
  copyFeedbackDecrypt: boolean = false;
  copyFeedbackDecode: boolean = false;
  private copyTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  // Loading states for async V2 operations
  isEncrypting: boolean = false;
  isDecrypting: boolean = false;

  private readonly AES_KEY_SIZE = 256; // bits
  private readonly SALT_LENGTH = 16; // bytes
  private readonly GCM_IV_LENGTH = 12; // bytes
  private readonly GCM_TAG_LENGTH = 16; // bytes
  private readonly PBKDF2_ITERATIONS = 2_500;
  private readonly AAD_LENGTH = 8; // bytes
  private readonly CIPHER_ALGORITHM = 'AES-GCM'; // Sesuaikan jika perlu

  private snackBar = inject(MatSnackBar);

  async encryptButton() {
    this.showEncryptError = false;
    if (!this.inputEncrypt || this.inputEncrypt.trim() === '') {
      this.showEncryptError = true;
      return;
    }
    if (this.mode == 'mcb-v2') {
      await this.encryptMcbV2();
    } else {
      this.encryptV1();
    }
  }

  async decryptButton() {
    this.showDecryptError = false;
    if (!this.inputDecrypt || this.inputDecrypt.trim() === '') {
      this.showDecryptError = true;
      return;
    }
    if (this.mode == 'mcb-v2') {
      await this.decryptMcbV2();
    } else {
      this.decryptV1();
    }
  }

  decodeButton() {
    this.showDecodeError = false;
    if (!this.inputDecode || this.inputDecode.trim() === '') {
      this.showDecodeError = true;
      return;
    }
    try {
      this.resultDecode = this.decode(this.inputDecode);
    } catch (e) {
      this.resultDecode = 'Failed to Decode: ' + e;
      this.isErrorDecode = true;
    }
  }

  copyText(value: string, feedbackKey: 'encrypt' | 'decrypt' | 'decode') {
    if (!value) return;
    navigator.clipboard
      .writeText(value)
      .then(() => {
        const matConfig = { duration: 2000 };
        this.snackBar.open('Copy to Clipboard Success', 'Close', matConfig);
        if (feedbackKey === 'encrypt') this.copyFeedbackEncrypt = true;
        if (feedbackKey === 'decrypt') this.copyFeedbackDecrypt = true;
        if (feedbackKey === 'decode') this.copyFeedbackDecode = true;
        if (this.copyTimers[feedbackKey])
          clearTimeout(this.copyTimers[feedbackKey]);
        this.copyTimers[feedbackKey] = setTimeout(() => {
          if (feedbackKey === 'encrypt') this.copyFeedbackEncrypt = false;
          if (feedbackKey === 'decrypt') this.copyFeedbackDecrypt = false;
          if (feedbackKey === 'decode') this.copyFeedbackDecode = false;
        }, 2000);
      })
      .catch(() => {
        this.snackBar.open('Failed to copy to clipboard', 'Close', {
          duration: 3000,
        });
      });
  }

  // Private

  // LEGACY (SEC-07): V1 uses PBKDF2-SHA1 with only 1000 iterations, well below
  // modern guidance (>=100k). Combined with the hardcoded passphrase (SEC-05),
  // V1 ciphertexts are weak. Prefer encryptMcbV2() for new encryption; V1 is
  // retained only for decrypting legacy payloads.
  private encryptV1(): void {
    const value = CryptoJS.enc.Utf8.parse(this.inputEncrypt);
    const valueB64 = CryptoJS.enc.Base64.stringify(value);

    const iv = CryptoJS.enc.Utf8.parse(this.iv);
    const ivB64 = CryptoJS.enc.Base64.stringify(iv);

    const salt = CryptoJS.enc.Utf8.parse(this.salt);
    const saltB64 = CryptoJS.enc.Base64.stringify(salt);

    const key = this.generateKey(salt, this.key[this.mode]);
    const encrypted = CryptoJS.AES.encrypt(valueB64, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    });
    const ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

    const gabungan = ivB64 + '::' + saltB64 + '::' + ciphertext;
    const gabunganByteArray = CryptoJS.enc.Utf8.parse(gabungan);
    const gabunganB64 = CryptoJS.enc.Base64.stringify(gabunganByteArray);

    this.resultEncrypt = gabunganB64;
  }

  private decryptV1(): void {
    try {
      this.isErrorDecrypt = false;
      const gabunganDec = this.decode(this.inputDecrypt);
      const gabungan = gabunganDec.split('::');

      const ivB64 = gabungan[0];
      const iv = CryptoJS.enc.Base64.parse(ivB64);

      const saltB64 = gabungan[1];
      const salt = CryptoJS.enc.Base64.parse(saltB64);

      const chiperTextB64 = gabungan[2].replace(/\r/g, '').replace(/\n/g, '');
      const chiperText = CryptoJS.enc.Base64.parse(chiperTextB64);

      const key = this.generateKey(salt, this.key[this.mode]);
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: chiperText,
      });
      const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC,
      });
      const decodeUTF8 = CryptoJS.enc.Utf8.stringify(decrypted);
      if (this.mode == 'mcb') {
        this.resultDecrypt = decodeUTF8;
      } else {
        const decode = this.decode(decodeUTF8);

        this.resultDecrypt = decode;
      }
    } catch (e) {
      this.resultDecrypt = 'Failed to Decrypt: ' + e;
      this.isErrorDecrypt = true;
    }
  }

  private decode(value: string) {
    const base64 = CryptoJS.enc.Base64.parse(value);
    return CryptoJS.enc.Utf8.stringify(base64);
  }

  private generateKey(
    salt: CryptoWordArray,
    passPhrase: string,
  ): CryptoWordArray {
    return CryptoJS.PBKDF2(passPhrase, salt, {
      keySize: 256 / 32,
      iterations: 1000,
      hasher: CryptoJS.algo.SHA1,
    });
  }

  private async encryptMcbV2() {
    this.isEncrypting = true;
    try {
      let salt: Uint8Array;
      if (!this.saltMcbV2) {
        salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
        this.saltMcbV2 = salt;
      } else {
        salt = this.saltMcbV2 as Uint8Array;
      }
      const iv = crypto.getRandomValues(new Uint8Array(this.GCM_IV_LENGTH));
      const timestampAAD = new Uint8Array(this.AAD_LENGTH);
      const timestamp = Date.now();
      const dataView = new DataView(timestampAAD.buffer);

      const high = Math.floor(timestamp / 0x100000000);
      const low = timestamp % 0x100000000;

      dataView.setUint32(0, high, false);
      dataView.setUint32(4, low, false);

      const key = await this.generateKeyMcbV2(salt);

      const encodedPlaintext = new TextEncoder().encode(this.inputEncrypt);

      const algorithm = {
        name: this.CIPHER_ALGORITHM,
        iv: iv,
        additionalData: timestampAAD,
        tagLength: this.GCM_TAG_LENGTH * 8,
      };

      const cipherTextBuffer = await window.crypto.subtle.encrypt(
        algorithm,
        key,
        encodedPlaintext,
      );

      const cipherTextBytes = new Uint8Array(cipherTextBuffer);
      const output = new Uint8Array(
        timestampAAD.length + salt.length + iv.length + cipherTextBytes.length,
      );

      output.set(timestampAAD, 0);
      output.set(salt, timestampAAD.length);
      output.set(iv, timestampAAD.length + salt.length);
      output.set(
        cipherTextBytes,
        timestampAAD.length + salt.length + iv.length,
      );

      const base64String = btoa(String.fromCharCode(...output));
      this.resultEncrypt = base64String
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } catch (error) {
      console.error('Encryption error:', error);
      this.resultEncrypt = '';
    } finally {
      this.isEncrypting = false;
    }
  }

  private async decryptMcbV2() {
    this.isDecrypting = true;
    try {
      const base64String = this.inputDecrypt
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const decodedBytes = new Uint8Array(
        atob(base64String)
          .split('')
          .map((char) => char.charCodeAt(0)),
      );

      const timestampAAD = decodedBytes.slice(0, this.AAD_LENGTH);
      const salt = decodedBytes.slice(
        this.AAD_LENGTH,
        this.AAD_LENGTH + this.SALT_LENGTH,
      );
      const iv = decodedBytes.slice(
        this.AAD_LENGTH + this.SALT_LENGTH,
        this.AAD_LENGTH + this.SALT_LENGTH + this.GCM_IV_LENGTH,
      );
      const encryptedText = decodedBytes.slice(
        this.AAD_LENGTH + this.SALT_LENGTH + this.GCM_IV_LENGTH,
      );

      const key = await this.generateKeyMcbV2(salt);

      const algorithm = {
        name: this.CIPHER_ALGORITHM,
        iv: iv,
        additionalData: timestampAAD,
        tagLength: this.GCM_TAG_LENGTH * 8,
      };

      const plaintextBuffer = await window.crypto.subtle.decrypt(
        algorithm,
        key,
        encryptedText,
      );

      this.resultDecrypt = new TextDecoder().decode(plaintextBuffer);
    } catch (error) {
      console.error('Decryption error:', error);
      this.resultDecrypt = '';
    } finally {
      this.isDecrypting = false;
    }
  }

  private async generateKeyMcbV2(salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.key[this.mode]),
      { name: 'PBKDF2' },
      false,
      ['deriveKey'],
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: this.AES_KEY_SIZE },
      false,
      ['encrypt', 'decrypt'],
    );
  }
}
