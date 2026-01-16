<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useCrypto } from '../composables/useCrypto';
import { hasStoredKey } from '../utils/storage';
import { useToast } from 'vue-toastification';

const { myPublicKey, isLoading, hasKeyPair, loadKeyPair, generateKeyPair, clearKeyPair } = useCrypto();
const toast = useToast();

const password = ref('');
const showPasswordInput = ref(false); // 鍵生成/読み込み時のパスワード入力表示
const currentAction = ref<'load' | 'generate' | null>(null);

const storedKeyExists = ref(false);

onMounted(() => {
  storedKeyExists.value = hasStoredKey();
});

watch(hasKeyPair, (newVal) => {
  if (newVal) {
    password.value = ''; // 鍵がロードされたらパスワードをクリア
    showPasswordInput.value = false;
    currentAction.value = null;
  }
});

const handleLoadKey = async () => {
  if (password.value.length < 8) {
    toast.error("パスワードは8文字以上必要です。");
    return;
  }
  const success = await loadKeyPair(password.value);
  if (success) {
    storedKeyExists.value = true;
  } else {
    // エラーはuseCryptoでToastされる
  }
};

const handleGenerateKey = async () => {
  if (password.value.length < 8) {
    toast.error("パスワードは8文字以上必要です。");
    return;
  }
  const success = await generateKeyPair(password.value);
  if (success) {
    storedKeyExists.value = true;
  } else {
    // エラーはuseCryptoでToastされる
  }
};

const handleClearKey = () => {
  clearKeyPair();
  storedKeyExists.value = false;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.info('公開鍵をコピーしました！');
  } catch (err) {
    toast.error('コピーに失敗しました。');
    console.error('Failed to copy: ', err);
  }
};
</script>

<template>
  <section>
    <h2>🔐 あなたの秘密鍵の管理</h2>

    <div v-if="isLoading">
      <p>鍵ペアの状態を読み込み中...</p>
    </div>

    <div v-else>
      <div v-if="!hasKeyPair">
        <p>鍵ペアがありません。生成するか、既存の鍵ペアを読み込んでください。</p>
        
        <div v-if="storedKeyExists && !showPasswordInput">
          <button @click="showPasswordInput = true; currentAction = 'load'" class="btn-primary">保存済みの鍵を読み込む</button>
        </div>
        <div v-else-if="!showPasswordInput">
          <button @click="showPasswordInput = true; currentAction = 'generate'" class="btn-secondary">新しい鍵ペアを生成</button>
        </div>

        <div v-if="showPasswordInput" class="password-input-area">
          <label for="keyPassword">秘密鍵を保護するパスワード:</label>
          <input 
            type="password" 
            id="keyPassword" 
            v-model="password" 
            placeholder="8文字以上のパスワード" 
            @keyup.enter="currentAction === 'load' ? handleLoadKey() : handleGenerateKey()"
          />
          <button v-if="currentAction === 'load'" @click="handleLoadKey" class="btn-primary">読み込む</button>
          <button v-if="currentAction === 'generate'" @click="handleGenerateKey" class="btn-secondary">生成して保存</button>
          <button @click="showPasswordInput = false; password = ''; currentAction = null" class="btn-info">キャンセル</button>
        </div>
      </div>

      <div v-else>
        <p><strong>あなたの公開鍵 (相手に教える):</strong></p>
        <div class="input-group">
          <input type="text" readonly :value="myPublicKey" />
          <button @click="copyToClipboard(myPublicKey)" class="btn-primary">Copy</button>
        </div>
        <p class="text-sm text-gray-600">この公開鍵を相手と交換してください。</p>

<button @click="handleClearKey" class="btn-danger">この端末から鍵を削除する</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.password-input-area {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 5px;
}
.text-sm {
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: -10px;
  margin-bottom: 15px;
}
</style>