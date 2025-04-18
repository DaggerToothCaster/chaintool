<template>
  <div class="main-box">
      <h2>📡 Solidity 事件 Topic 查询工具</h2>

      <el-tabs v-model="activeTab">
          <!-- 计算 Topic -->
          <el-tab-pane label="计算 Topic" name="calculate">
              <el-form label-position="top">
                  <el-form-item label="事件签名">
                      <el-input
                          type="textarea"
                          :rows="2"
                          v-model="eventSignature"
                          placeholder="例如：Transfer(address indexed,address,uint256)"
                          @keyup.enter="calculateTopic"
                      />
                  </el-form-item>

                  <el-button type="primary" @click="calculateTopic" :loading="calculating">计算 Topic</el-button>

                  <el-form-item label="计算结果" v-if="topicResult">
                      <el-input type="textarea" :rows="3" :value="topicResult" readonly />
                      <el-button style="margin-top: 10px;" @click="copyToClipboard">复制</el-button>
                  </el-form-item>
              </el-form>
          </el-tab-pane>

          <!-- 常见事件签名 -->
          <el-tab-pane label="常见事件签名" name="presets">
              <el-table :data="commonExamples" style="width: 100%">
                  <el-table-column prop="name" label="事件" />
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
                  <p><strong>📡 计算 Topic：</strong></p>
                  <ul>
                      <li>输入事件签名：如 <code>Transfer(address indexed,address,uint256)</code></li>
                      <li>支持带 <code>indexed</code> 关键字的签名，计算时会自动忽略</li>
                      <li>签名中的空格会被忽略</li>
                      <li>点击"计算 Topic"生成事件 topic</li>
                  </ul>
                  <p><strong>📎 提示：</strong> Topic 计算基于 @ethersproject/abi，使用 keccak256 哈希算法。</p>
              </div>
          </el-tab-pane>
      </el-tabs>
  </div>
</template>

<script>
import { Interface } from '@ethersproject/abi';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';

export default {
  name: 'EventTopicCalculator',
  data() {
      return {
          activeTab: 'calculate',
          eventSignature: '',
          topicResult: '',
          calculating: false,
          commonExamples: [
              { name: '转账', signature: 'Transfer(address indexed,address indexed,uint256)' },
              { name: '授权', signature: 'Approval(address indexed,address indexed,uint256)' },
              { name: '存款', signature: 'Deposit(address indexed,uint256)' },
              { name: '取款', signature: 'Withdrawal(address indexed,uint256)' },
              { name: '所有权转移', signature: 'OwnershipTransferred(address indexed,address indexed)' },
          ],
      };
  },
  methods: {
      calculateTopic() {
          if (!this.eventSignature.trim()) {
              this.$message.warning('请输入事件签名');
              return;
          }

          this.calculating = true;
          this.topicResult = '';

          try {
              // Remove spaces and 'indexed' keywords
              let cleanSignature = this.eventSignature
                  .replace(/\s+/g, '') // Remove all spaces
                  .replace(/indexed/g, ''); // Remove 'indexed' keywords

              // Ensure proper formatting for Interface
              if (!cleanSignature.startsWith('event')) {
                  cleanSignature = `event ${cleanSignature}`;
              }

              // Create interface to validate signature
              const iface = new Interface([cleanSignature]);

              // Extract event fragment and get canonical signature
              const eventFragment = iface.events[Object.keys(iface.events)[0]];
              const canonicalSignature = eventFragment.name + '(' + eventFragment.inputs.map(input => input.type).join(',') + ')';

              // Calculate topic
              const topic = keccak256(toUtf8Bytes(canonicalSignature));
              this.topicResult = topic;
              this.$message.success('计算成功');
          } catch (error) {
              console.error('计算失败:', error);
              this.$message.error('计算失败: ' + error.message);
          } finally {
              this.calculating = false;
          }
      },

      useExample(signature) {
          this.eventSignature = signature;
          this.activeTab = 'calculate';
          this.calculateTopic();
      },

      copyToClipboard() {
          navigator.clipboard.writeText(this.topicResult).then(() => {
              this.$message.success('已复制到剪贴板');
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