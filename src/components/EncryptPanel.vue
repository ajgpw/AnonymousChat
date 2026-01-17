<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCrypto } from '../composables/useCrypto';
import { useToast } from 'vue-toastification';

const props = defineProps<{
  initialTargetKey?: string
}>();

const { cryptoService, hasKeyPair } = useCrypto();
const toast = useToast();

const targetPublicKey = ref('');
const message = ref('');
const encryptedResult = ref('');

// 親コンポーネントからキーが渡されたらセットする
watch(() => props.initialTargetKey, (newVal) => {
  if (newVal) targetPublicKey.value = newVal;
});

const handleEncrypt = () => {
  if (!hasKeyPair.value || !cryptoService.value) {
    toast.error("まずは自分の鍵ペアを生成または読み込んでください（上部セクション）。");
    return;
  }
  if (!targetPublicKey.value) {
    toast.warning("相手の公開鍵を入力してください。");
    return;
  }
  if (!message.value) {
    toast.warning("メッセージを入力してください。");
    return;
  }

  try {
    encryptedResult.value = cryptoService.value.encrypt(message.value, targetPublicKey.value);
    toast.success("暗号化しました！");
  } catch (e: any) {
    toast.error(e.message);
  }
};

const copyResult = () => {
  navigator.clipboard.writeText(encryptedResult.value);
  toast.info("クリップボードにコピーしました。");
};
</script>

<template>
  <section>
    <h2>📤 メッセージ送信 (Encrypt)</h2>
    
    <div class="field">
      <label>相手の公開鍵</label>
      <input type="text" v-model="targetPublicKey" placeholder="相手の公開鍵を入力 または 連絡先から選択" />
    </div>

    <div class="field">
      <label>秘密のメッセージ</label>
      <textarea v-model="message" placeholder="ここに入力した内容は暗号化されます..."></textarea>
    </div>

    <button @click="handleEncrypt" class="btn-primary">暗号化を実行</button>

    <div v-if="encryptedResult" class="output-area">
      <label>暗号化データ (これをSNSに貼り付けてください)</label>
      <div class="result-box success" @click="copyResult" title="クリックしてコピー">
        {{ encryptedResult }}
      </div>
      <p class="hint">クリックしてコピーできます</p>
    </div>
  </section>
</template>

<style scoped>
.output-area {
  margin-top: 20px;
  animation: fadeIn 0.5s;
}
.result-box {
  cursor: pointer;
  max-height: 150px;
  overflow-y: auto;
}
.result-box:hover {
  background-color: #d4edda;
}
.hint {
  font-size: 0.8rem;
  color: #666;
  text-align: right;
  margin-top: 4px;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>