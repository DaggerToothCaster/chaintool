<template>
  <div class="wallet-transfer-container">
    <h2 class="title">资产转账工具</h2>

    <!-- RPC设置部分 -->
    <div class="section">
      <h3>RPC设置</h3>
      <el-input v-model="rpcUrl" placeholder="输入RPC地址 (如: https://mainnet.infura.io/v3/your-api-key)"
        clearable></el-input>
      <el-button type="primary" @click="connectRpc" :loading="connecting" class="connect-btn">
        {{ isConnected ? '已连接' : '连接RPC' }}
      </el-button>
    </div>

    <!-- 钱包加载部分 -->
    <div class="section">
      <h3>钱包加载</h3>
      <el-input type="textarea" :rows="3" v-model="privateKey" placeholder="输入钱包私钥 (0x开头)" clearable></el-input>
      <el-button type="success" @click="loadWallet" :disabled="!rpcUrl" style="margin-top: 10px;">
        加载钱包
      </el-button>

      <div v-if="walletAddress" class="wallet-info">
        <h4>钱包地址:</h4>
        <p class="address">{{ walletAddress }}</p>
        <p>ETH余额: {{ ethBalance }} ETH</p>
      </div>
    </div>

    <!-- 资产选择部分 -->
    <div class="section">
      <h3>资产选择</h3>
      <el-radio-group v-model="assetType" @change="handleAssetTypeChange">
        <el-radio-button label="native">主链资产 (ETH)</el-radio-button>
        <el-radio-button label="token">代币资产</el-radio-button>
      </el-radio-group>

      <div v-if="assetType === 'token'" class="token-section">
        <el-input v-model="tokenContractAddress" placeholder="输入代币合约地址" clearable class="token-input"></el-input>
        <el-button type="info" @click="loadTokenInfo" :disabled="!tokenContractAddress">
          加载代币信息
        </el-button>

        <div v-if="tokenInfoLoaded" class="token-info">
          <p>代币名称: {{ tokenName }} ({{ tokenSymbol }})</p>
          <p>代币余额: {{ tokenBalance }}</p>
          <p>小数位数: {{ tokenDecimals }}</p>
        </div>
      </div>
    </div>

    <!-- 转账操作部分 -->
    <div class="section">
      <h3>转账操作</h3>
      <el-input v-model="recipientAddress" placeholder="输入接收地址" clearable></el-input>

      <div class="amount-section">
        <el-input v-model="transferAmount" placeholder="输入转账金额" class="amount-input" type="number" step="any" min="0">
          <template #append>
            <span>{{ assetType === 'native' ? 'ETH' : tokenSymbol }}</span>
          </template>
        </el-input>
        <el-button type="primary" @click="setMaxAmount" :disabled="!isMaxButtonEnabled" class="max-btn">
          Max
        </el-button>
      </div>

      <el-button type="danger" @click="confirmTransfer" :disabled="!isTransferReady" :loading="transferring">
        确认转账
      </el-button>

      <!-- 确认弹窗 -->
      <el-dialog v-model="showConfirmDialog" title="确认转账" width="30%" :visible.sync="showConfirmDialog">
        <div class="confirm-dialog-content">
          <p>
            确认向 <strong>{{ recipientAddress }}</strong> 转账
            <strong>{{ transferAmount }} {{ assetType === 'native' ? 'ETH' : tokenSymbol }}</strong>?
          </p>
          <p>预计Gas费用: {{ estimatedGas }} ETH</p>
        </div>
        <template #footer>
          <el-button @click="showConfirmDialog = false">取消</el-button>
          <el-button type="danger" @click="executeTransfer">确认</el-button>
        </template>
      </el-dialog>
    </div>

    <!-- 交易状态显示 -->
    <div v-if="transactionHash" class="transaction-status">
      <h3>交易状态</h3>
      <p>
        交易哈希:
        <a :href="`https://etherscan.io/tx/${transactionHash}`" target="_blank">{{
          transactionHash
        }}</a>
      </p>
      <p v-if="transactionReceipt">
        状态: {{ transactionReceipt.status === 1 ? '成功' : '失败' }}
      </p>
      <p v-else>交易处理中...</p>
    </div>
  </div>
</template>

