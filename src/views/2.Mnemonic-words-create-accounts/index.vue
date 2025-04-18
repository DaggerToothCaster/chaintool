<template>
  <div class="mnemonic-container">
    <h2 class="title">助记词创建账户</h2>
    
    <div class="section">
      <el-button type="primary" @click="generateMnemonic">
        生成随机助记词
      </el-button>
      
      <div v-if="generatedMnemonic" class="mnemonic-display">
        <h3>随机生成的助记词：</h3>
        <p class="mnemonic-words">{{ generatedMnemonic }}</p>
        <el-button 
          size="small" 
          @click="copyToClipboard(generatedMnemonic)"
          class="copy-btn"
        >
          复制助记词
        </el-button>
      </div>
    </div>

    <div class="section">
      <h3>助记词：</h3>
      <el-input 
        type="textarea" 
        :rows="3" 
        v-model="userMnemonic" 
        placeholder="请输入助记词，用空格分隔"
        clearable
      ></el-input>
    </div>

    <div class="section">
      <h3>派生路径：</h3>
      <el-input 
        v-model="derivationPath" 
        placeholder="输入派生路径"
      ></el-input>
      <p class="path-hint">默认路径：m/44'/60'/0'/0/0 (符合BIP44标准的以太坊路径)</p>
    </div>

    <div class="button-group">
      <el-button @click="validateMnemonic" type="success">
        校验助记词是否有效
      </el-button>
      
      <el-tag :type="validityStatus.type" class="validity-tag">
        {{ validityStatus.text }}
      </el-tag>
    </div>

    <div class="section">
      <el-button 
        type="primary" 
        @click="createWalletFromMnemonic"
        :disabled="!isMnemonicValid"
      >
        通过助记词创建地址
      </el-button>
      
      <div v-if="walletAddress" class="wallet-info">
        <h3>钱包地址：</h3>
        <p class="wallet-address">{{ walletAddress }}</p>
        <el-button 
          size="small" 
          @click="copyToClipboard(walletAddress)"
          class="copy-btn"
        >
          复制地址
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MnemonicWalletCreator',
  data() {
    return {
      derivationPath: "m/44'/60'/0'/0/0",
      userMnemonic: '', // 用户输入的助记词
      generatedMnemonic: null, // 随机生成的助记词
      isValidMnemonic: false, // 助记词是否有效
      walletAddress: "", // 生成的钱包地址
    };
  },
  computed: {
    validityStatus() {
      if (!this.userMnemonic) return { type: 'info', text: '未验证' };
      return this.isValidMnemonic 
        ? { type: 'success', text: '有效' } 
        : { type: 'danger', text: '无效' };
    },
    isMnemonicValid() {
      return this.userMnemonic && this.isValidMnemonic;
    }
  },
  methods: {
    /**
     * 生成随机助记词
     */
    generateMnemonic() {
      try {
        this.generatedMnemonic = this.$ethers.utils.HDNode.entropyToMnemonic(
          this.$ethers.utils.randomBytes(16)
        );
        this.$message.success('助记词生成成功');
      } catch (error) {
        this.$message.error('生成助记词失败: ' + error.message);
        console.error('Error generating mnemonic:', error);
      }
    },
    
    /**
     * 校验助记词是否有效
     */
    validateMnemonic() {
      if (!this.userMnemonic) {
        this.$message.warning('请输入助记词');
        return;
      }
      
      try {
        this.isValidMnemonic = this.$ethers.utils.HDNode.isValidMnemonic(this.userMnemonic);
        const message = this.isValidMnemonic ? '助记词有效' : '助记词无效';
        this.$message[this.isValidMnemonic ? 'success' : 'error'](message);
      } catch (error) {
        this.$message.error('验证助记词失败: ' + error.message);
        console.error('Error validating mnemonic:', error);
      }
    },
    
    /**
     * 通过助记词创建钱包地址
     */
    createWalletFromMnemonic() {
      if (!this.isMnemonicValid) {
        this.$message.warning('请先验证有效的助记词');
        return;
      }
      
      try {
        const wallet = this.$ethers.Wallet.fromMnemonic(
          this.userMnemonic, 
          this.derivationPath
        );
        this.walletAddress = wallet.address;
        this.$message.success('钱包地址生成成功');
      } catch (error) {
        this.$message.error('创建钱包失败: ' + error.message);
        console.error('Error creating wallet:', error);
      }
    },
    
    /**
     * 复制文本到剪贴板
     */
    copyToClipboard(text) {
      navigator.clipboard.writeText(text)
        .then(() => this.$message.success('已复制到剪贴板'))
        .catch(err => {
          console.error('Failed to copy:', err);
          this.$message.error('复制失败');
        });
    }
  }
};
</script>

<style scoped>
.mnemonic-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.title {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

.section {
  margin-bottom: 25px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.mnemonic-display, .wallet-info {
  margin-top: 15px;
}

.mnemonic-words, .wallet-address {
  word-break: break-all;
  font-family: monospace;
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.button-group {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 20px 0;
}

.validity-tag {
  font-size: 14px;
  padding: 0 10px;
  height: 32px;
  line-height: 32px;
}

.path-hint {
  font-size: 12px;
  color: #888;
  margin-top: 5px;
}

.copy-btn {
  margin-top: 5px;
}

.el-textarea, .el-input {
  margin-top: 10px;
}
</style>