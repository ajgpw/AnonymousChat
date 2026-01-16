<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { type Contact, getAllContacts, saveContact } from '../utils/storage';
import { useToast } from 'vue-toastification';

const emit = defineEmits<{
  (e: 'select-contact', publicKey: string): void
}>();

const toast = useToast();
const contacts = ref<Contact[]>([]);
const newName = ref('');
const newKey = ref('');

onMounted(() => {
  contacts.value = getAllContacts();
});

const addContact = () => {
  if (!newName.value || !newKey.value) {
    toast.warning("名前と公開鍵を入力してください。");
    return;
  }
  
  // 簡易的な重複チェック
  if (contacts.value.some(c => c.name === newName.value)) {
    toast.error("その名前は既に登録されています。");
    return;
  }

  const newContact = { name: newName.value, publicKey: newKey.value };
  contacts.value.push(newContact);
  saveContact(newContact);
  
  newName.value = '';
  newKey.value = '';
  toast.success("連絡先を保存しました。");
};

const removeContact = (index: number) => {
  const contact = contacts.value[index]; // 修正: const 宣言を if 文の外に移動
  if (contact) {
    contacts.value.splice(index, 1);
  }
};

const selectContact = (key: string) => {
  emit('select-contact', key);
  toast.info("暗号化パネルにセットしました。");
};
</script>

<template>
  <section>
    <h2>📖 連絡先リスト (Contacts)</h2>
    
    <div class="add-contact-form">
      <div class="field">
        <label>名前 (表示用)</label>
        <input type="text" v-model="newName" placeholder="例: Alice" />
      </div>
      <div class="field">
        <label>相手の公開鍵</label>
        <input type="text" v-model="newKey" placeholder="相手から貰った公開鍵を貼り付け" />
      </div>
      <button @click="addContact" class="btn-secondary">追加保存</button>
    </div>

    <hr v-if="contacts.length > 0" />

    <ul class="contact-list">
      <li v-for="(contact, index) in contacts" :key="index">
        <div class="contact-info">
          <strong>{{ contact.name }}</strong>
          <span class="key-preview">{{ contact.publicKey.substring(0, 12) }}...</span>
        </div>
        <div class="actions">
          <button @click="selectContact(contact.publicKey)" class="btn-primary btn-sm">選択</button>
          <button @click="removeContact(index)" class="btn-danger btn-sm">削除</button>
        </div>
      </li>
    </ul>
    <p v-if="contacts.length === 0" class="empty-msg">連絡先はまだありません。</p>
  </section>
</template>

<style scoped>
.add-contact-form {
  margin-bottom: 20px;
  background: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
}
.contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.contact-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}
.contact-list li:last-child {
  border-bottom: none;
}
.key-preview {
  font-family: monospace;
  color: #888;
  font-size: 0.9rem;
  margin-left: 10px;
}
.actions button {
  padding: 5px 10px;
  font-size: 0.85rem;
}
.btn-sm {
  margin-left: 5px;
}
.empty-msg {
  text-align: center;
  color: #999;
}
</style>