<template>
  <div class="rpc-manager">
    <div class="container">
      <h1 class="main-title">RPC节点管理</h1>
      
      <!-- 搜索和筛选 -->
      <div class="search-section">
        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索链名称或RPC地址..."
            class="search-input"
          />
          <button @click="clearSearch" class="clear-btn" v-if="searchQuery">
            ✕
          </button>
        </div>
        <div class="filter-buttons">
          <button
            v-for="status in filterOptions"
            :key="status.value"
            @click="setFilter(status.value)"
            :class="['filter-btn', { 'active': currentFilter === status.value }]"
          >
            {{ status.label }}
          </button>
        </div>
      </div>

      <!-- MetaMask连接状态 -->
      <div class="metamask-status">
        <div class="status-card">
          <div class="status-header">
            <div class="status-indicator">
              <div :class="['status-dot', metamaskStatus.connected ? 'status-connected' : 'status-disconnected']"></div>
              <span class="status-text">
                MetaMask: {{ metamaskStatus.connected ? '已连接' : '未连接' }}
              </span>
            </div>
            <button
              v-if="!metamaskStatus.connected"
              @click="connectMetaMask"
              class="btn btn-metamask"
            >
              连接MetaMask
            </button>
          </div>
          <div v-if="metamaskStatus.connected && metamaskStatus.account" class="account-info">
            <span class="account-label">当前账户:</span>
            <span class="account-address">{{ metamaskStatus.account }}</span>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ totalChains }}</div>
            <div class="stat-label">总链数</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ totalRpcs }}</div>
            <div class="stat-label">总RPC数</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ healthyRpcs }}</div>
            <div class="stat-label">健康RPC</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ addedToWallet }}</div>
            <div class="stat-label">已添加到钱包</div>
          </div>
        </div>
      </div>

      <!-- RPC列表 -->
      <div class="rpc-list-section">
        <div class="section-header">
          <h2 class="section-title">RPC节点列表</h2>
          <button
            @click="checkAllRpcHealth"
            :disabled="isCheckingHealth"
            class="btn btn-secondary"
            :class="{ 'btn-disabled': isCheckingHealth }"
          >
            {{ isCheckingHealth ? '检测中...' : '检测所有RPC健康状态' }}
          </button>
        </div>

        <div class="chain-list">
          <div
            v-for="(chain, chainKey) in filteredChains"
            :key="chainKey"
            class="chain-card"
          >
            <!-- 链信息头部 -->
            <div class="chain-header">
              <div class="chain-info">
                <h3 class="chain-name">{{ chain.chainName }}</h3>
                <div class="chain-details">
                  <span class="chain-id">ID: {{ chain.chainId }}</span>
                  <span class="chain-symbol">{{ chain.nativeCurrency.symbol }}</span>
                  <span class="rpc-count">{{ chain.rpcUrls.length }} RPC节点</span>
                </div>
              </div>
              <div class="chain-actions">
                <button
                  @click="addChainToWallet(chain)"
                  class="btn btn-primary"
                  :disabled="!metamaskStatus.connected"
                >
                  🦊 添加链到钱包
                </button>
                <button
                  @click="toggleChainExpanded(chainKey)"
                  class="expand-btn"
                  :class="{ 'expanded': expandedChains[chainKey] }"
                >
                  {{ expandedChains[chainKey] ? '收起' : '展开' }}
                </button>
              </div>
            </div>

            <!-- 链的基本信息 -->
            <div class="chain-meta">
              <div class="meta-item">
                <span class="meta-label">浏览器:</span>
                <a :href="chain.blockExplorerUrls[0]" target="_blank" class="meta-link">
                  {{ chain.blockExplorerUrls[0] }}
                </a>
              </div>
              <div class="meta-item">
                <span class="meta-label">原生代币:</span>
                <span class="meta-value">{{ chain.nativeCurrency.name }} ({{ chain.nativeCurrency.symbol }})</span>
              </div>
            </div>

            <!-- RPC节点列表 -->
            <div v-if="expandedChains[chainKey]" class="rpc-nodes">
              <h4 class="rpc-section-title">RPC节点详情</h4>
              <div class="rpc-grid">
                <div
                  v-for="(rpcUrl, rpcIndex) in chain.rpcUrls"
                  :key="rpcIndex"
                  class="rpc-card"
                  :class="{
                    'rpc-healthy': rpcHealth[chainKey] && rpcHealth[chainKey][rpcIndex] && rpcHealth[chainKey][rpcIndex].healthy,
                    'rpc-unhealthy': rpcHealth[chainKey] && rpcHealth[chainKey][rpcIndex] && rpcHealth[chainKey][rpcIndex].healthy === false
                  }"
                >
                  <div class="rpc-header">
                    <div class="rpc-url">{{ rpcUrl }}</div>
                    <div class="rpc-status">
                      <div :class="[
                        'status-dot',
                        getRpcStatusClass(chainKey, rpcIndex)
                      ]"></div>
                      <span class="status-label">{{ getRpcStatusText(chainKey, rpcIndex) }}</span>
                    </div>
                  </div>
                  
                  <div class="rpc-details">
                    <div v-if="rpcHealth[chainKey] && rpcHealth[chainKey][rpcIndex]" class="rpc-metrics">
                      <div v-if="rpcHealth[chainKey][rpcIndex].latency" class="metric">
                        <span class="metric-label">延迟:</span>
                        <span class="metric-value latency">{{ rpcHealth[chainKey][rpcIndex].latency }}ms</span>
                      </div>
                      <div v-if="rpcHealth[chainKey][rpcIndex].blockNumber" class="metric">
                        <span class="metric-label">区块高度:</span>
                        <span class="metric-value">{{ rpcHealth[chainKey][rpcIndex].blockNumber }}</span>
                      </div>
                      <div v-if="rpcHealth[chainKey][rpcIndex].lastCheck" class="metric">
                        <span class="metric-label">检测时间:</span>
                        <span class="metric-value time">{{ rpcHealth[chainKey][rpcIndex].lastCheck }}</span>
                      </div>
                    </div>
                    
                    <div v-if="rpcHealth[chainKey] && rpcHealth[chainKey][rpcIndex] && rpcHealth[chainKey][rpcIndex].error" class="rpc-error">
                      <span class="error-label">错误:</span>
                      <span class="error-message">{{ rpcHealth[chainKey][rpcIndex].error }}</span>
                    </div>
                  </div>

                  <div class="rpc-actions">
                    <button
                      @click="testSingleRpc(chainKey, rpcIndex, rpcUrl)"
                      :disabled="isTestingRpc[`${chainKey}-${rpcIndex}`]"
                      class="btn btn-test"
                    >
                      {{ isTestingRpc[`${chainKey}-${rpcIndex}`] ? '测试中...' : '测试连接' }}
                    </button>
                    <button
                      @click="addRpcToWallet(chain, rpcUrl)"
                      :disabled="!metamaskStatus.connected"
                      class="btn btn-add"
                    >
                      添加此RPC
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredChains.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">未找到匹配的链</div>
          <div class="empty-description">请尝试调整搜索条件或筛选器</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ethers } from 'ethers'

