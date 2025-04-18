<template>
    <div class="main-box">
        <h2>ABI 可视化调用工具</h2>
  
      <el-form label-position="top" label-width="100">
        <el-form-item label="签名内容">
          <el-input
            type="textarea"
            :rows="4"
            placeholder="请输入需要签名的内容"
            v-model="message"
          />
        </el-form-item>
  
        <el-form-item label="签名方式">
          <el-radio-group v-model="signMethod">
            <el-radio label="privateKey">使用私钥</el-radio>
            <el-radio label="wallet">连接钱包</el-radio>
          </el-radio-group>
        </el-form-item>
  
        <el-form-item v-if="signMethod === 'privateKey'" label="私钥">
          <el-input
            v-model="privateKey"
            placeholder="请输入私钥 (0x...)"
            show-password
          />
        </el-form-item>
  
        <el-form-item>
          <el-button type="primary" @click="signMessage">签名</el-button>
        </el-form-item>
  
        <el-form-item v-if="signature" label="签名结果">
          <el-input
            type="textarea"
            :rows="3"
            v-model="signature"
            readonly
          />
          <el-button style="margin-top: 10px;" type="success" @click="copySignature">
            复制签名
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </template>
  
  <script>
  import { ethers } from 'ethers'
  
  export default {
    name: 'SignTool',
    data() {
      return {
        message: '',
        privateKey: '',
        signature: '',
        signMethod: 'privateKey',
      }
    },
    methods: {
      async signMessage() {
        if (!this.message) {
          this.$message.warning('请输入签名内容')
          return
        }
  
        try {
          let signer
  
          if (this.signMethod === 'privateKey') {
            if (!this.privateKey) {
              this.$message.error('请输入私钥')
              return
            }
            signer = new ethers.Wallet(this.privateKey)
          } else {
            if (!window.ethereum) {
              this.$message.error('未检测到钱包，请安装 MetaMask')
              return
            }
            const provider = new ethers.BrowserProvider(window.ethereum)
            await provider.send('eth_requestAccounts', [])
            signer = await provider.getSigner()
          }
  
          const sig = await signer.signMessage(this.message)
          this.signature = sig
          this.$message.success('签名成功')
        } catch (err) {
          console.error(err)
          this.$message.error('签名失败，请检查输入或钱包连接')
        }
      },
      copySignature() {
        navigator.clipboard.writeText(this.signature).then(() => {
          this.$message.success('签名已复制到剪贴板')
        })
      },
    },
  }
  </script>
  
  <style scoped>
  .box-card {
    margin-top: 40px;
  }
  </style>
  