<script>
import { ethers } from 'ethers';

export default {
  name: 'WalletTransferTool',
  data() {
    return {
      // RPC连接相关
      rpcUrl: 'https://rpc-mainnet.noschain.org',
      isConnected: false,
      connecting: false,
      provider: null,

      // 钱包相关
      privateKey: '0x6a3ea868a70f7d83140ed0a96debf709b2684ccfe6da025f6e81acc6a42077fc',
      wallet: null,
      walletAddress: '',
      ethBalance: '0',

      // 资产相关
      assetType: 'native',
      tokenContractAddress: '0x627b03358c4bd04D0594ff7c31F38D13231f4f8a',
      tokenName: '',
      tokenSymbol: '',
      tokenBalance: '0',
      tokenDecimals: 18,
      tokenInfoLoaded: false,

      // 转账相关
      recipientAddress: '',
      transferAmount: '',
      estimatedGas: '0',
      showConfirmDialog: false,
      transferring: false,
      transactionHash: '',
      transactionReceipt: null,


      loadingBtn: false,
    };
  },
  computed: {
    isTransferReady() {
      if (
        !this.walletAddress ||
        !this.recipientAddress ||
        !this.transferAmount ||
        Number(this.transferAmount) <= 0
      ) {
        return false;
      }

      if (this.assetType === 'token' && !this.tokenInfoLoaded) {
        return false;
      }

      return true;
    },
    isMaxButtonEnabled() {
      return (
        this.walletAddress &&
        (this.assetType === 'native' || (this.assetType === 'token' && this.tokenInfoLoaded))
      );
    },
  },
  methods: {
    // 连接RPC节点
    async connectRpc() {
      if (!this.rpcUrl) {
        this.$message.warning('请输入RPC地址');
        return;
      }

      this.connecting = true;
      try {
        this.provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
        const network = await this.provider.getNetwork();
        this.$message.success(`成功连接到 ${network.name} 网络`);
        this.isConnected = true;
      } catch (error) {
        this.$message.error('连接RPC失败: ' + error.message);
        console.error('RPC连接错误:', error);
      } finally {
        this.connecting = false;
      }
    },

    // 加载钱包
    async loadWallet() {
      if (!this.privateKey) {
        this.$message.warning('请输入私钥');
        return;
      }

      try {
        const formattedKey = this.privateKey.startsWith('0x')
          ? this.privateKey
          : `0x${this.privateKey}`;

        this.wallet = new ethers.Wallet(formattedKey, this.provider);
        this.walletAddress = this.wallet.address;

        const balance = await this.provider.getBalance(this.walletAddress);
        this.ethBalance = ethers.utils.formatEther(balance);

        this.$message.success('钱包加载成功');
      } catch (error) {
        this.$message.error('加载钱包失败: ' + error.message);
        console.error('钱包加载错误:', error);
      }
    },

    // 资产类型变更处理
    handleAssetTypeChange() {
      this.tokenInfoLoaded = false;
      this.tokenContractAddress = '';
      this.tokenBalance = '0';
      this.transferAmount = '';
    },


    // 加载代币信息（兼容部分节点）


    // 加载代币信息
    async loadTokenInfo() {
      if (!this.tokenContractAddress) {
        this.$message.warning('请输入代币合约地址');
        return;
      }

      // 标准化地址（v4旧版写法）
      const contractAddress = ethers.utils.getAddress(
        this.tokenContractAddress.startsWith('0x')
          ? this.tokenContractAddress
          : `0x${this.tokenContractAddress}`
      );

      if (!this.walletAddress) {
        this.$message.warning('请先加载钱包');
        return;
      }
      const walletAddress = this.walletAddress;

      try {
        // v4版本的ABI定义
        const tokenAbi = [
          {
            "constant": true,
            "inputs": [],
            "name": "name",
            "outputs": [{ "name": "", "type": "string" }],
            "payable": false,
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "symbol",
            "outputs": [{ "name": "", "type": "string" }],
            "payable": false,
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [{ "name": "", "type": "uint8" }],
            "payable": false,
            "type": "function"
          },
          {
            "constant": true,
            "inputs": [{ "name": "_owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "", "type": "uint256" }],
            "payable": false,
            "type": "function"
          }
        ];

        // v4版本的合约初始化
        const tokenContract = new ethers.Contract(
          contractAddress,
          tokenAbi,
          this.provider
        );

        // v4版本的低级调用方法
        const safeContractCall = async (method, args = [], fallbackValue) => {
          try {
            // 标准调用
            return await tokenContract.functions[method](...args);
          } catch (error) {
            console.warn(`标准${method}()调用失败，尝试低级调用:`, error);

            try {
              // v4版本的ABI编码
              const iface = new ethers.utils.Interface(tokenAbi);
              const data = iface.functions[method].encode(args);

              const result = await this.provider.call({
                to: contractAddress,
                data
              });

              // 特殊处理返回值
              if (method === 'decimals') return parseInt(result, 16) || fallbackValue;
              if (result === '0x') return fallbackValue;

              // v4版本的结果解码
              const decoded = iface.functions[method].decode(result);
              return decoded[0] || fallbackValue;
            } catch (fallbackError) {
              console.error(`备用${method}()调用失败:`, fallbackError);
              return fallbackValue;
            }
          }
        };

        // 顺序执行调用（v4的Promise.all可能有兼容性问题）
        const name = await safeContractCall('name', [], 'Unknown Token');
        const symbol = await safeContractCall('symbol', [], '???');
        const decimals = await safeContractCall('decimals', [], 18);
        const balance = await tokenContract.functions.balanceOf(walletAddress)
          .catch(() => ethers.constants.Zero);

        // 更新状态
        this.tokenName = name;
        this.tokenSymbol = symbol;
        this.tokenDecimals = decimals;
        this.tokenBalance = ethers.utils.formatEther(balance); // v4使用formatEther统一处理
        this.tokenInfoLoaded = true;

        this.$message.success('代币信息加载成功');
      } catch (error) {
        console.error('代币加载错误:', error);
        this.$message.error(`加载失败: ${error.message}`);
      }
    },



    // 设置最大金额
    async setMaxAmount() {
      try {
        if (this.assetType === 'native') {
          // 主链资产：ETH余额 - 预估Gas费用
          const gasPrice = await this.provider.getGasPrice();
          const gasLimit = ethers.utils.bigNumberify("21000"); // 标准ETH转账Gas限制
          const gasCost = gasPrice.mul(gasLimit);
          const balance = await this.provider.getBalance(this.walletAddress);
          const maxAmount = balance.sub(gasCost);

          if (maxAmount.lte(0)) {
            this.$message.warning('余额不足以支付Gas费用');
            return;
          }

          this.transferAmount = ethers.utils.formatEther(maxAmount);
        } else {
          // 代币资产：代币余额
          this.transferAmount = this.tokenBalance;
        }
      } catch (error) {
        this.$message.error('设置最大金额失败: ' + error.message);
        console.error('设置最大金额错误:', error);
      }
    },

    // 确认转账
    async confirmTransfer() {
      if (!this.isTransferReady) {
        this.$message.warning('请填写完整转账信息');
        return;
      }

      try {
        // this.loadingBtn=true;
        let gasPrice = await this.provider.getGasPrice();
        let gasLimit;

        if (this.assetType === 'native') {
          // ETH转账Gas估算
          gasLimit = await this.provider.estimateGas({
            from: this.walletAddress,
            to: this.recipientAddress,
            value: ethers.utils.parseEther(this.transferAmount),
          });
        } else {
          // 代币转账Gas估算
          const tokenAbi = ['function transfer(address to, uint256 amount)'];
          const tokenContract = new ethers.Contract(
            this.tokenContractAddress,
            tokenAbi,
            this.provider
          );

          const amount = ethers.utils.parseUnits(this.transferAmount, this.tokenDecimals);
          gasLimit = await tokenContract.estimate.transfer(this.recipientAddress, amount, {
            from: this.walletAddress,
          });
        }

        this.estimatedGas = ethers.utils.formatEther(gasPrice.mul(gasLimit));
        this.showConfirmDialog = true; // 确保显示弹窗
        console.log('准备显示确认弹窗', this.showConfirmDialog); // 调试日志
        // this.loadingBtn=false;
      } catch (error) {
        this.$message.error('估算Gas费用失败: ' + error.message);
        console.error('Gas估算错误:', error);
        this.showConfirmDialog = false;
        // this.loadingBtn=false;
      }
    },

    // 执行转账
    async executeTransfer() {
      this.showConfirmDialog = false;
      this.transferring = true;
      this.transactionHash = '';
      this.transactionReceipt = null;

      try {
        let tx;
        if (this.assetType === 'native') {
          // ETH转账
          tx = await this.wallet.sendTransaction({
            to: this.recipientAddress,
            value: ethers.utils.parseEther(this.transferAmount),
            gasPrice: await this.provider.getGasPrice(),
            gasLimit: ethers.utils.bigNumberify("21000"),
          });
        } else {
          // 代币转账
          const tokenAbi = ['function transfer(address to, uint256 amount) returns (bool)'];
          const tokenContract = new ethers.Contract(
            this.tokenContractAddress,
            tokenAbi,
            this.wallet
          );

          const amount = ethers.utils.parseUnits(this.transferAmount, this.tokenDecimals);
          const gasPrice = await this.provider.getGasPrice();

          // 估算gas
          let gasLimit;
          try {
            gasLimit = await tokenContract.estimateGas.transfer(this.recipientAddress, amount);
          } catch (error) {
            console.error('Gas估算失败，使用默认值', error);
            gasLimit = ethers.utils.bigNumberify("100000"); // 默认gas限制
          }

          tx = await tokenContract.transfer(this.recipientAddress, amount, {
            gasPrice,
            gasLimit,
          });
        }

        this.transactionHash = tx.hash;
        this.$message.success(`${this.assetType === 'native' ? 'ETH' : '代币'}转账已提交`);

        // 等待交易确认
        const receipt = await this.provider.waitForTransaction(tx.hash);
        this.transactionReceipt = receipt;

        if (receipt.status === 1) {
          this.$message.success(`${this.assetType === 'native' ? 'ETH' : '代币'}转账成功`);
        } else {
          this.$message.error('交易执行失败');
        }

        // 刷新余额
        if (this.assetType === 'token') {
          await this.loadTokenInfo();
        }
        const balance = await this.provider.getBalance(this.walletAddress);
        this.ethBalance = ethers.utils.formatEther(balance);
      } catch (error) {
        this.$message.error('转账失败: ' + error.message);
        console.error('转账错误:', error);
      } finally {
        this.transferring = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.wallet-transfer-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  // background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f0 100%);
  min-height: 100vh;
}

.title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 2.5rem;
  position: relative;
  letter-spacing: 1px;

  &::after {
    content: '';
    position: absolute;
    bottom: -0.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 4px;
    background: #3498db;
    border-radius: 2px;
  }
}

.section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-3px);
  }
}

.section h3 {
  font-size: 1.5rem;
  color: #34495e;
  margin-bottom: 1rem;
}

.wallet-info,
.token-info,
.transaction-status {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.address {
  word-break: break-all;
  font-family: monospace;
  font-weight: bold;
  color: #409eff;
}

.token-section {
  margin-top: 1rem;
}

.token-input {
  margin: 0.5rem 0;
}

.amount-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
}

.amount-input {
  flex: 1;
}

.max-btn {
  background: #3498db;
  border-color: #3498db;
  color: #ffffff;

  &:hover {
    background: #2980b9;
    border-color: #2980b9;
  }

  &:disabled {
    background: #bdc3c7;
    border-color: #bdc3c7;
  }
}

.connect-btn {
  margin-top: 0.5rem;
}

.transaction-status {
  background-color: #e8f5e9;
  border-left-color: #67c23a;
}

.el-radio-group {
  margin-bottom: 1rem;
}

.confirm-dialog-content {
  padding: 15px;
  line-height: 1.6;

  strong {
    color: #409EFF;
  }
}

@media (max-width: 600px) {
  .wallet-transfer-container {
    padding: 1.5rem 1rem;
  }

  .title {
    font-size: 1.75rem;
  }

  .section {
    padding: 1rem;
  }

  .section h3 {
    font-size: 1.25rem;
  }

  .amount-section {
    flex-direction: column;
    align-items: stretch;
  }

  .max-btn {
    width: 100%;
  }
}
</style>