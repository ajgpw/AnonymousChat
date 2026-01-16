import { ref, computed, Ref } from 'vue';
import { CryptoService } from '../utils/crypto';
import { useToast } from 'vue-toastification';
import { saveKeyEncrypted, loadKeyEncrypted, clearStoredKey } from '../utils/storage';

interface UseCryptoResult {
  cryptoService: Ref<CryptoService | null>;
  myPublicKey: Ref<string>;
  isLoading: Ref<boolean>;
  hasKeyPair: Ref<boolean>;
  loadKeyPair: (password: string) => Promise<boolean>;
  generateKeyPair: (password: string) => Promise<boolean>;
  clearKeyPair: () => void;
}

export function useCrypto(): UseCryptoResult {
  const toast = useToast();
  const cryptoService = ref<CryptoService | null>(null);
  const isLoading = ref(false);
  const myPublicKey = computed(() => cryptoService.value?.getPublicKey() || '');
  const hasKeyPair = computed(() => cryptoService.value !== null);

  // 鍵ペアの読み込み
  const loadKeyPair = async (password: string): Promise<boolean> => {
    isLoading.value = true;
    try {
      const privateKey = await loadKeyEncrypted(password);
      if (privateKey) {
        cryptoService.value = new CryptoService(privateKey);
        toast.success("鍵ペアを正常に読み込みました。");
        return true;
      } else {
        toast.info("保存された鍵ペアがありません。");
        return false;
      }
    } catch (error: any) {
      toast.error(`鍵の読み込みに失敗: ${error.message}`);
      console.error("Load key pair error:", error);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 鍵ペアの生成と保存
  const generateKeyPair = async (password: string): Promise<boolean> => {
    isLoading.value = true;
    try {
      const newService = new CryptoService();
      await saveKeyEncrypted(newService.getPrivateKey(), password);
      cryptoService.value = newService;
      toast.success("新しい鍵ペアを生成し、保存しました。");
      return true;
    } catch (error: any) {
      toast.error(`鍵の生成/保存に失敗: ${error.message}`);
      console.error("Generate key pair error:", error);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 鍵ペアのクリア
  const clearKeyPair = () => {
    if (confirm("本当に鍵ペアを削除しますか？過去のメッセージは復号できなくなります！")) {
      cryptoService.value = null;
      clearStoredKey();
      toast.warning("鍵ペアを削除しました。");
    }
  };

  return {
    cryptoService: cryptoService as Ref<CryptoService | null>,
    myPublicKey,
    isLoading,
    hasKeyPair,
    loadKeyPair,
    generateKeyPair,
    clearKeyPair,
  };
}