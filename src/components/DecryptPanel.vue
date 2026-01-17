<script setup lang="ts">
import { ref, inject } from 'vue';
import { useCrypto } from '../composables/useCrypto';
import { getAllContacts } from '../utils/storage';
import { useToast } from 'vue-toastification';

const cryptoState = inject<ReturnType<typeof useCrypto>>('cryptoState');
const { cryptoService, hasKeyPair } = cryptoState || useCrypto();
const toast = useToast();

type Contact = {
  publicKey: string;
  name: string;
  key?: string;
};

type SenderInfo = {
  key: string;
  name?: string;
};

const encryptedInput = ref('');
const senderInfo = ref<SenderInfo | null>(null);
const decryptedMessage = ref('');
const contacts = ref<Contact[]>([]);
const newContact = ref<Contact | null>(null);

const handleDecrypt = () => {
  if (!hasKeyPair.value || !cryptoService.value) {
    toast.error("復号するには、まず自分の鍵を生成または読み込んでください。");
    return;
  }
  if (!encryptedInput.value) {
    toast.error("暗号化されたデータを入力してください。");
    return;
  }

  try {
    // 暗号化データから送信者の公開鍵を抽出
    let senderPublicKey: string;
    
    try {
      const encryptedData = encryptedInput.value.trim();
      const decodedData = atob(encryptedData);
      const packet = JSON.parse(decodedData);
      senderPublicKey = packet.senderPub;
    } catch {
      // JSONパース失敗時は、ユーザー入力から公開鍵を取得
      if (!senderInfo.value?.key) {
        throw new Error("送信者の公開鍵が見つかりません。暗号化されたデータが有効な形式か、送信者の公開鍵を手動で入力してください。");
      }
      senderPublicKey = senderInfo.value.key;
    }

    const result = cryptoService.value.decrypt(encryptedInput.value, senderPublicKey);
    
    decryptedMessage.value = result.message;
    
    const contactsList = getAllContacts();
    const knownContact = contactsList.find(c => c.publicKey === result.senderPub);
    
    senderInfo.value = {
      key: result.senderPub,
      name: knownContact ? knownContact.name : undefined
    };

    toast.success("復号と検証に成功しました！");
  } catch (e: any) {
    toast.error(e.message);
    decryptedMessage.value = '';
    senderInfo.value = null;
  }
};

const decryptMessage = () => {
  if (!encryptedInput.value) {
    console.error('Encrypted input is missing.');
    return;
  }

  if (!senderInfo.value || !senderInfo.value.key) {
    console.error('Sender key is missing.');
    return;
  }

  if (!cryptoService.value) {
    console.error('Crypto service is not initialized.');
    return;
  }

  const result = cryptoService.value.decrypt(
    encryptedInput.value,
    senderInfo.value.key
  );

  if (typeof result === 'object' && result !== null) {
    decryptedMessage.value = result.message;

    const knownContact = contacts.value.find(
      c => c.publicKey === result.senderPub
    );

    if (!knownContact) {
      newContact.value = {
        name: 'Unknown',
        publicKey: result.senderPub,
      };
    } else {
      senderInfo.value.name = knownContact.name;
    }
  }
};

decryptMessage();
</script>

<template>
  <section>
    <h2>📥 メッセージ受信</h2>

    <div class="field">
      <label>受信した暗号化データ</label>
      <textarea v-model="encryptedInput" placeholder="SNSからコピーした暗号文をここに貼り付け"></textarea>
      <p class="field-hint">💡 暗号化データに送信者の公開鍵が含まれている場合、自動的に抽出されます。</p>
    </div>

    <div class="field">
      <label>送信者の公開鍵（オプション）</label>
      <textarea v-model="senderInfo.key" placeholder="送信者の公開鍵をここに入力（自動抽出できない場合）"></textarea>
      <p class="field-hint">💡 暗号化データから送信者の公開鍵が抽出できない場合は、ここに手動で入力してください。</p>
    </div>

    <button @click="handleDecrypt" class="btn-secondary">復号・検証する</button>

    <div v-if="decryptedMessage" class="result-area">
      <div class="verification-badge">
        ✅ 署名検証済み: {{ senderInfo?.name ? senderInfo.name : '不明な送信者' }}
      </div>
      
      <div class="sender-key-detail">
        送信者ID: {{ senderInfo?.key }}
      </div>

      <div class="message-content">
        {{ decryptedMessage }}
      </div>
    </div>
  </section>
</template>

<style scoped>
.field {
  margin-bottom: 16px;
}

.field-hint {
  font-size: 0.85rem;
  color: #666;
  margin-top: 4px;
  font-style: italic;
}

.result-area {
  margin-top: 25px;
  border: 1px solid #2ecc71;
  border-radius: 8px;
  overflow: hidden;
  animation: fadeIn 0.5s;
}

@media (max-width: 768px) {
  .result-area {
    margin-top: 16px;
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-bottom: none;
  }
}

.verification-badge {
  background-color: #2ecc71;
  color: white;
  padding: 8px 15px;
  font-weight: bold;
  word-break: break-word;
}

@media (max-width: 768px) {
  .verification-badge {
    padding: 10px 12px;
    font-size: 14px;
  }
}

.sender-key-detail {
  background-color: #e8f8f5;
  padding: 5px 15px;
  font-size: 0.75rem;
  color: #666;
  font-family: monospace;
  border-bottom: 1px solid #ddd;
  word-break: break-all;
  line-height: 1.3;
}

@media (max-width: 768px) {
  .sender-key-detail {
    padding: 8px 12px;
    font-size: 0.7rem;
  }
}

.message-content {
  padding: 20px;
  background-color: white;
  font-size: 1.1rem;
  white-space: pre-wrap;
  color: #333;
  word-break: break-word;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .message-content {
    padding: 16px 12px;
    font-size: 15px;
    line-height: 1.6;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>