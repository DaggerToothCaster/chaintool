<template>
  <div class="navigation-container">
    <div class="navigation-header">
      <h2 class="navigation-title">以太坊开发者工具</h2>
      <p class="navigation-subtitle">一套实用的区块链开发工具集合</p>
    </div>
    
    <div class="navigation-grid">
      <router-link 
        v-for="(item, index) in navItems" 
        :key="item.path" 
        :to="item.path" 
        class="navigation-card"
        :style="{'--index': index}"
      >
        <div class="card-icon">
          <span class="icon-bg">{{ index + 1 }}</span>
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ item.name }}</h3>
          <p class="card-path">{{ item.description }}</p>
        </div>
        <div class="card-arrow">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
          </svg>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      navItems: [
        { path: '/1.Private-key-load-address', name: '私钥加载地址', description: '通过私钥加载以太坊地址' },
        { path: '/2.Mnemonic-words-create-accounts', name: '通过助记词加载地址', description: '使用助记词生成和加载账户' },
        // { path: '/3.KeyStore-import-and-export', name: 'Keystore 导入导出', description: '导入或导出 Keystore 文件' },
        { path: '/4.Wallet-information-and-signed-transactions', name: '钱包信息及签名交易', description: '查看钱包信息并进行交易签名' },
        { path: '/5.function-sign', name: '函数名查询函数选择器', description: '查询函数名对应的函数选择器' },
        { path: '/6.event-topic', name: '事件Topic查询', description: '查询事件的 Topic 值' },
        { path: '/7.calldata-encode', name: '交易输入数据(Calldata)编解码', description: '对交易输入数据进行编码和解码' },
        { path: '/8.eth-unit-converter', name: '以太单位转换器', description: '进行以太坊单位的转换' },
        { path: '/9.abi', name: 'ABI可视化调用', description: '通过可视化界面调用智能合约 ABI' },
        { path: '/10.sign', name: 'Sign签名', description: '生成和验证签名' },
        { path: '/11.EventLog', name: '交易日志解码器', description: '解码以太坊交易日志' },
      ],
    };
  },
};
</script>

<style lang="scss" scoped>
.navigation-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  min-height: 100vh;
}

.navigation-header {
  text-align: center;
  margin-bottom: 3rem;
}

.navigation-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  position: relative;
  background: linear-gradient(90deg, #3498db, #9b59b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.navigation-subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.navigation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 0.5rem;
}

.navigation-card {
  display: flex;
  align-items: center;
  padding: 1.25rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    
    .card-icon .icon-bg {
      transform: scale(1.1);
    }
    
    .card-arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  &.router-link-active {
    background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(155, 89, 182, 0.1));
    border: 1px solid rgba(52, 152, 219, 0.2);
    
    .card-icon .icon-bg {
      background: linear-gradient(135deg, #3498db, #9b59b6);
      color: white;
    }
    
    .card-title {
      color: #3498db;
    }
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, #3498db, #9b59b6);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
}

.card-icon {
  margin-right: 1.25rem;
  flex-shrink: 0;
  
  .icon-bg {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(52, 152, 219, 0.1);
    color: #3498db;
    font-weight: 700;
    font-size: 1.2rem;
    transition: all 0.3s ease;
  }
}

.card-content {
  flex-grow: 1;
  
  .card-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 0.25rem;
    transition: color 0.3s ease;
  }
  
  .card-path {
    font-size: 0.85rem;
    color: #7f8c8d;
    font-family: 'Courier New', monospace;
    opacity: 0.8;
  }
}

.card-arrow {
  opacity: 0;
  transform: translateX(-5px);
  transition: all 0.3s ease;
  color: #7f8c8d;
}

/* 动画效果 */
@keyframes cardEntrance {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.navigation-card {
  animation: cardEntrance 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  animation-delay: calc(0.1s * var(--index));
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navigation-grid {
    grid-template-columns: 1fr;
  }
  
  .navigation-title {
    font-size: 2rem;
  }
  
  .navigation-subtitle {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .navigation-container {
    padding: 1.5rem 1rem;
  }
  
  .navigation-header {
    margin-bottom: 2rem;
  }
  
  .navigation-card {
    padding: 1rem;
  }
  
  .card-icon .icon-bg {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}
</style>