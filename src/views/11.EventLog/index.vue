<template>
    <div class="main-box">
        <h2>📜 Solidity 事件解码器</h2>

        <el-tabs v-model="activeTab">
            <!-- 解码事件 -->
            <el-tab-pane label="解码事件" name="decode">
                <el-form label-position="top">
                    <el-form-item label="事件签名">
                        <el-input type="textarea" :rows="2" v-model="eventSignature"
                            placeholder="例如：Transfer(address indexed,address indexed,uint256)" />
                    </el-form-item>

                    <el-form-item label="Topic 0（事件选择器）">
                        <el-input v-model="topic0" placeholder="请输入 Topic 0（0x 开头）" />
                    </el-form-item>

                    <el-form-item label="其他 Topics（每行一个，indexed 参数）">
                        <el-input type="textarea" :rows="4" v-model="otherTopics"
                            placeholder="示例：\n0x0000000000000000000000008ba1f109551bD432803012645Ac136ddd64DBA72\n0x000000000000000000000000aB7C8803962c0f2F5BBBe3FA8bf41cd82AA1923C" />
                    </el-form-item>

                    <el-form-item label="数据（Data）">
                        <el-input type="textarea" :rows="4" v-model="eventData"
                            placeholder="请输入事件数据（0x 开头，例如：0x00000000000000000000000000000000000000000000000f789d1676b2ce0e00）" />
                    </el-form-item>
                    <el-form-item>
                        <el-button @click="decodeEvent">解码</el-button>
                    </el-form-item>

                    <el-form-item label="解码结果" v-if="decodedParams.length">
                        <el-table :data="decodedParams" style="width: 100%">
                            <el-table-column prop="index" label="#" width="50" />
                            <el-table-column prop="name" label="参数名" width="150" />
                            <el-table-column prop="type" label="类型" width="150" />
                            <el-table-column prop="value" label="值" />
                            <el-table-column label="操作" width="120">
                                <template slot-scope="scope">
                                    <el-button size="mini" @click="copyResult(scope.row.value)"
                                        :disabled="!scope.row.value">
                                        复制
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-form-item>
                </el-form>
            </el-tab-pane>

            <!-- 常见事件签名 -->
            <el-tab-pane label="常见事件签名" name="presets">
                <el-table :data="commonEvents" style="width: 100%">
                    <el-table-column prop="name" label="事件" />
                    <el-table-column prop="signature" label="签名" />
                    <el-table-column label="操作" width="120">
                        <template slot-scope="scope">
                            <el-button size="mini" @click="useEvent(scope.row.signature)">使用</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>

            <!-- 使用帮助 -->
            <el-tab-pane label="使用帮助" name="help">
                <div style="line-height: 1.8;">
                    <p><strong>📜 解码事件：</strong></p>
                    <ul>
                        <li>输入事件签名：如 <code>Transfer(address indexed,address indexed,uint256)</code></li>
                        <li>支持带 <code>indexed</code> 关键字的签名，解码时会自动忽略</li>
                        <li>签名中的空格会被忽略</li>
                        <li>输入 Topic 0（事件选择器）、其他 Topics（每行一个，对应 indexed 参数）和数据（非 indexed 参数）</li>
                        <li>Topics 数量（不含 Topic 0）需匹配 indexed 参数数量</li>
                        <li>数据长度需匹配非 indexed 参数（每参数 32 字节，例如 uint256 需要 32 字节）</li>
                        <li>解码结果显示参数名、类型和值</li>
                    </ul>
                    <p><strong>📎 提示：</strong> 解码基于 @ethersproject/abi，使用 Interface 解析事件日志。确保 Topic 0 与事件签名匹配，Topics
                        和数据与参数一致。</p>
                </div>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script>
import { Interface } from '@ethersproject/abi';
import { getAddress } from '@ethersproject/address';
import { hexDataLength } from '@ethersproject/bytes';

