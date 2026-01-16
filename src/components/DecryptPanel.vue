<script setup lang="ts">
import { ref } from 'vue';
import { useCrypto } from '../composables/useCrypto';
import { getAllContacts } from '../utils/storage';
import { useToast } from 'vue-toastification';

const { cryptoService } = useCrypto();
const toast = useToast();

const encryptedInput = ref('');
const decryptedMessage = ref('');
const senderInfo = ref<{ key: string, name?: string } | null>(null);

const handleDecrypt = () => {
  if (!cryptoService.value) {
    toast.error("復号するには、まず自分の鍵をロードしてください。");
    return;
  }
  if (!encryptedInput.value) return;

  try {
    const result = cryptoService.value.decrypt(encryptedInput.value);
    
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