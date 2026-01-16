import nacl from 'tweetnacl';

export interface EncryptedPacket {
  alg: 'X25519+XChaCha20-Poly1305+Ed25519';
  epk: string;
  nonce: string;
  ct: string;
  sig: string;
  senderPub: string;
}

const toBase64 = (buf: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < buf.byteLength; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return globalThis.btoa(binary);
};

const fromBase64 = (str: string): Uint8Array => {
  const binary = globalThis.atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

type DecryptResult = {
  message: string;
  senderPub: string;
};

export class CryptoService {
  private keyPair: any;

  constructor(privateKeyBase64?: string) {
    if (privateKeyBase64) {
      try {
        const privateKey = fromBase64(privateKeyBase64);
        this.keyPair = (nacl.box.keyPair as any).fromSecretKey(privateKey);
      } catch (e) {
        console.error("Invalid private key provided:", e);
        throw new Error("提供された秘密鍵が無効です。");
      }
    } else {
      this.keyPair = (nacl.box.keyPair as any)();
    }
  }

  getPublicKey(): string {
    return toBase64(this.keyPair.publicKey);
  }

  getPrivateKey(): string {
    return toBase64(this.keyPair.secretKey);
  }

  encrypt(message: string, receiverPublicKeyBase64: string): string {
    try {
      const receiverPublicKey = fromBase64(receiverPublicKeyBase64);
      const messageBuffer = new TextEncoder().encode(message);
      const nonce = nacl.randomBytes((nacl.box as any).nonceLength);
      
      const ciphertext = (nacl.box as any)(
        messageBuffer,
        nonce,
        receiverPublicKey,
        this.keyPair.secretKey
      );

      if (!ciphertext) {
        throw new Error("Encryption failed");
      }

      const packet: EncryptedPacket = {
        alg: 'X25519+XChaCha20-Poly1305+Ed25519',
        epk: toBase64(this.keyPair.publicKey),
        nonce: toBase64(nonce),
        ct: toBase64(ciphertext),
        sig: '',
        senderPub: this.getPublicKey()
      };

      return toBase64(
        new TextEncoder().encode(JSON.stringify(packet))
      );
    } catch (e) {
      console.error("Encryption error:", e);
      throw new Error("暗号化に失敗しました。");
    }
  }

  decrypt(
    encryptedDataBase64: string,
    senderPublicKeyBase64: string
  ): DecryptResult {
    try {
      const encryptedData = fromBase64(encryptedDataBase64);
      const packetStr = new TextDecoder().decode(encryptedData);
      const packet = JSON.parse(packetStr) as EncryptedPacket;

      const senderPublicKey = fromBase64(senderPublicKeyBase64);
      const nonce = fromBase64(packet.nonce);
      const ciphertext = fromBase64(packet.ct);

      const messageBuffer = (nacl.box as any).open(
        ciphertext,
        nonce,
        senderPublicKey,
        this.keyPair.secretKey
      );

      if (!messageBuffer) {
        throw new Error("Decryption failed");
      }

      const decryptedMessage = new TextDecoder().decode(messageBuffer);

      return {
        message: decryptedMessage,
        senderPub: senderPublicKeyBase64,
      };
    } catch (e) {
      console.error("Decryption error:", e);
      throw new Error("復号化に失敗しました。");
    }
  }
}
