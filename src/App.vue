<script setup lang="ts">
import { ref } from 'vue';
import KeyManager from './components/KeyManager.vue';
import ContactManager from './components/ContactManager.vue';
import EncryptPanel from './components/EncryptPanel.vue';
import DecryptPanel from './components/DecryptPanel.vue';

// 連絡先リストで選択された鍵を暗号化パネルに渡すための状態
const selectedContactKey = ref('');

const onSelectContact = (key: string) => {
  selectedContactKey.value = key;
  // スマホなどでスクロールさせるUXを入れても良い
  document.getElementById('encrypt-section')?.scrollIntoView({ behavior: 'smooth' });
};
</script>

<template>
  <div class="app-container">
    <header>
      <h1>🔐 Secure Copy-Paste Chat</h1>
      <p class="subtitle">
        前方秘匿性(PFS)と署名検証を備えた、最強のコピペ暗号化ツール<br>
        <small>Powered by Vue 3 & Libsodium (X25519 + XChaCha20-Poly1305 + Ed25519)</small>
      </p>
    </header>

    <main>
      <div class="full-width">
        <KeyManager />
      </div>

      <div class="grid-layout">
        <div class="main-column">
          <div id="encrypt-section">
            <EncryptPanel :initialTargetKey="selectedContactKey" />
          </div>
          <DecryptPanel />
        </div>

        <div class="side-column">
          <ContactManager @select-contact="onSelectContact" />
        </div>
      </div>
    </main>

    <footer>
      <p>⚠️ 注意: 秘密鍵のパスワードを忘れると復旧できません。セキュリティのため、通信ログはこのツールに保存されません。</p>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1200px; /* 少し広めに */
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 30px;
}
.subtitle {
  color: #666;
}

.full-width {
  margin-bottom: 20px;
}

.grid-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

/* PC画面など幅広の場合のレイアウト */
@media (min-width: 768px) {
  .grid-layout {
    grid-template-columns: 2fr 1fr; /* 左2:右1 */
  }
}

footer {
  margin-top: 50px;
  text-align: center;
  font-size: 0.8rem;
  color: #999;
  border-top: 1px solid #eee;
  padding-top: 20px;
}
</style>