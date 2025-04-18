<template>
    <div class="main-box">
      <h2>ABI 可视化调用工具</h2>
      
      <!-- 钱包连接区域 -->
      <div class="wallet-section">
        <el-radio-group v-model="walletType" @change="resetWallet">
          <el-radio-button label="privateKey">私钥</el-radio-button>
          <el-radio-button label="metamask">MetaMask</el-radio-button>
        </el-radio-group>
        
        <div v-if="walletType === 'privateKey'" class="private-key-input">
          <el-input
            v-model="privateKey"
            placeholder="输入私钥 (0x开头)"
            show-password
            clearable
          ></el-input>
          <el-button 
            type="primary" 
            @click="connectWithPrivateKey"
            :disabled="!privateKey"
          >
            连接钱包
          </el-button>
        </div>
        
        <div v-else class="metamask-connect">
          <el-button 
            type="primary" 
            @click="connectMetaMask"
            :disabled="!isMetaMaskInstalled"
          >
            {{ isConnected ? '已连接' : '连接MetaMask' }}
          </el-button>
          <p v-if="!isMetaMaskInstalled" class="warning-text">
            MetaMask未检测到，请安装扩展
          </p>
        </div>
        
        <div v-if="walletAddress" class="wallet-info">
          <p>钱包地址: <span class="address">{{ walletAddress }}</span></p>
          <p>ETH余额: {{ ethBalance }} ETH</p>
        </div>
      </div>
      
      <!-- 合约ABI输入区域 -->
      <div class="contract-section">
        <el-input
          v-model="contractAddress"
          placeholder="输入合约地址 (0x开头)"
          clearable
          class="contract-address"
        ></el-input>
        
        <el-input
          type="textarea"
          :rows="8"
          v-model="contractABI"
          placeholder="输入合约ABI (JSON格式)"
          clearable
          class="contract-abi"
        ></el-input>
        
        <el-button 
          type="success" 
          @click="parseABI"
          :disabled="!contractAddress || !contractABI"
        >
          解析ABI
        </el-button>
      </div>
      
      <!-- 函数调用区域 -->
      <div v-if="parsedFunctions.length > 0" class="function-section">
        <h3>可调用函数</h3>
        
        <el-select 
          v-model="selectedFunction" 
          placeholder="选择函数"
          class="function-selector"
        >
          <el-option
            v-for="func in parsedFunctions"
            :key="func.signature"
            :label="func.name + func.inputs"
            :value="func"
          ></el-option>
        </el-select>
        
        <div v-if="selectedFunction" class="function-params">
          <div 
            v-for="(input, index) in selectedFunction.inputParams" 
            :key="index"
            class="param-input"
          >
            <label>{{ input.name }} ({{ input.type }}):</label>
            <el-input
              v-model="input.value"
              :placeholder="`输入 ${input.type} 类型值`"
            ></el-input>
          </div>
          
          <el-button 
            type="primary" 
            @click="callFunction"
            :loading="callingFunction"
            :disabled="!isReadyToCall"
          >
            {{ selectedFunction.stateMutability === 'view' ? '查询' : '发送交易' }}
          </el-button>
        </div>
      </div>
      
      <!-- 调用结果区域 -->
      <div v-if="callResult" class="result-section">
        <h3>调用结果</h3>
        <div class="result-card">
          <pre>{{ formatResult(callResult) }}</pre>
          <el-button 
            size="small" 
            @click="copyResult"
            icon="el-icon-document-copy"
          >
            复制结果
          </el-button>
        </div>
      </div>
      
      <!-- 交易哈希显示 -->
      <div v-if="transactionHash" class="transaction-info">
        <p>交易哈希: 
          <a :href="`https://etherscan.io/tx/${transactionHash}`" target="_blank">
            {{ transactionHash }}
          </a>
        </p>
      </div>
    </div>
  </template>
  
  <script>
  import { ethers } from 'ethers';
  
  export default {
    name: 'ABICaller',
    data() {
      return {
        walletType: 'privateKey',
        privateKey: '',
        walletAddress: '',
        ethBalance: '0',
        isConnected: false,
        
        contractAddress: '',
        contractABI: '',
        parsedFunctions: [],
        selectedFunction: null,
        
        callResult: null,
        callingFunction: false,
        transactionHash: '',
        
        provider: null,
        wallet: null,
        contract: null
      };
    },
    computed: {
      isMetaMaskInstalled() {
        return typeof window.ethereum !== 'undefined';
      },
      isReadyToCall() {
        if (!this.selectedFunction) return false;
        if (!this.walletAddress) return false;
        if (!this.contractAddress) return false;
        
        // 检查所有必填参数
        return !this.selectedFunction.inputParams.some(
          param => param.value === '' && !param.optional
        );
      }
    },
    methods: {
      async connectWithPrivateKey() {
        if (!this.privateKey.startsWith('0x')) {
          this.privateKey = '0x' + this.privateKey;
        }
        
        try {
          // 初始化provider（使用默认的homestead网络）
          this.provider = new ethers.providers.JsonRpcProvider();
          
          // 创建钱包实例
          this.wallet = new ethers.Wallet(this.privateKey, this.provider);
          this.walletAddress = this.wallet.address;
          this.isConnected = true;
          
          // 获取余额
          await this.updateBalance();
          
          this.$message.success('私钥钱包连接成功');
        } catch (error) {
          console.error('私钥连接失败:', error);
          this.$message.error('私钥无效或网络错误');
        }
      },
      
      async connectMetaMask() {
        if (!this.isMetaMaskInstalled) {
          this.$message.warning('请先安装MetaMask扩展');
          return;
        }
        
        try {
          // 请求账户访问
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          this.walletAddress = accounts[0];
          this.isConnected = true;
          
          // 初始化provider
          this.provider = new ethers.providers.Web3Provider(window.ethereum);
          this.wallet = this.provider.getSigner();
          
          // 获取余额
          await this.updateBalance();
          
          this.$message.success('MetaMask连接成功');
          
          // 监听账户变化
          window.ethereum.on('accountsChanged', (accounts) => {
            this.walletAddress = accounts[0] || '';
            if (this.walletAddress) {
              this.updateBalance();
            } else {
              this.resetWallet();
            }
          });
        } catch (error) {
          console.error('MetaMask连接失败:', error);
          this.$message.error('用户拒绝了连接请求');
        }
      },
      
      async updateBalance() {
        if (!this.walletAddress) return;
        
        try {
          const balance = await this.provider.getBalance(this.walletAddress);
          this.ethBalance = ethers.utils.formatEther(balance);
        } catch (error) {
          console.error('获取余额失败:', error);
        }
      },
      
      resetWallet() {
        this.walletAddress = '';
        this.ethBalance = '0';
        this.isConnected = false;
        this.wallet = null;
        this.provider = null;
      },
      
      parseABI() {
        try {
          const abi = JSON.parse(this.contractABI);
          this.parsedFunctions = abi
            .filter(item => item.type === 'function')
            .map(item => {
              // 解析输入参数
              const inputs = item.inputs.map(input => ({
                name: input.name || `param${input.index}`,
                type: input.type,
                value: '',
                optional: false
              }));
              
              // 生成函数签名
              const paramTypes = item.inputs.map(input => input.type).join(',');
              const signature = `${item.name}(${paramTypes})`;
              
              return {
                ...item,
                inputs: `(${paramTypes})`,
                inputParams: inputs,
                signature
              };
            });
          
          this.selectedFunction = null;
          this.callResult = null;
          this.$message.success(`成功解析 ${this.parsedFunctions.length} 个函数`);
        } catch (error) {
          console.error('ABI解析失败:', error);
          this.$message.error('ABI格式无效，请输入有效的JSON格式ABI');
        }
      },
      
      async callFunction() {
        if (!this.selectedFunction || !this.isReadyToCall) return;
        
        this.callingFunction = true;
        this.callResult = null;
        this.transactionHash = '';
        
        try {
          // 初始化合约实例
          const contract = new ethers.Contract(
            this.contractAddress,
            JSON.parse(this.contractABI),
            this.wallet || this.provider
          );
          
          // 准备参数
          const args = this.selectedFunction.inputParams.map(param => {
            // 简单类型转换（实际项目需要更完善的类型处理）
            if (param.type.includes('int')) {
              return parseInt(param.value) || 0;
            } else if (param.type.includes('bool')) {
              return Boolean(param.value);
            }
            return param.value;
          });
          
          // 区分view/pure调用和写入交易
          if (this.selectedFunction.stateMutability === 'view' || 
              this.selectedFunction.stateMutability === 'pure') {
            // 只读调用
            const result = await contract[this.selectedFunction.name](...args);
            this.callResult = result;
          } else {
            // 发送交易
            const tx = await contract[this.selectedFunction.name](...args, {
              gasLimit: 500000 // 默认gas限制
            });
            
            this.transactionHash = tx.hash;
            this.callResult = '交易已发送，等待确认...';
            
            // 等待交易确认
            const receipt = await tx.wait();
            this.callResult = {
              transactionHash: receipt.transactionHash,
              blockNumber: receipt.blockNumber,
              status: receipt.status === 1 ? '成功' : '失败'
            };
            
            // 更新余额
            await this.updateBalance();
          }
          
          this.$message.success('调用成功');
        } catch (error) {
          console.error('函数调用失败:', error);
          this.callResult = error.message;
          this.$message.error(`调用失败: ${error.message.split('(')[0]}`);
        } finally {
          this.callingFunction = false;
        }
      },
      
      formatResult(result) {
        if (typeof result === 'object' && result !== null) {
          return JSON.stringify(result, null, 2);
        }
        return String(result);
      },
      
      copyResult() {
        if (!this.callResult) return;
        
        const textToCopy = this.formatResult(this.callResult);
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
          document.execCommand('copy');
          this.$message.success('结果已复制');
        } catch (err) {
          this.$message.error('复制失败');
        } finally {
          document.body.removeChild(textarea);
        }
      }
    },
    watch: {
      contractAddress(newVal) {
        if (newVal && !newVal.startsWith('0x')) {
          this.$message.warning('合约地址应该以0x开头');
        }
      }
    }
  };
  </script>
  
  <style scoped>

  

  
  .wallet-section, .contract-section, .function-section {
    margin-bottom: 30px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
  }
  
  .private-key-input, .metamask-connect {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    align-items: center;
  }
  
  .warning-text {
    color: #e6a23c;
    margin-left: 10px;
  }
  
  .wallet-info {
    margin-top: 15px;
    padding: 10px;
    background-color: #fff;
    border-radius: 4px;
  }
  
  .address {
    font-family: monospace;
    word-break: break-all;
    color: #409EFF;
  }
  
  .contract-address {
    margin-bottom: 15px;
  }
  
  .contract-abi {
    margin-bottom: 15px;
    font-family: monospace;
    font-size: 14px;
  }
  
  .function-selector {
    width: 100%;
    margin-bottom: 20px;
  }
  
  .function-params {
    background-color: #fff;
    padding: 15px;
    border-radius: 4px;
  }
  
  .param-input {
    margin-bottom: 15px;
  }
  
  .param-input label {
    display: block;
    margin-bottom: 5px;
    color: #606266;
  }
  
  .result-section {
    margin-top: 30px;
  }
  
  .result-card {
    position: relative;
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    margin-top: 15px;
  }
  
  .result-card pre {
    white-space: pre-wrap;
    word-break: break-word;
    font-family: monospace;
    margin: 0;
  }
  
  .result-card button {
    position: absolute;
    top: 10px;
    right: 10px;
  }
  
  .transaction-info {
    margin-top: 15px;
    text-align: center;
  }
  
  .transaction-info a {
    color: #409EFF;
    word-break: break-all;
  }
  
  @media (max-width: 768px) {
    .private-key-input, .metamask-connect {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .wallet-info, .function-params {
      padding: 10px;
    }
  }
  </style>