export default {
  name: 'RpcList',
  data() {
    return {
      // 搜索和筛选
      searchQuery: '',
      currentFilter: 'all',
      filterOptions: [
        { value: 'all', label: '全部' },
        { value: 'healthy', label: '健康' },
        { value: 'unhealthy', label: '异常' },
        { value: 'untested', label: '未测试' }
      ],
      
      // 展开状态
      expandedChains: {},
      
      // 测试状态
      isCheckingHealth: false,
      isTestingRpc: {},
      
      // RPC健康状态
      rpcHealth: {},
      
      // MetaMask状态
      metamaskStatus: {
        connected: false,
        account: null,
        chainId: null
      },
      
      // 钱包添加状态
      addedToWallet: 0,
      
      // 链配置
      chainConfigs: {
        ethereum: {
          chainId: '1',
          chainName: 'Ethereum Mainnet',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: [
            'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
            'https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY',
            'https://cloudflare-eth.com',
            'https://ethereum.publicnode.com'
          ],
          blockExplorerUrls: ['https://etherscan.io/']
        },
        bsc: {
          chainId: '56',
          chainName: 'BNB Smart Chain',
          nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
          },
          rpcUrls: [
            'https://bsc-dataseed1.binance.org/',
            'https://bsc-dataseed2.binance.org/',
            'https://bsc-dataseed3.binance.org/',
            'https://bsc-dataseed4.binance.org/'
          ],
          blockExplorerUrls: ['https://bscscan.com/']
        },
        polygon: {
          chainId: '137',
          chainName: 'Polygon Mainnet',
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
          },
          rpcUrls: [
            'https://polygon-rpc.com/',
            'https://rpc-mainnet.matic.network',
            'https://matic-mainnet.chainstacklabs.com',
            'https://rpc-mainnet.maticvigil.com'
          ],
          blockExplorerUrls: ['https://polygonscan.com/']
        },
        arbitrum: {
          chainId: '42161',
          chainName: 'Arbitrum One',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: [
            'https://arb1.arbitrum.io/rpc',
            'https://arbitrum-mainnet.infura.io/v3/YOUR_PROJECT_ID',
            'https://rpc.ankr.com/arbitrum'
          ],
          blockExplorerUrls: ['https://arbiscan.io/']
        },
        optimism: {
          chainId: '10',
          chainName: 'Optimism',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: [
            'https://mainnet.optimism.io',
            'https://optimism-mainnet.infura.io/v3/YOUR_PROJECT_ID',
            'https://rpc.ankr.com/optimism'
          ],
          blockExplorerUrls: ['https://optimistic.etherscan.io/']
        },
        kto: {
          chainId: '2559',
          chainName: 'KTO Chain',
          nativeCurrency: {
            name: 'KTO',
            symbol: 'KTO',
            decimals: 18
          },
          rpcUrls: [
            'https://www.kortho-chain.com',
            'https://www.kortho-chain.cc',
            'https://www.kortho-chain.pro',
            'https://www.kortho-chain.org'
          ],
          blockExplorerUrls: ['https://www.kortho.io/#/']
        },
        nos: {
          chainId: '2463',
          chainName: 'NOS Chain',
          nativeCurrency: {
            name: 'NOS',
            symbol: 'NOS',
            decimals: 18
          },
          rpcUrls: [
            'https://rpc-mainnet.noschain.org',
            'https://rpc-mainnet2.noschain.org',
            'https://rpc.noschain.org'
          ],
          blockExplorerUrls: ['https://nosscan.noschain.org/']
        }
      }
    }
  },
  
  computed: {
    filteredChains() {
      let chains = { ...this.chainConfigs }
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        chains = Object.fromEntries(
          Object.entries(chains).filter(([key, chain]) => {
            return (
              chain.chainName.toLowerCase().includes(query) ||
              chain.nativeCurrency.symbol.toLowerCase().includes(query) ||
              chain.rpcUrls.some(url => url.toLowerCase().includes(query))
            )
          })
        )
      }
      
      // 状态过滤
      if (this.currentFilter !== 'all') {
        chains = Object.fromEntries(
          Object.entries(chains).filter(([key, chain]) => {
            const chainHealth = this.rpcHealth[key]
            if (!chainHealth) return this.currentFilter === 'untested'
            
            const hasHealthy = chainHealth.some(rpc => rpc && rpc.healthy === true)
            const hasUnhealthy = chainHealth.some(rpc => rpc && rpc.healthy === false)
            const hasUntested = chainHealth.some(rpc => !rpc || rpc.healthy === null)
            
            switch (this.currentFilter) {
              case 'healthy': return hasHealthy
              case 'unhealthy': return hasUnhealthy && !hasHealthy
              case 'untested': return hasUntested && !hasHealthy && !hasUnhealthy
              default: return true
            }
          })
        )
      }
      
      return chains
    },
    
    totalChains() {
      return Object.keys(this.chainConfigs).length
    },
    
    totalRpcs() {
      return Object.values(this.chainConfigs).reduce((total, chain) => {
        return total + chain.rpcUrls.length
      }, 0)
    },
    
    healthyRpcs() {
      let count = 0
      Object.values(this.rpcHealth).forEach(chainHealth => {
        if (chainHealth) {
          count += chainHealth.filter(rpc => rpc && rpc.healthy === true).length
        }
      })
      return count
    }
  },
  
  mounted() {
    this.setupMetaMaskListeners()
    this.checkExistingConnection()
    this.initializeRpcHealth()
  },
  
  methods: {
    // 初始化RPC健康状态
    initializeRpcHealth() {
      Object.keys(this.chainConfigs).forEach(key => {
        this.$set(this.rpcHealth, key, this.chainConfigs[key].rpcUrls.map(() => ({
          healthy: null,
          latency: null,
          blockNumber: null,
          lastCheck: null,
          error: null
        })))
      })
    },
    
    // 清除搜索
    clearSearch() {
      this.searchQuery = ''
    },
    
    // 设置筛选器
    setFilter(filter) {
      this.currentFilter = filter
    },
    
    // 切换链展开状态
    toggleChainExpanded(chainKey) {
      this.$set(this.expandedChains, chainKey, !this.expandedChains[chainKey])
    },
    
    // 获取RPC状态类
    getRpcStatusClass(chainKey, rpcIndex) {
      const health = this.rpcHealth[chainKey] && this.rpcHealth[chainKey][rpcIndex]
      if (!health || health.healthy === null) return 'status-unknown'
      return health.healthy ? 'status-connected' : 'status-disconnected'
    },
    
    // 获取RPC状态文本
    getRpcStatusText(chainKey, rpcIndex) {
      const health = this.rpcHealth[chainKey] && this.rpcHealth[chainKey][rpcIndex]
      if (!health || health.healthy === null) return '未测试'
      return health.healthy ? '健康' : '异常'
    },
    
    // 检查单个RPC健康状态
    async checkRpcHealth(rpcUrl, timeout = 5000) {
      const startTime = Date.now()
      try {
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('连接超时')), timeout)
        })
        
        const blockNumber = await Promise.race([
          provider.getBlockNumber(),
          timeoutPromise
        ])
        
        const latency = Date.now() - startTime
        return {
          healthy: true,
          latency: latency,
          blockNumber: blockNumber,
          lastCheck: new Date().toLocaleTimeString('zh-CN'),
          error: null
        }
      } catch (error) {
        return {
          healthy: false,
          latency: null,
          blockNumber: null,
          lastCheck: new Date().toLocaleTimeString('zh-CN'),
          error: error.message
        }
      }
    },
    
    // 测试单个RPC
    async testSingleRpc(chainKey, rpcIndex, rpcUrl) {
      const testKey = `${chainKey}-${rpcIndex}`
      this.$set(this.isTestingRpc, testKey, true)
      
      try {
        const health = await this.checkRpcHealth(rpcUrl)
        this.$set(this.rpcHealth[chainKey], rpcIndex, health)
      } catch (error) {
        console.error('测试RPC失败:', error)
      } finally {
        this.$set(this.isTestingRpc, testKey, false)
      }
    },
    
    // 检查所有RPC健康状态
    async checkAllRpcHealth() {
      this.isCheckingHealth = true
      
      try {
        for (const [chainKey, config] of Object.entries(this.chainConfigs)) {
          const healthPromises = config.rpcUrls.map(rpcUrl => this.checkRpcHealth(rpcUrl))
          const healthResults = await Promise.all(healthPromises)
          this.$set(this.rpcHealth, chainKey, healthResults)
        }
      } catch (error) {
        console.error('检查RPC健康状态失败:', error)
      } finally {
        this.isCheckingHealth = false
      }
    },
    
    // 检查MetaMask是否安装
    checkMetaMask() {
      if (typeof window.ethereum !== 'undefined') {
        return true
      } else {
        alert('请安装MetaMask钱包')
        return false
      }
    },
    
    // 连接MetaMask
    async connectMetaMask() {
      if (!this.checkMetaMask()) return

      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        
        this.metamaskStatus.connected = true
        this.metamaskStatus.account = accounts[0]
        this.metamaskStatus.chainId = chainId
        
        console.log('MetaMask连接成功:', accounts[0])
      } catch (error) {
        console.error('连接MetaMask失败:', error)
        alert('连接MetaMask失败: ' + error.message)
      }
    },
    
    // 添加整个链到钱包
    async addChainToWallet(chainConfig) {
      if (!this.checkMetaMask()) return

      try {
        const hexChainId = '0x' + parseInt(chainConfig.chainId).toString(16)
        const configForMetaMask = {
          ...chainConfig,
          chainId: hexChainId
        }
        
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [configForMetaMask]
        })
        
        this.addedToWallet++
        alert(`${chainConfig.chainName} 网络添加成功！`)
      } catch (error) {
        console.error('添加网络失败:', error)
        this.handleWalletError(error)
      }
    },
    
    // 添加特定RPC到钱包
    async addRpcToWallet(chainConfig, rpcUrl) {
      if (!this.checkMetaMask()) return

      try {
        const hexChainId = '0x' + parseInt(chainConfig.chainId).toString(16)
        const configForMetaMask = {
          ...chainConfig,
          chainId: hexChainId,
          rpcUrls: [rpcUrl] // 只使用选定的RPC
        }
        
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [configForMetaMask]
        })
        
        alert(`${chainConfig.chainName} (${rpcUrl}) 添加成功！`)
      } catch (error) {
        console.error('添加RPC失败:', error)
        this.handleWalletError(error)
      }
    },
    
    // 处理钱包错误
    handleWalletError(error) {
      if (error.code === 4902) {
        alert('用户拒绝添加网络')
      } else if (error.code === -32602) {
        alert('网络参数无效')
      } else {
        alert('操作失败: ' + error.message)
      }
    },
    
    // 监听MetaMask账户变化
    setupMetaMaskListeners() {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length === 0) {
            this.metamaskStatus.connected = false
            this.metamaskStatus.account = null
          } else {
            this.metamaskStatus.account = accounts[0]
          }
        })

        window.ethereum.on('chainChanged', (chainId) => {
          this.metamaskStatus.chainId = chainId
        })
      }
    },
    
    // 检查是否已连接MetaMask
    async checkExistingConnection() {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0) {
            this.metamaskStatus.connected = true
            this.metamaskStatus.account = accounts[0]
            
            const chainId = await window.ethereum.request({ method: 'eth_chainId' })
            this.metamaskStatus.chainId = chainId
          }
        } catch (error) {
          console.error('检查MetaMask连接失败:', error)
        }
      }
    }
  }
}
</script>

