<script setup lang="ts">
import { ref } from 'vue';
import { useCrypto } from '../composables/useCrypto';
import { getAllContacts } from '../utils/storage';
import { useToast } from 'vue-toastification';

const { cryptoService } = useCrypto();
const toast = useToast();

type Contact = {
  publicKey: string;
  name: string;
  key?: string; // 修正: key プロパティを追加
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
  if (!cryptoService.value) {
    toast.error("復号するには、まず自分の鍵をロードしてください。");
    return;
  }
  if (!encryptedInput.value) return;

  try {
    if (!senderInfo.value?.key) {
      throw new Error("送信者の鍵が見つかりません。");
    }

    const result = cryptoService.value.decrypt(encryptedInput.value, senderInfo.value.key);
    
    // 成功時
    decryptedMessage.value = result.message;
    
    // 送信者の特定
    const contacts = getAllContacts();
    const knownContact = contacts.find(c => c.publicKey === result.senderPub);
    
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
    // 修正: senderInfo.value または senderInfo.value.key が undefined の場合に処理を中断
    console.error('Sender key is missing.');
    return;
  }

  if (!cryptoService.value) {
    console.error('Crypto service is not initialized.');
    return;
  }

  const result = cryptoService.value.decrypt(
    encryptedInput.value,
    senderInfo.value.key // 修正: senderInfo.value.key は必ず string 型
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

// decryptMessage を呼び出す例
decryptMessage();
</script>

<template>
  <section>
    <h2>📥 メッセージ受信 (Decrypt)</h2>

    <div class="field">
      <label>受信した暗号化データ</label>
      <textarea v-model="encryptedInput" placeholder="SNSからコピーした暗号文をここに貼り付け"></textarea>
    </div>

    <button @click="handleDecrypt" class="btn-secondary" :disabled="!cryptoService">復号・検証する</button>

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
.result-area {
  margin-top: 25px;
  border: 1px solid #2ecc71;
  border-radius: 8px;
  overflow: hidden;
  animation: fadeIn 0.5s;
}

.verification-badge {
  background-color: #2ecc71;
  color: white;
  padding: 8px 15px;
  font-weight: bold;
}

.sender-key-detail {
  background-color: #e8f8f5;
  padding: 5px 15px;
  font-size: 0.75rem;
  color: #666;
  font-family: monospace;
  border-bottom: 1px solid #ddd;
}

.message-content {
  padding: 20px;
  background-color: white;
  font-size: 1.1rem;
  white-space: pre-wrap;
  color: #333;
}
</style>