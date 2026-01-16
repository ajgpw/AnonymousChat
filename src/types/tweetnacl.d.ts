declare module 'tweetnacl' {
  export interface BoxKeyPair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  }

  export namespace box {
    function keyPair(): BoxKeyPair;
    function randomBytes(n: number): Uint8Array;
  }

  export namespace secretbox {
    function keyFromString(str: string): Uint8Array;
  }

  export function randomBytes(n: number): Uint8Array;
}

declare module 'tweetnacl-util' {
  export function encodeBase64(arr: Uint8Array): string;
  export function decodeBase64(str: string): Uint8Array;
}