export default {
    name: 'EventDecoder',
    data() {
        return {
            activeTab: 'decode',
            eventSignature: 'Transfer(address indexed,address indexed,uint256)',
            topic0: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            otherTopics: '0x0000000000000000000000005005236a5c3592043c3031166fd4b2c2bc1a78dc\n0x000000000000000000000000de5199d52ddb762408fcf7cf4c7c0b1c7e66a0e3',
            eventData: '0x00000000000000000000000000000000000000000000000f789d1676b2ce0e00',
            decodedParams: [],
            commonEvents: [
                { name: '转账', signature: 'Transfer(address indexed,address indexed,uint256)' },
                { name: '授权', signature: 'Approval(address indexed,address indexed,uint256)' },
                { name: '存款', signature: 'Deposit(address indexed,uint256)' },
                { name: '取款', signature: 'Withdrawal(address indexed,uint256)' },
                { name: '所有权转移', signature: 'OwnershipTransferred(address indexed,address indexed)' },
            ],
        };
    },
    methods: {
        decodeEvent() {
            this.decodedParams = [];

            if (!this.eventSignature.trim() || !this.topic0.trim() || !this.eventData.trim()) {
                return;
            }

            try {
                // 清理签名，仅移除多余空格，保留 indexed 关键字
                let cleanSignature = this.eventSignature.trim();

                // 验证签名格式
                const signatureRegex = /^[a-zA-Z0-9_]+\(([^()]+)\)$/;
                if (!signatureRegex.test(cleanSignature)) {
                    throw new Error('无效的事件签名格式，必须为 EventName(param1,param2,...)');
                }

                // 提取事件名称和参数
                const [, eventName, params] = cleanSignature.match(/^([a-zA-Z0-9_]+)\(([^()]+)\)$/);
                if (!eventName || !params) {
                    throw new Error('无法解析事件名称或参数');
                }

                // 分割参数并规范化
                const paramList = params.split(',').map(param => param.trim()).filter(param => param);
                const formattedParams = paramList.map(param => {
                    // 分离类型、名称和 indexed 关键字
                    const parts = param.split(/\s+/);
                    let type = parts[0];
                    let isIndexed = false;

                    // 检查是否包含 indexed
                    if (parts.includes('indexed')) {
                        isIndexed = true;
                        // 移除 indexed 后的部分，重新构造类型
                        const indexedIndex = parts.indexOf('indexed');
                        type = parts.slice(0, indexedIndex).join('');
                    }

                    // 验证类型是否有效（简单检查）
                    if (!type.match(/^[a-zA-Z0-9[\]]+$/)) {
                        throw new Error(`无效的参数类型: ${type}`);
                    }

                    // 返回格式化参数
                    return isIndexed ? `${type} indexed` : type;
                });

                // 构造事件片段
                const eventFragment = `event ${eventName}(${formattedParams.join(',')})`;

                // 创建 Interface
                const iface = new Interface([eventFragment]);

                // 获取事件片段
                const eventKey = Object.keys(iface.events)[0];
                const eventFragmentObj = iface.events[eventKey];

                // 准备 topics
                const topics = [this.topic0];
                if (this.otherTopics.trim()) {
                    const otherTopicsArray = this.otherTopics
                        .split('\n')
                        .map(t => t.trim())
                        .filter(t => t);
                    topics.push(...otherTopicsArray);
                }

                // 验证 topics 数量与索引参数数量
                const indexedParams = eventFragmentObj.inputs.filter(input => input.indexed).length;
                if (topics.length - 1 > indexedParams) {
                    this.$message.warning(
                        `警告：提供 ${topics.length - 1} 个 Topics，但事件只有 ${indexedParams} 个 indexed 参数。将忽略多余的 Topics。`
                    );
                    topics.length = indexedParams + 1;
                } else if (topics.length - 1 < indexedParams) {
                    throw new Error(
                        `Topics 数量 (${topics.length - 1}) 小于 indexed 参数数量 (${indexedParams})`
                    );
                }

                // 验证数据长度与非索引参数数量
                const nonIndexedParams = eventFragmentObj.inputs.filter(input => !input.indexed).length;
                const expectedDataLength = nonIndexedParams * 32;
                const actualDataLength = hexDataLength(this.eventData);
                if (actualDataLength < expectedDataLength) {
                    throw new Error(
                        `数据长度不足：实际 ${actualDataLength} 字节，预期 ${expectedDataLength} 字节（${nonIndexedParams} 个非 indexed 参数）`
                    );
                }

                // 解码日志
                const decoded = iface.decodeEventLog(eventFragmentObj, this.eventData, topics);

                // 格式化解码参数
                this.decodedParams = eventFragmentObj.inputs.map((input, index) => ({
                    index: index + 1,
                    name: input.name || `param${index + 1}`,
                    type: input.type,
                    value: this.formatValue(decoded[index], input.type),
                }));

                this.$message.success('解码成功');
            } catch (error) {
                console.error('解码失败:', error);
                this.$message.error('解码失败: ' + error.message);
            }
        },

        formatValue(value, type) {
            if (value === null || value === undefined) return '';
            if (type === 'address') {
                try {
                    return getAddress(value);
                } catch {
                    return value.toString();
                }
            }
            if (type.includes('int') && typeof value === 'object' && value.toString) {
                return value.toString();
            }
            return value.toString();
        },

        useEvent(signature) {
            this.eventSignature = signature;
            this.activeTab = 'decode';
            this.decodeEvent();
        },

        copyResult(value) {
            if (!value) return;

            navigator.clipboard.writeText(value.toString())
                .then(() => {
                    this.$message.success(`已复制: ${value}`);
                })
                .catch(err => {
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