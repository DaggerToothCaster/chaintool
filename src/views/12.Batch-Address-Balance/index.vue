<template>
    <div class="main-box">
      <h2>💰 批量查询地址资产</h2>
  
      <el-form label-position="top">
        <!-- 以太坊节点 URL -->
        <el-form-item label="以太坊节点 URL（可选，留空使用默认公共节点）">
          <el-input
            v-model="rpcUrl"
            placeholder="例如：https://mainnet.infura.io/v3/YOUR-PROJECT-ID"
            @input="initProvider"
          />
        </el-form-item>
  
        <!-- 代币合约地址 -->
        <el-form-item label="ERC-20 代币合约地址（可选，仅查询 ETH 余额可留空）">
          <el-input
            v-model="tokenAddress"
            placeholder="例如：0xdAC17F958D2ee523a2206206994597C13D831ec7 (USDT)"
            @input="validateTokenAddress"
          />
        </el-form-item>
  
        <!-- 地址列表 -->
        <el-form-item label="以太坊地址列表（每行一个）">
          <el-input
            type="textarea"
            :rows="6"
            v-model="addressList"
            placeholder="示例：\n0x5005236a5c3592043c3031166fd4b2c2bc1a78dc\n0xde5199d52ddb762408fcf7cf4c7c0b1c7e66a0e3"
            @input="validateAddresses"
          />
        </el-form-item>
  
        <!-- 查询按钮 -->
        <el-form-item>
          <el-button type="primary" @click="queryBalances" :disabled="isQuerying || !validAddresses.length">
            查询资产
          </el-button>
        </el-form-item>
  
        <!-- 查询结果 -->
        <el-form-item label="查询结果" v-if="results.length">
          <el-table :data="results" style="width: 100%" :row-class-name="tableRowClassName">
            <el-table-column prop="address" label="地址" width="400" />
            <el-table-column prop="ethBalance" label="ETH 余额 (Ether)" width="200" />
            <el-table-column prop="tokenBalance" label="代币余额" v-if="tokenAddress" />
            <el-table-column prop="status" label="状态" width="150" />
            <el-table-column label="操作" width="120">
              <template slot-scope="scope">
                <el-button
                  size="mini"
                  @click="copyResult(scope.row.ethBalance)"
                  :disabled="!scope.row.ethBalance"
                >
                  复制 ETH 余额
                </el-button>
                <el-button
                  size="mini"
                  @click="copyResult(scope.row.tokenBalance)"
                  :disabled="!scope.row.tokenBalance"
                  v-if="tokenAddress"
                >
                  复制代币余额
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
  
      <!-- 使用帮助 -->
      <el-collapse v-model="activeCollapse">
        <el-collapse-item title="使用帮助" name="help">
          <div style="line-height: 1.8;">
            <p><strong>📜 批量查询地址资产：</strong></p>
            <ul>
              <li>输入以太坊地址：每行一个，格式为 0x 开头的 42 位十六进制字符串。</li>
              <li>代币合约地址：输入有效的 ERC-20 代币合约地址（可选）。</li>
              <li>以太坊节点 URL：输入 Infura、Alchemy 或其他 RPC 端点，留空使用默认公共节点（可能有速率限制）。</li>
              <li>查询结果：显示每个地址的 ETH 余额和代币余额（如果提供代币地址）。</li>
              <li>注意：查询可能因网络或节点限制而失败，请检查输入格式和节点状态。</li>
            </ul>
            <p><strong>📎 提示：</strong> 使用私人 RPC 端点（如 Infura）可提高查询速度和稳定性。确保地址格式正确，避免查询失败。</p>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </template>
  
  <script>
  import { ethers } from 'ethers';
  import { isAddress } from '@ethersproject/address';
  import { formatEther } from '@ethersproject/units';
  
  // ERC-20 ABI，仅包含 balanceOf 函数
  const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
  ];
  
  export default {
    name: 'BatchAddressBalance',
    data() {
      return {
        rpcUrl: '', // 以太坊节点 URL
        tokenAddress: '', // ERC-20 代币合约地址
        addressList: '', // 地址列表
        results: [], // 查询结果
        validAddresses: [], // 有效地址列表
        isQuerying: false, // 查询状态
        activeCollapse: ['help'], // 帮助折叠面板状态
        provider: null, // ethers Provider
        tokenContract: null, // ERC-20 代币合约实例
      };
    },
    methods: {
      // 初始化以太坊 Provider
      async initProvider() {
        try {
          if (this.rpcUrl.trim()) {
            this.provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
          } else {
            // 默认使用公共节点（示例，需替换为实际可用的公共节点）
            this.provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
          }
          // 测试连接
          await this.provider.getBlockNumber();
          this.$message.success('节点连接成功');
        } catch (error) {
          console.error('节点连接失败:', error);
          this.$message.error('节点连接失败: ' + error.message);
          this.provider = null;
        }
      },
  
      // 验证代币合约地址
      validateTokenAddress() {
        if (!this.tokenAddress.trim()) {
          this.tokenContract = null;
          return;
        }
        if (!isAddress(this.tokenAddress)) {
          this.$message.error('无效的代币合约地址');
          this.tokenContract = null;
          return;
        }
        if (this.provider) {
          this.tokenContract = new ethers.Contract(this.tokenAddress, ERC20_ABI, this.provider);
        }
      },
  
      // 验证地址列表
      validateAddresses() {
        this.validAddresses = [];
        if (!this.addressList.trim()) return;
  
        const addresses = this.addressList
          .split('\n')
          .map(addr => addr.trim())
          .filter(addr => addr);
  
        addresses.forEach((addr, index) => {
          if (isAddress(addr)) {
            this.validAddresses.push(addr);
          } else {
            this.$message.warning(`地址 ${index + 1} 无效: ${addr}`);
          }
        });
      },
  
      // 批量查询余额
      async queryBalances() {
        if (!this.validAddresses.length) {
          this.$message.error('请提供至少一个有效地址');
          return;
        }
        if (!this.provider) {
          this.$message.error('请配置有效的以太坊节点');
          return;
        }
  
        this.isQuerying = true;
        this.results = [];
  
        for (const address of this.validAddresses) {
          const result = { address, ethBalance: '', tokenBalance: '', status: '查询中' };
  
          try {
            // 查询 ETH 余额
            const ethBalance = await this.provider.getBalance(address);
            result.ethBalance = formatEther(ethBalance);
  
            // 查询代币余额（如果提供代币地址）
            if (this.tokenContract) {
              const balance = await this.tokenContract.balanceOf(address);
              const decimals = await this.tokenContract.decimals();
              result.tokenBalance = ethers.utils.formatUnits(balance, decimals);
            }
  
            result.status = '成功';
          } catch (error) {
            console.error(`查询地址 ${address} 失败:`, error);
            result.status = `失败: ${error.message}`;
          }
  
          this.results.push(result);
        }
  
        this.isQuerying = false;
        this.$message.success('查询完成');
      },
  
      // 复制结果
      copyResult(value) {
        if (!value) return;
  
        navigator.clipboard
          .writeText(value.toString())
          .then(() => {
            this.$message.success(`已复制: ${value}`);
          })
          .catch(err => {
            console.error('复制失败:', err);
            this.$message.error('复制失败，请手动复制');
          });
      },
  
      // 表格行样式
      tableRowClassName({ row }) {
        return row.status.includes('失败') ? 'error-row' : '';
      },
    },
    created() {
      this.initProvider();
    },
  };
  </script>
  
  <style scoped>
  .main-box {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
  }
  
  h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #2c3e50;
  }
  
  .el-form-item {
    margin-bottom: 20px;
  }
  
  .el-button {
    margin-bottom: 20px;
  }
  
  .el-table {
    margin-top: 20px;
  }
  
  .el-collapse {
    margin-top: 20px;
  }
  
  code {
    background-color: #f5f5f5;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
  }
  
  /* 错误行样式 */
  :deep(.error-row) {
    background-color: #fff1f0;
  }
  </style>