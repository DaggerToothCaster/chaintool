<template>
  <div class="wallet-container">
    <h2 class="title">私钥加载地址</h2>
    
    <el-input 
      v-model.trim="privateKey" 
      placeholder="请输入私钥（0x开头）"
      clearable
      type="textarea" 
      :rows="3" 
    ></el-input>
    
    <div class="button-group">
      <el-button type="primary" @click="generateRandomKey">
        生成随机私钥
      </el-button>
      
      <el-button type="success" @click="loadWalletFromPrivateKey">
        通过私钥加载地址
      </el-button>
      
      <el-button @click="generateMultipleAddresses">
        生成100个地址
      </el-button>
    </div>
    
    <div class="result-section" v-if="walletAddress">
      <h3>钱包地址：</h3>
      <p class="wallet-address">
        {{ walletAddress }}
        <el-button 
          size="mini" 
          icon="el-icon-document-copy" 
          @click="copyToClipboard(walletAddress)" 
          style="margin-left: 10px;">
          复制
        </el-button>
      </p>
    </div>

    <div class="result-section" v-if="privateKey">
      <h3>私钥：</h3>
      <p class="wallet-address">
        {{ privateKey }}
        <el-button 
          size="mini" 
          icon="el-icon-document-copy" 
          @click="copyToClipboard(privateKey)" 
          style="margin-left: 10px;">
          复制
        </el-button>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WalletLoader',
  data() {
    return {
      privateKey: '',
      walletAddress: "",
    };
  },
  methods: {
    /**
     * 生成随机私钥
     */
    generateRandomKey() {
      try {
        const randomNumber = this.$ethers.utils.bigNumberify(
          this.$ethers.utils.randomBytes(32)
        );
        this.privateKey = randomNumber._hex;
      } catch (error) {
        this.$message.error('生成私钥失败: ' + error.message);
      }
    },
    
    /**
     * 通过私钥加载钱包地址
     */
    loadWalletFromPrivateKey() {
      if (!this.privateKey) {
        this.$message.warning('请输入私钥');
        return;
      }
      
      try {
        // 确保私钥以0x开头
        const formattedKey = this.privateKey.startsWith('0x') 
          ? this.privateKey 
          : `0x${this.privateKey}`;
        
        const wallet = new this.$ethers.Wallet(formattedKey);
        this.walletAddress = wallet.address;
      } catch (error) {
        this.$message.error('加载钱包地址失败: ' + error.message);
        console.error('Error loading wallet:', error);
      }
    },
    
    /**
     * 批量生成钱包地址
     */
    generateMultipleAddresses() {
      const count = 100; // 可配置化
      const addresses = [];
      
      try {
        for (let i = 0; i < count; i++) {
          const randomNumber = this.$ethers.utils.bigNumberify(
            this.$ethers.utils.randomBytes(32)
          );
          const wallet = new this.$ethers.Wallet(randomNumber._hex);
          addresses.push(wallet.address);
        }
        
        console.log('Generated addresses:', addresses);
        this.$message.success(`成功生成${count}个地址，请查看控制台输出`);
      } catch (error) {
        this.$message.error('生成地址失败: ' + error.message);
        console.error('Error generating addresses:', error);
      }
    },

    /**
     * 复制到剪贴板
     */
    copyToClipboard(value) {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.$message.success('已复制到剪贴板');
    },
  }
};
</script>

<style scoped>
.wallet-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.title {
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.el-input {
  margin-bottom: 20px;
}

.button-group {
  margin: 20px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.result-section {
  margin-top: 30px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.wallet-address {
  word-break: break-all;
  font-family: monospace;
  color: #409eff;
  display: inline-block;
  margin-right: 10px;
}
</style>
