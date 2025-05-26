<template>
  <div class="node-monitor">
    <div class="container">
      <h1 class="main-title">以太坊节点监控</h1>
      
      <!-- 节点配置展示 -->
      <div class="config-section">
        <h2 class="section-title">节点配置</h2>
        <div class="config-grid">
          <div v-for="(config, key) in chainConfigs" :key="key" class="config-card">
            <div class="config-header">
              <h3 class="config-name">{{ config.chainName }}</h3>
              <button
                @click="addToWallet(config)"
                class="wallet-btn"
                title="添加到MetaMask"
              >
                🦊 添加到钱包
              </button>
            </div>
            <div class="config-details">
              <div class="config-item">
                <span class="config-label">链ID:</span>
                <span class="config-value">{{ config.chainId }}</span>
              </div>
              <div class="config-item">
                <span class="config-label">符号:</span>
                <span class="config-value">{{ config.nativeCurrency.symbol }}</span>
              </div>
              <div class="config-item">
                <span class="config-label">浏览器:</span>
                <a :href="config.blockExplorerUrls[0]" target="_blank" class="config-link">
                  {{ config.blockExplorerUrls[0] }}
                </a>
              </div>
              
              <!-- RPC列表 -->
              <div class="rpc-section">
                <div class="rpc-header">
                  <span class="config-label">RPC节点 ({{ config.rpcUrls.length }}个):</span>
                  <button 
                    @click="toggleRpcList(key)" 
                    class="toggle-btn"
                    :class="{ 'active': showRpcList[key] }"
                  >
                    {{ showRpcList[key] ? '收起' : '展开' }}
                  </button>
                </div>
                <div v-if="showRpcList[key]" class="rpc-list">
                  <div 
                    v-for="(rpcUrl, index) in config.rpcUrls" 
                    :key="index"
                    class="rpc-item"
                    :class="{ 
                      'rpc-active': getCurrentRpcIndex(key) === index,
                      'rpc-healthy': rpcHealth[key] && rpcHealth[key][index] && rpcHealth[key][index].healthy,
                      'rpc-unhealthy': rpcHealth[key] && rpcHealth[key][index] && !rpcHealth[key][index].healthy
                    }"
                  >
                    <div class="rpc-info">
                      <div class="rpc-url">{{ rpcUrl }}</div>
                      <div class="rpc-status">
                        <span class="rpc-indicator">
                          <div :class="[
                            'status-dot', 
                            rpcHealth[key] && rpcHealth[key][index] ? 
                              (rpcHealth[key][index].healthy ? 'status-connected' : 'status-disconnected') : 
                              'status-unknown'
                          ]"></div>
                          {{ getRpcStatusText(key, index) }}
                        </span>
                        <span v-if="rpcHealth[key] && rpcHealth[key][index] && rpcHealth[key][index].latency" class="rpc-latency">
                          {{ rpcHealth[key][index].latency }}ms
                        </span>
                      </div>
                    </div>
                    <button 
                      @click="switchRpc(key, index)"
                      class="switch-btn"
                      :disabled="getCurrentRpcIndex(key) === index"
                    >
                      {{ getCurrentRpcIndex(key) === index ? '当前' : '切换' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="control-buttons">
          <button
            @click="startMonitoring"
            :disabled="isMonitoring"
            class="btn btn-primary"
            :class="{ 'btn-disabled': isMonitoring }"
          >
            {{ isMonitoring ? '监控中...' : '开始监控' }}
          </button>
          <button
            @click="stopMonitoring"
            :disabled="!isMonitoring"
            class="btn btn-danger"
            :class="{ 'btn-disabled': !isMonitoring }"
          >
            停止监控
          </button>
          <button
            @click="checkAllRpcHealth"
            :disabled="isCheckingHealth"
            class="btn btn-secondary"
            :class="{ 'btn-disabled': isCheckingHealth }"
          >
            {{ isCheckingHealth ? '检测中...' : '检测RPC健康' }}
          </button>
        </div>
      </div>

      <!-- MetaMask连接状态 -->
      <div v-if="metamaskStatus" class="metamask-section">
        <div class="metamask-header">
          <div class="status-indicator">
            <div :class="['status-dot', metamaskStatus.connected ? 'status-connected' : 'status-disconnected']"></div>
            <span class="status-text">MetaMask状态: {{ metamaskStatus.connected ? '已连接' : '未连接' }}</span>
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
          当前账户: {{ metamaskStatus.account }}
        </div>
      </div>

      <!-- 监控状态 -->
      <div class="monitoring-grid">
        <!-- KTO链监控 -->
        <div class="monitor-card">
          <div class="monitor-header">
            <h3 class="monitor-title">{{ chainConfigs.kto.chainName }}监控</h3>
            <div class="status-indicator">
              <div :class="['status-dot', ktoStatus.connected ? 'status-connected' : 'status-disconnected']"></div>
              <span :class="['status-text', ktoStatus.connected ? 'text-success' : 'text-danger']">
                {{ ktoStatus.connected ? '已连接' : '未连接' }}
              </span>
            </div>
          </div>
          
          <div class="monitor-details">
            <div class="detail-item">
              <span class="detail-label">当前RPC:</span>
              <span class="detail-value current-rpc">{{ getCurrentRpcUrl('kto') }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">网络ID:</span>
              <span class="detail-value">{{ ktoStatus.chainId || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">当前区块:</span>
              <span class="detail-value">{{ ktoStatus.currentBlock || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">出块速度:</span>
              <span class="detail-value block-time">
                {{ ktoStatus.blockTime ? ktoStatus.blockTime + 's' : '-' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Gas价格:</span>
              <span class="detail-value">{{ ktoStatus.gasPrice || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">RPC延迟:</span>
              <span class="detail-value">{{ ktoStatus.latency ? ktoStatus.latency + 'ms' : '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">最后更新:</span>
              <span class="detail-value detail-time">{{ ktoStatus.lastUpdate || '-' }}</span>
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="ktoStatus.error" class="error-message">
            <p>{{ ktoStatus.error }}</p>
            <div v-if="ktoStatus.autoSwitched" class="auto-switch-info">
              已自动切换到备用RPC节点
            </div>
          </div>
        </div>

        <!-- NOS链监控 -->
        <div class="monitor-card">
          <div class="monitor-header">
            <h3 class="monitor-title">{{ chainConfigs.nos.chainName }}监控</h3>
            <div class="status-indicator">
              <div :class="['status-dot', nosStatus.connected ? 'status-connected' : 'status-disconnected']"></div>
              <span :class="['status-text', nosStatus.connected ? 'text-success' : 'text-danger']">
                {{ nosStatus.connected ? '已连接' : '未连接' }}
              </span>
            </div>
          </div>
          
          <div class="monitor-details">
            <div class="detail-item">
              <span class="detail-label">当前RPC:</span>
              <span class="detail-value current-rpc">{{ getCurrentRpcUrl('nos') }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">网络ID:</span>
              <span class="detail-value">{{ nosStatus.chainId || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">当前区块:</span>
              <span class="detail-value">{{ nosStatus.currentBlock || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">出块速度:</span>
              <span class="detail-value block-time">
                {{ nosStatus.blockTime ? nosStatus.blockTime + 's' : '-' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Gas价格:</span>
              <span class="detail-value">{{ nosStatus.gasPrice || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">RPC延迟:</span>
              <span class="detail-value">{{ nosStatus.latency ? nosStatus.latency + 'ms' : '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">最后更新:</span>
              <span class="detail-value detail-time">{{ nosStatus.lastUpdate || '-' }}</span>
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="nosStatus.error" class="error-message">
            <p>{{ nosStatus.error }}</p>
            <div v-if="nosStatus.autoSwitched" class="auto-switch-info">
              已自动切换到备用RPC节点
            </div>
          </div>
        </div>
      </div>

      <!-- 历史数据图表 -->
      <div class="history-section">
        <h3 class="section-title">出块时间历史</h3>
        <div class="history-grid">
          <div class="history-card">
            <h4 class="history-title">{{ chainConfigs.kto.chainName }}出块时间 (最近10次)</h4>
            <div class="history-list">
              <div 
                v-for="(time, index) in ktoBlockTimes.slice(-10)" 
                :key="index"
                class="history-item"
              >
                <span class="history-index">第{{ ktoBlockTimes.length - 10 + index + 1 }}次</span>
                <span class="history-time">{{ time }}s</span>
              </div>
            </div>
            <div v-if="ktoBlockTimes.length === 0" class="no-data">暂无数据</div>
          </div>
          <div class="history-card">
            <h4 class="history-title">{{ chainConfigs.nos.chainName }}出块时间 (最近10次)</h4>
            <div class="history-list">
              <div 
                v-for="(time, index) in nosBlockTimes.slice(-10)" 
                :key="index"
                class="history-item"
              >
                <span class="history-index">第{{ nosBlockTimes.length - 10 + index + 1 }}次</span>
                <span class="history-time">{{ time }}s</span>
              </div>
            </div>
            <div v-if="nosBlockTimes.length === 0" class="no-data">暂无数据</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ethers } from 'ethers'

export default {
  name: 'NodeMonitor',
  data() {
    return {
      // 链配置JSON
      chainConfigs: {
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
            'https://www.kortho-chain.org',
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
            'https://rpc.noschain.org',
          ],
          blockExplorerUrls: ['https://nosscan.noschain.org/']
        }
      },
      
      // 响应式数据
      isMonitoring: false,
      isCheckingHealth: false,
      
      // RPC相关状态
      currentRpcIndex: {
        kto: 0,
        nos: 0
      },
      showRpcList: {
        kto: false,
        nos: false
      },
      rpcHealth: {
        kto: [],
        nos: []
      },
      
      // MetaMask状态
      metamaskStatus: {
        connected: false,
        account: null,
        chainId: null
      },
      
      // 节点状态
      ktoStatus: {
        connected: false,
        chainId: null,
        currentBlock: null,
        blockTime: null,
        gasPrice: null,
        latency: null,
        lastUpdate: null,
        error: null,
        autoSwitched: false,
        lastBlockNumber: null,
        lastBlockTime: null
      },
      
      nosStatus: {
        connected: false,
        chainId: null,
        currentBlock: null,
        blockTime: null,
        gasPrice: null,
        latency: null,
        lastUpdate: null,
        error: null,
        autoSwitched: false,
        lastBlockNumber: null,
        lastBlockTime: null
      },
      
      // 出块时间历史
      ktoBlockTimes: [],
      nosBlockTimes: [],
      
      // Provider实例
      ktoProvider: null,
      nosProvider: null,
      monitoringInterval: null,
      healthCheckInterval: null
    }
  },
  
  mounted() {
    this.setupMetaMaskListeners()
    this.checkExistingConnection()
    this.initializeRpcHealth()
  },
  
  beforeDestroy() {
    this.stopMonitoring()
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
  },
  
  methods: {
    // 初始化RPC健康状态
    initializeRpcHealth() {
      Object.keys(this.chainConfigs).forEach(key => {
        this.$set(this.rpcHealth, key, this.chainConfigs[key].rpcUrls.map(() => ({
          healthy: null,
          latency: null,
          lastCheck: null
        })))
      })
    },
    
    // 切换RPC列表显示
    toggleRpcList(chainKey) {
      this.$set(this.showRpcList, chainKey, !this.showRpcList[chainKey])
    },
    
    // 获取当前RPC索引
    getCurrentRpcIndex(chainKey) {
      return this.currentRpcIndex[chainKey] || 0
    },
    
    // 获取当前RPC URL
    getCurrentRpcUrl(chainKey) {
      const index = this.getCurrentRpcIndex(chainKey)
      return this.chainConfigs[chainKey].rpcUrls[index]
    },
    
    // 获取RPC状态文本
    getRpcStatusText(chainKey, index) {
      const health = this.rpcHealth[chainKey] && this.rpcHealth[chainKey][index]
      if (!health || health.healthy === null) return '未检测'
      return health.healthy ? '健康' : '异常'
    },
    
    // 切换RPC
    async switchRpc(chainKey, index) {
      this.$set(this.currentRpcIndex, chainKey, index)
      
      // 如果正在监控，重新初始化provider
      if (this.isMonitoring) {
        await this.initializeProvider(chainKey)
      }
    },
    
    // 检查单个RPC健康状态
    async checkRpcHealth(rpcUrl, timeout = 5000) {
      const startTime = Date.now()
      try {
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
        
        // 设置超时
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), timeout)
        })
        
        // 尝试获取区块号
        await Promise.race([
          provider.getBlockNumber(),
          timeoutPromise
        ])
        
        const latency = Date.now() - startTime
        return {
          healthy: true,
          latency: latency,
          lastCheck: new Date().toLocaleTimeString('zh-CN')
        }
      } catch (error) {
        return {
          healthy: false,
          latency: null,
          lastCheck: new Date().toLocaleTimeString('zh-CN'),
          error: error.message
        }
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
    
    // 自动切换到健康的RPC
    async autoSwitchToHealthyRpc(chainKey) {
      const config = this.chainConfigs[chainKey]
      const currentIndex = this.getCurrentRpcIndex(chainKey)
      
      // 尝试其他RPC
      for (let i = 0; i < config.rpcUrls.length; i++) {
        if (i === currentIndex) continue
        
        const health = await this.checkRpcHealth(config.rpcUrls[i], 3000)
        if (health.healthy) {
          console.log(`自动切换${chainKey}到RPC ${i}: ${config.rpcUrls[i]}`)
          this.$set(this.currentRpcIndex, chainKey, i)
          
          // 更新健康状态
          if (this.rpcHealth[chainKey]) {
            this.$set(this.rpcHealth[chainKey], i, health)
          }
          
          return true
        }
      }
      
      return false
    },
    
    // 初始化Provider
    async initializeProvider(chainKey) {
      const rpcUrl = this.getCurrentRpcUrl(chainKey)
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
      
      if (chainKey === 'kto') {
        this.ktoProvider = provider
      } else if (chainKey === 'nos') {
        this.nosProvider = provider
      }
    },
    
    // 检查MetaMask是否安装
    checkMetaMask() {
      if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask已安装')
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
    
    // 添加网络到MetaMask
    async addToWallet(chainConfig) {
      if (!this.checkMetaMask()) return

      try {
        // 转换chainId为十六进制
        const hexChainId = '0x' + parseInt(chainConfig.chainId).toString(16)
        const configForMetaMask = {
          ...chainConfig,
          chainId: hexChainId
        }
        
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [configForMetaMask]
        })
        
        alert(`${chainConfig.chainName} 网络添加成功！`)
      } catch (error) {
        console.error('添加网络失败:', error)
        
        if (error.code === 4902) {
          alert('用户拒绝添加网络')
        } else if (error.code === -32602) {
          alert('网络参数无效')
        } else {
          alert('添加网络失败: ' + error.message)
        }
      }
    },
    
    // 格式化Gas价格
    formatGasPrice(gasPrice) {
      if (!gasPrice) return null
      return `${ethers.utils.formatUnits(gasPrice, 'gwei')} Gwei`
    },
    
    // 格式化时间
    formatTime(date) {
      return date.toLocaleTimeString('zh-CN')
    },
    
    // 监控单个节点
    async monitorNode(provider, status, blockTimes, chainName, chainKey) {
      const startTime = Date.now()
      
      try {
        // 检查连接状态
        const network = await provider.getNetwork()
        status.chainId = network.chainId
        status.connected = true
        status.error = null
        status.autoSwitched = false

        // 获取当前区块号
        const currentBlockNumber = await provider.getBlockNumber()
        status.currentBlock = currentBlockNumber

        // 获取Gas价格
        const gasPrice = await provider.getGasPrice()
        status.gasPrice = this.formatGasPrice(gasPrice)

        // 计算延迟
        status.latency = Date.now() - startTime

        // 计算出块时间
        if (status.lastBlockNumber && status.lastBlockTime) {
          const timeDiff = (Date.now() - status.lastBlockTime) / 1000
          const blockDiff = currentBlockNumber - status.lastBlockNumber
          
          if (blockDiff > 0) {
            const avgBlockTime = (timeDiff / blockDiff).toFixed(2)
            status.blockTime = avgBlockTime
            blockTimes.push(parseFloat(avgBlockTime))
            
            // 只保留最近50次记录
            if (blockTimes.length > 50) {
              blockTimes.shift()
            }
          }
        }

        // 记录当前区块信息用于下次计算
        status.lastBlockNumber = currentBlockNumber
        status.lastBlockTime = Date.now()
        status.lastUpdate = this.formatTime(new Date())

        // 更新RPC健康状态
        const currentIndex = this.getCurrentRpcIndex(chainKey)
        if (this.rpcHealth[chainKey] && this.rpcHealth[chainKey][currentIndex]) {
          this.$set(this.rpcHealth[chainKey], currentIndex, {
            healthy: true,
            latency: status.latency,
            lastCheck: status.lastUpdate
          })
        }

      } catch (error) {
        console.error(`${chainName} 监控错误:`, error)
        status.connected = false
        status.error = error.message
        status.lastUpdate = this.formatTime(new Date())
        
        // 更新RPC健康状态
        const currentIndex = this.getCurrentRpcIndex(chainKey)
        if (this.rpcHealth[chainKey] && this.rpcHealth[chainKey][currentIndex]) {
          this.$set(this.rpcHealth[chainKey], currentIndex, {
            healthy: false,
            latency: null,
            lastCheck: status.lastUpdate,
            error: error.message
          })
        }
        
        // 尝试自动切换RPC
        const switched = await this.autoSwitchToHealthyRpc(chainKey)
        if (switched) {
          status.autoSwitched = true
          // 重新初始化provider
          await this.initializeProvider(chainKey)
        }
      }
    },
    
    // 开始监控
    async startMonitoring() {
      this.isMonitoring = true

      try {
        // 初始化Provider
        await this.initializeProvider('kto')
        await this.initializeProvider('nos')

        // 立即执行一次监控
        await this.monitorNode(this.ktoProvider, this.ktoStatus, this.ktoBlockTimes, 'KTO', 'kto')
        await this.monitorNode(this.nosProvider, this.nosStatus, this.nosBlockTimes, 'NOS', 'nos')

        // 设置定时监控 (每10秒)
        this.monitoringInterval = setInterval(async () => {
          await this.monitorNode(this.ktoProvider, this.ktoStatus, this.ktoBlockTimes, 'KTO', 'kto')
          await this.monitorNode(this.nosProvider, this.nosStatus, this.nosBlockTimes, 'NOS', 'nos')
        }, 10000)

        // 设置定时健康检查 (每30秒)
        this.healthCheckInterval = setInterval(() => {
          this.checkAllRpcHealth()
        }, 30000)

      } catch (error) {
        console.error('启动监控失败:', error)
        this.isMonitoring = false
        alert('启动监控失败: ' + error.message)
      }
    },
    
    // 停止监控
    stopMonitoring() {
      this.isMonitoring = false
      
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval)
        this.monitoringInterval = null
      }
      
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
        this.healthCheckInterval = null
      }

      // 重置连接状态
      this.ktoStatus.connected = false
      this.nosStatus.connected = false
      
      this.ktoProvider = null
      this.nosProvider = null
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
/* 基础样式重置 */
* {
  box-sizing: border-box;
}

/* 主容器 */
.node-monitor {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 标题样式 */
.main-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1.5rem;
}

/* 卡片基础样式 */
.config-section,
.metamask-section,
.monitor-card,
.history-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.config-section:hover,
.metamask-section:hover,
.monitor-card:hover,
.history-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

/* 配置网格 */
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.config-card {
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  transition: border-color 0.2s ease;
}

.config-card:hover {
  border-color: #667eea;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.config-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.wallet-btn {
  background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wallet-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(237, 137, 54, 0.3);
}

.config-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.config-label {
  color: #718096;
  font-weight: 500;
}

.config-value {
  color: #2d3748;
  font-weight: 600;
}

.config-link {
  color: #3182ce;
  text-decoration: none;
  font-size: 0.75rem;
  word-break: break-all;
  max-width: 200px;
  text-align: right;
}

.config-link:hover {
  text-decoration: underline;
}

/* RPC部分样式 */
.rpc-section {
  margin-top: 1rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.rpc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.toggle-btn {
  background: #edf2f7;
  color: #4a5568;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover,
.toggle-btn.active {
  background: #667eea;
  color: white;
}

.rpc-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.rpc-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.rpc-item:hover {
  border-color: #cbd5e0;
}

.rpc-active {
  border-color: #667eea;
  background: #f0f4ff;
}

.rpc-healthy {
  border-left: 4px solid #48bb78;
}

.rpc-unhealthy {
  border-left: 4px solid #f56565;
}

.rpc-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rpc-url {
  font-size: 0.75rem;
  color: #2d3748;
  font-family: 'Courier New', monospace;
  word-break: break-all;
}

.rpc-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.rpc-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.rpc-latency {
  color: #3182ce;
  font-weight: 600;
}

.switch-btn {
  background: #edf2f7;
  color: #4a5568;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 50px;
}

.switch-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.switch-btn:disabled {
  background: #a0aec0;
  color: white;
  cursor: not-allowed;
}

/* 按钮样式 */
.control-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.btn-primary {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
}

.btn-primary:hover:not(.btn-disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.btn-danger {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
}

.btn-danger:hover:not(.btn-disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
  color: white;
}

.btn-secondary:hover:not(.btn-disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(160, 174, 192, 0.3);
}

.btn-metamask {
  background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-metamask:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(237, 137, 54, 0.3);
}

.btn-disabled {
  background: #a0aec0 !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

/* MetaMask 部分 */
.metamask-header {
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
}

.text-success {
  color: #38a169;
}

.text-danger {
  color: #e53e3e;
}

.account-info {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #718096;
  font-family: 'Courier New', monospace;
  background: #f7fafc;
  padding: 0.5rem;
  border-radius: 4px;
}

/* 监控网格 */
.monitoring-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.monitor-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.monitor-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f7fafc;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.detail-item:hover {
  background: #edf2f7;
}

.detail-label {
  color: #718096;
  font-weight: 500;
}

.detail-value {
  color: #2d3748;
  font-weight: 600;
}

.current-rpc {
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  max-width: 200px;
  word-break: break-all;
  text-align: right;
}

.block-time {
  color: #3182ce;
  font-family: 'Courier New', monospace;
}

.detail-time {
  font-size: 0.875rem;
  color: #718096;
}

/* 错误消息 */
.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #fed7d7;
  border: 1px solid #feb2b2;
  border-radius: 6px;
  color: #c53030;
  font-size: 0.875rem;
}

.auto-switch-info {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #c6f6d5;
  border: 1px solid #9ae6b4;
  border-radius: 4px;
  color: #22543d;
  font-size: 0.75rem;
}

/* 历史数据 */
.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.history-card {
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.history-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 1rem 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f7fafc;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
}

.history-item:hover {
  background: #edf2f7;
}

.history-index {
  color: #718096;
}

.history-time {
  color: #3182ce;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.no-data {
  color: #a0aec0;
  font-style: italic;
  text-align: center;
  padding: 2rem;
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
  .node-monitor {
    padding: 1rem;
  }
  
  .main-title {
    font-size: 2rem;
  }
  
  .config-grid,
  .monitoring-grid,
  .history-grid {
    grid-template-columns: 1fr;
  }
  
  .config-header,
  .metamask-header,
  .monitor-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .control-buttons {
    flex-direction: column;
  }
  
  .config-item,
  .detail-item,
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .rpc-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .current-rpc {
    max-width: none;
    text-align: left;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 1.75rem;
  }
  
  .section-title {
    font-size: 1.25rem;
  }
  
  .config-section,
  .metamask-section,
  .monitor-card,
  .history-section {
    padding: 1rem;
  }
}
</style>