<style scoped>
/* 基础样式 */
* {
  box-sizing: border-box;
}

.rpc-manager {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

/* 标题 */
.main-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 搜索部分 */
.search-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.search-bar {
  position: relative;
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 1rem 3rem 1rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.clear-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: #f56565;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 0.75rem;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.filter-btn:hover,
.filter-btn.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

/* MetaMask状态 */
.metamask-status {
  margin-bottom: 1.5rem;
}

.status-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-connected {
  background: #48bb78;
}

.status-disconnected {
  background: #f56565;
}

.status-unknown {
  background: #a0aec0;
}

.status-text {
  font-weight: 600;
  color: #2d3748;
}

.account-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f7fafc;
  border-radius: 6px;
  font-size: 0.875rem;
}

.account-label {
  color: #718096;
  margin-right: 0.5rem;
}

.account-address {
  font-family: 'Courier New', monospace;
  color: #2d3748;
  font-weight: 600;
}

/* 统计信息 */
.stats-section {
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #718096;
  font-size: 0.875rem;
  font-weight: 500;
}

/* RPC列表部分 */
.rpc-list-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

/* 链卡片 */
.chain-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chain-card {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.chain-card:hover {
  border-color: #667eea;
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
}

.chain-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chain-info {
  flex: 1;
}

.chain-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
}

.chain-details {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.chain-id,
.chain-symbol,
.rpc-count {
  padding: 0.25rem 0.75rem;
  background: #edf2f7;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #4a5568;
  font-weight: 500;
}

.chain-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.expand-btn {
  background: #edf2f7;
  color: #4a5568;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.expand-btn:hover,
.expand-btn.expanded {
  background: #667eea;
  color: white;
}

/* 链元信息 */
.chain-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.meta-label {
  color: #718096;
  font-weight: 500;
  min-width: 80px;
}

.meta-value {
  color: #2d3748;
  font-weight: 600;
}

.meta-link {
  color: #3182ce;
  text-decoration: none;
  word-break: break-all;
}

.meta-link:hover {
  text-decoration: underline;
}

/* RPC节点 */
.rpc-nodes {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.rpc-section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 1rem 0;
}

.rpc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1rem;
}

.rpc-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.rpc-card:hover {
  border-color: #cbd5e0;
}

.rpc-healthy {
  border-left: 4px solid #48bb78;
  background: #f0fff4;
}

.rpc-unhealthy {
  border-left: 4px solid #f56565;
  background: #fffafa;
}

.rpc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.rpc-url {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #2d3748;
  word-break: break-all;
  flex: 1;
  margin-right: 1rem;
}

.rpc-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.status-label {
  font-size: 0.75rem;
  font-weight: 600;
}

.rpc-details {
  margin-bottom: 1rem;
}

.rpc-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.metric-label {
  color: #718096;
}

.metric-value {
  font-weight: 600;
  color: #2d3748;
}

.metric-value.latency {
  color: #3182ce;
}

.metric-value.time {
  font-size: 0.75rem;
  color: #718096;
}

.rpc-error {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #fed7d7;
  border-radius: 4px;
  font-size: 0.75rem;
}

.error-label {
  color: #c53030;
  font-weight: 600;
}

.error-message {
  color: #c53030;
  margin-left: 0.5rem;
}

.rpc-actions {
  display: flex;
  gap: 0.5rem;
}

/* 按钮样式 */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(160, 174, 192, 0.3);
}

.btn-metamask {
  background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
  color: white;
}

.btn-metamask:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(237, 137, 54, 0.3);
}

.btn-test {
  background: #edf2f7;
  color: #4a5568;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
}

.btn-test:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.btn-add {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.btn-disabled,
.btn:disabled {
  background: #a0aec0 !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #718096;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.empty-description {
  font-size: 0.875rem;
}

/* 动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .rpc-manager {
    padding: 1rem;
  }
  
  .main-title {
    font-size: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .chain-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .chain-actions {
    justify-content: space-between;
  }
  
  .rpc-grid {
    grid-template-columns: 1fr;
  }
  
  .rpc-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .rpc-actions {
    flex-direction: column;
  }
  
  .filter-buttons {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .chain-details {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .meta-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>