import { Component, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'crypto',
  templateUrl: './crypto.component.html',
  styleUrls: ['./crypto.component.css']
})
export class CryptoComponent {
  iv = CryptoJS.lib.WordArray.random(128 / 16).toString();
  salt = CryptoJS.lib.WordArray.random(128 / 16).toString();
  mode = "mcb-v2";

  key: any = {
    "messi": "9C0XAVRJ6PQB86TVTAD6SK6XD01PSCIK",
    "mcb": "tK5UTui+DPh8lIlBxya5XVsmeDCoUl6vHhdIESMB6sQ=",
    "mcb-v2": "kob98nxO/Y/oAVIBrIyn5E/zG0TNIVUiPE8XFV2/IrQ="
  }

  saltMcbV2 : any;

  inputEncrypt: string = "";
  inputDecrypt: string = "";
  inputDecode: string = "";

  resultEncrypt: string = "";
  resultDecrypt: string = "";
  resultDecode: string = "";

  isErrorDecrypt: boolean = false;
  isErrorDecode: boolean = false;

  private readonly AES_KEY_SIZE = 256; // bits
  private readonly SALT_LENGTH = 16; // bytes
  private readonly GCM_IV_LENGTH = 12; // bytes
  private readonly GCM_TAG_LENGTH = 16; // bytes
  private readonly PBKDF2_ITERATIONS = 2_500;
  private readonly AAD_LENGTH = 8; // bytes
  private readonly CIPHER_ALGORITHM = 'AES-GCM'; // Sesuaikan jika perlu


  private snackBar = inject(MatSnackBar);

  async encryptButton() {
    if (this.mode == "mcb-v2") {
      this.encryptMcbV2();
    } else {
      this.encryptV1();
    }
  }

  async decryptButton() {
    if (this.mode == "mcb-v2") {
      this.decryptMcbV2();
    } else {
      this.decryptV1();
    }
  }

  decodeButton() {
    try {
      this.resultDecode = this.decode(this.inputDecode);
    }
    catch (e) {
      this.resultDecode = "Failed to Decode: " + e;
      this.isErrorDecode = true;
    }
  }

  copyText(value: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = value;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    let matConfig = { "duration": 2000 }
    this.snackBar.open("Copy to Clipboard Success", "Close", matConfig);
  }


  //Private
  private encryptV1(): any {
    const value = CryptoJS.enc.Utf8.parse(this.inputEncrypt);
    const valueB64 = CryptoJS.enc.Base64.stringify(value);

    const iv = CryptoJS.enc.Utf8.parse(this.iv);
    const ivB64 = CryptoJS.enc.Base64.stringify(iv);

    const salt = CryptoJS.enc.Utf8.parse(this.salt);
    const saltB64 = CryptoJS.enc.Base64.stringify(salt);

    var key = this.generateKey(salt, this.key[this.mode]);
    var encrypted = CryptoJS.AES.encrypt(valueB64, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });
    var ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

    const gabungan = ivB64 + "::" + saltB64 + "::" + ciphertext;
    const gabunganByteArray = CryptoJS.enc.Utf8.parse(gabungan);
    const gabunganB64 = CryptoJS.enc.Base64.stringify(gabunganByteArray);

