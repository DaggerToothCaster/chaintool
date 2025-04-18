<template>
  <div class="main-box">
      <h2>🛠 Solidity 函数选择器查询工具</h2>

      <el-tabs v-model="activeTab">
          <!-- 计算选择器 -->
          <el-tab-pane label="计算选择器" name="calculate">
              <el-form label-position="top">
                  <el-form-item label="函数签名">
                      <el-input
                          type="textarea"
                          :rows="2"
                          v-model="functionSignature"
                          placeholder="例如：transfer(address,uint256)"
                          @keyup.enter="calculateSelector"
                      />
                  </el-form-item>

                  <el-button type="primary" @click="calculateSelector" :loading="calculating">计算选择器</el-button>

                  <el-form-item label="计算结果" v-if="selectorResult">
                      <el-form-item label="选择器">
                          <el-input type="textarea" :rows="2" :value="selectorResult" readonly />
                          <el-button style="margin-top: 10px;" @click="copySelector">复制</el-button>
                      </el-form-item>
                      <el-form-item label="字节表示">
                          <el-input type="textarea" :rows="2" :value="bytesRepresentation" readonly />
                          <el-button style="margin-top: 10px;" @click="copyBytes">复制</el-button>
                      </el-form-item>
                  </el-form-item>
              </el-form>
          </el-tab-pane>

          <!-- 常见函数签名 -->
          <el-tab-pane label="常见函数签名" name="presets">
              <el-table :data="commonExamples" style="width: 100%">
                  <el-table-column prop="name" label="函数" />
                  <el-table-column prop="signature" label="签名" />
                  <el-table-column label="操作" width="120">
                      <template slot-scope="scope">
                          <el-button size="mini" @click="useExample(scope.row.signature)">使用</el-button>
                      </template>
                  </el-table-column>
              </el-table>
          </el-tab-pane>

          <!-- 使用帮助 -->
          <el-tab-pane label="使用帮助" name="help">
              <div style="line-height: 1.8;">
                  <p><strong>🛠 计算选择器：</strong></p>
                  <ul>
                      <li>输入函数签名：如 <code>transfer(address,uint256)</code></li>
                      <li>签名中的空格会被忽略</li>
                      <li>点击"计算选择器"生成函数选择器和字节表示</li>
                  </ul>
                  <p><strong>📎 提示：</strong> 选择器计算基于 @ethersproject/abi，使用 keccak256 哈希算法的前4字节。</p>
              </div>
          </el-tab-pane>
      </el-tabs>
  </div>
</template>

<script>
import { Interface } from '@ethersproject/abi';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import { hexDataSlice } from '@ethersproject/bytes';

export default {
  name: 'SignatureSelector',
  data() {
      return {
          activeTab: 'calculate',
          functionSignature: '',
          selectorResult: '',
          bytesRepresentation: '',
          calculating: false,
          commonExamples: [
              { name: '转账', signature: 'transfer(address,uint256)' },
              { name: '批准额度', signature: 'approve(address,uint256)' },
              { name: '余额查询', signature: 'balanceOf(address)' },
              { name: '总供应量', signature: 'totalSupply()' },
              { name: '授权转账', signature: 'transferFrom(address,address,uint256)' },
              { name: '名称', signature: 'name()' },
              { name: '符号', signature: 'symbol()' },
              { name: '小数位', signature: 'decimals()' },
              { name: '安全转账', signature: 'safeTransferFrom(address,address,uint256,bytes)' },
          ],
      };
  },
  methods: {
      calculateSelector() {
          if (!this.functionSignature.trim()) {
              this.$message.warning('请输入函数签名');
              return;
          }

          this.calculating = true;
          this.selectorResult = '';
          this.bytesRepresentation = '';

          try {
              // Remove spaces
              let cleanSignature = this.functionSignature.replace(/\s+/g, '');

              // Ensure proper formatting for Interface
              if (!cleanSignature.startsWith('function')) {
                  cleanSignature = `function ${cleanSignature}`;
              }

              // Create interface to validate signature
              const iface = new Interface([cleanSignature]);

              // Extract function fragment and get canonical signature
              const funcFragment = iface.functions[Object.keys(iface.functions)[0]];
              const canonicalSignature = funcFragment.name + '(' + funcFragment.inputs.map(input => input.type).join(',') + ')';

              // Calculate selector
              const selector = hexDataSlice(keccak256(toUtf8Bytes(canonicalSignature)), 0, 4);
              this.selectorResult = selector;
              this.bytesRepresentation = this.formatBytes(selector);

              this.$message.success('计算成功');
          } catch (error) {
              console.error('计算选择器失败:', error);
              this.$message.error('计算失败: ' + error.message);
          } finally {
              this.calculating = false;
          }
      },

      formatBytes(hexString) {
          return hexString.slice(2).match(/.{1,2}/g).join(' ');
      },

      useExample(signature) {
          this.functionSignature = signature;
          this.activeTab = 'calculate';
          this.calculateSelector();
      },

      copySelector() {
          navigator.clipboard.writeText(this.selectorResult).then(() => {
              this.$message.success('选择器已复制到剪贴板');
          }).catch(err => {
              console.error('复制失败:', err);
              this.$message.error('复制失败，请手动复制');
          });
      },

      copyBytes() {
          navigator.clipboard.writeText(this.bytesRepresentation).then(() => {
              this.$message.success('字节表示已复制到剪贴板');
          }).catch(err => {
              console.error('复制失败:', err);
              this.$message.error('复制失败，请手动复制');
          });
      },
  },
};
</script>

<style scoped>
.main-box {
  max-width: 800px;
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

code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}
</style>