    this.resultEncrypt = gabunganB64
    console.log(gabungan, gabunganByteArray, gabunganB64)
  }


  private decryptV1(): any {
    try {
      this.isErrorDecrypt = false;
      const gabunganDec = this.decode(this.inputDecrypt)
      const gabungan = gabunganDec.split("::");

      const ivB64 = gabungan[0];
      const iv = CryptoJS.enc.Base64.parse(ivB64);

      const saltB64 = gabungan[1]
      const salt = CryptoJS.enc.Base64.parse(saltB64);

      const chiperTextB64 = gabungan[2].replace(/\r/g, '').replace(/\n/g, '');
      const chiperText = CryptoJS.enc.Base64.parse(chiperTextB64);


      var key = this.generateKey(salt, this.key[this.mode]);
      var cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext: chiperText });
      var decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
      });
      var decodeUTF8 = CryptoJS.enc.Utf8.stringify(decrypted);
      if (this.mode == "mcb") {
        this.resultDecrypt = decodeUTF8;
      }
      else {
        console.log(decodeUTF8);
        var decode = this.decode(decodeUTF8);

        this.resultDecrypt = decode;
        console.log(decode);
      }
    } catch (e) {
      this.resultDecrypt = "Failed to Decrypt: " + e;
      this.isErrorDecrypt = true;
    }
  }

  private decode(value: string) {
    const base64 = CryptoJS.enc.Base64.parse(value);
    console.log(base64);
    return CryptoJS.enc.Utf8.stringify(base64)
  }

  private generateKey(salt: any, passPhrase: any) {
    return CryptoJS.PBKDF2(passPhrase, salt, { keySize: 256 / 32, iterations: 1000, hasher: CryptoJS.algo.SHA1 });
  }


  private async encryptMcbV2() {
    if (!this.inputEncrypt || this.inputEncrypt.trim() === '') {
      this.resultEncrypt = '';
    }

    let salt;
    if(!this.saltMcbV2){
      salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      this.saltMcbV2 = salt;
    }else{
      salt = this.saltMcbV2;
    }
    const iv = crypto.getRandomValues(new Uint8Array(this.GCM_IV_LENGTH));
    const timestampAAD = new Uint8Array(this.AAD_LENGTH);
    const timestamp = Date.now();
    const dataView = new DataView(timestampAAD.buffer);

    // Konversi timestamp menjadi dua bilangan 32-bit (high dan low)
    const high = Math.floor(timestamp / 0x100000000); // 2^32
    const low = timestamp % 0x100000000;

    // Tulis high dan low ke DataView (big-endian)
    dataView.setUint32(0, high, false);
    dataView.setUint32(4, low, false);

    try {
      const key = await this.generateKeyMcbV2(salt);

      const encodedPlaintext = new TextEncoder().encode(this.inputEncrypt);

      const algorithm = {
        name: this.CIPHER_ALGORITHM,
        iv: iv,
        additionalData: timestampAAD,
        tagLength: this.GCM_TAG_LENGTH * 8, // Dalam bits
      };

      const cipherTextBuffer = await window.crypto.subtle.encrypt(
        algorithm,
        key,
        encodedPlaintext
      );

      const cipherTextBytes = new Uint8Array(cipherTextBuffer);
      const output = new Uint8Array(
        timestampAAD.length + salt.length + iv.length + cipherTextBytes.length
      );

      output.set(timestampAAD, 0);
      output.set(salt, timestampAAD.length);
      output.set(iv, timestampAAD.length + salt.length);
      output.set(cipherTextBytes, timestampAAD.length + salt.length + iv.length);

      // URL-safe Base64 tanpa padding
      const base64String = btoa(String.fromCharCode(...output));
      this.resultEncrypt = base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    } catch (error) {
      console.error('Encryption error:', error);
      this.resultEncrypt = '';
    }
  }

  private async decryptMcbV2() {
    if (!this.inputDecrypt || this.inputDecrypt.trim() === '') {
      this.resultDecrypt = '';
    }
    try {
      const base64String = this.inputDecrypt.replace(/-/g, '+').replace(/_/g, '/');
      const decodedBytes = new Uint8Array(atob(base64String).split('').map(char => char.charCodeAt(0)));

      const timestampAAD = decodedBytes.slice(0, this.AAD_LENGTH);
      const salt = decodedBytes.slice(this.AAD_LENGTH, this.AAD_LENGTH + this.SALT_LENGTH);
      const iv = decodedBytes.slice(this.AAD_LENGTH + this.SALT_LENGTH, this.AAD_LENGTH + this.SALT_LENGTH + this.GCM_IV_LENGTH);
      const encryptedText = decodedBytes.slice(this.AAD_LENGTH + this.SALT_LENGTH + this.GCM_IV_LENGTH);

      const key = await this.generateKeyMcbV2(salt);

      const algorithm = {
        name: this.CIPHER_ALGORITHM,
        iv: iv,
        additionalData: timestampAAD,
        tagLength: this.GCM_TAG_LENGTH * 8, // Dalam bits
      };

      const plaintextBuffer = await window.crypto.subtle.decrypt(
        algorithm,
        key,
        encryptedText
      );

      this.resultDecrypt = new TextDecoder().decode(plaintextBuffer);
    } catch (error) {
      console.error('Decryption error:', error);
      this.resultDecrypt = '';
    }
  }

  private async generateKeyMcbV2(salt: any): Promise<any> {
    // Derive the key using PBKDF2
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.key[this.mode]),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
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
      ["encrypt", "decrypt"]
    );
  }

}
