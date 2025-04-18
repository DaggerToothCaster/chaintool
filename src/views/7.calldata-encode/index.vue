<template>
    <div class="main-box">
        <h2>📦 Calldata 编解码工具</h2>

        <el-tabs v-model="activeTab">
            <!-- 编码 -->
            <el-tab-pane label="编码" name="encode">
                <el-form label-position="top">
                    <el-form-item label="函数签名">
                        <el-input type="textarea" :rows="2" v-model="functionSignature"
                            placeholder="例如：transfer(address,uint256)" />
                    </el-form-item>

                    <el-form-item label="参数（每行一个，按顺序）">
                        <el-input type="textarea" :rows="6" v-model="paramsInput"
                            placeholder="示例：\n0xAbC123...\n1000000000000000000" />
                    </el-form-item>

                    <el-button type="primary" @click="encodeCalldata">编码</el-button>

                    <el-form-item label="编码结果" v-if="calldataEncoded">
                        <el-input type="textarea" :rows="3" :value="calldataEncoded" readonly />
                        <el-button style="margin-top: 10px;" @click="copyEncoded">复制</el-button>
                    </el-form-item>
                </el-form>
            </el-tab-pane>

            <!-- 解码 -->
            <el-tab-pane label="解码" name="decode">
                <el-form label-position="top">
                    <el-form-item label="函数签名">
                        <el-input type="textarea" :rows="2" v-model="decodeFunctionSignature"
                            placeholder="必须与 calldata 对应" />
                    </el-form-item>

                    <el-form-item label="Calldata（0x 开头）">
                        <el-input type="textarea" :rows="4" v-model="calldataToDecode" />
                    </el-form-item>

                    <el-button type="primary" @click="decodeCalldata">解码</el-button>

                    <el-form-item label="解码结果" v-if="decodedParams.length">
                        <el-table :data="decodedParams" style="width: 100%">
                            <el-table-column prop="index" label="#" width="50" />
                            <el-table-column prop="type" label="类型" width="150" />
                            <el-table-column prop="value" label="参数值" />
                        </el-table>
                    </el-form-item>
                </el-form>
            </el-tab-pane>

            <!-- 常用函数签名 -->
            <el-tab-pane label="常见函数签名" name="presets">
                <el-table :data="commonFunctions" style="width: 100%">
                    <el-table-column prop="name" label="函数" />
                    <el-table-column prop="signature" label="签名" />
                    <el-table-column label="操作" width="120">
                        <template slot-scope="scope">
                            <el-button size="mini" @click="copyText(scope.row.signature)">复制</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>

            <!-- 帮助 -->
            <el-tab-pane label="使用帮助" name="help">
                <div style="line-height: 1.8;">
                    <p><strong>📥 编码：</strong></p>
                    <ul>
                        <li>输入函数签名：如 <code>approve(address,uint256)</code></li>
                        <li>每个参数占一行，顺序必须匹配</li>
                        <li>点击"编码"生成交易 calldata</li>
                    </ul>

                    <p><strong>📤 解码：</strong></p>
                    <ul>
                        <li>函数签名需与 calldata 对应</li>
                        <li>解码后将显示每个参数的值</li>
                    </ul>

                    <p><strong>📎 签名提示：</strong> 所有签名基于 @ethersproject/abi Interface 实例生成，请注意类型准确性。</p>
                </div>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script>
import { Interface } from '@ethersproject/abi';
import { getAddress } from '@ethersproject/address';

export default {
    name: 'CalldataCoder',
    data() {
        return {
            activeTab: 'encode',
            functionSignature: 'transferFrom(address,address,uint256)',
            paramsInput: '0x8ba1f109551bD432803012645Ac136ddd64DBA72\n0xaB7C8803962c0f2F5BBBe3FA8bf41cd82AA1923C\n1000000000000000000',
            calldataEncoded: '',

            decodeFunctionSignature: 'transferFrom(address,address,uint256)',
            calldataToDecode: '0x23b872dd0000000000000000000000008ba1f109551bd432803012645ac136ddd64dba72000000000000000000000000ab7c8803962c0f2f5bbbe3fa8bf41cd82aa1923c0000000000000000000000000000000000000000000000000de0b6b3a7640000',
            decodedParams: [],

            commonFunctions: [
                { name: '转账', signature: 'transfer(address,uint256)' },
                { name: '授权转账', signature: 'transferFrom(address,address,uint256)' },
                { name: '批准额度', signature: 'approve(address,uint256)' },
                { name: '设置授权', signature: 'setApprovalForAll(address,bool)' },
                { name: 'NFT 转移', signature: 'safeTransferFrom(address,address,uint256)' },
                { name: '批量转账', signature: 'batchTransfer(address[],uint256[])' },
            ],
        };
    },
    methods: {
        encodeCalldata() {
            try {
                const funcSig = this.functionSignature;
                const funcName = funcSig.split('(')[0];
                const iface = new Interface([`function ${funcSig}`]);

                const params = this.paramsInput
                    .split('\n')
                    .map(p => p.trim())
                    .filter(Boolean);

                const calldata = iface.encodeFunctionData(funcName, params);
                this.calldataEncoded = calldata;
                this.$message.success('编码成功');
            } catch (err) {
                console.error('编码错误:', err);
                this.$message.error('编码失败: ' + err.message);
            }
        },

        decodeCalldata() {
            try {
                const funcSig = this.decodeFunctionSignature;
                const funcName = funcSig.split('(')[0];
                const iface = new Interface([`function ${funcSig}`]);

                const result = iface.decodeFunctionData(funcName, this.calldataToDecode);
                const inputs = iface.getFunction(funcName).inputs;

                this.decodedParams = inputs.map((input, index) => ({
                    index: index + 1,
                    type: input.type,
                    value: this.formatDecodedValue(result[index], input.type),
                }));

                this.$message.success('解码成功');
            } catch (err) {
                console.error('解码错误:', err);
                this.decodedParams = [];
                this.$message.error('解码失败: ' + err.message);
            }
        },

        formatDecodedValue(value, type) {
            if (type === 'address') {
                try {
                    return getAddress(value);
                } catch {
                    return value;
                }
            }
            if (type.includes('int') && typeof value === 'object' && value.toString) {
                return value.toString();
            }
            return value.toString();
        },

        copyEncoded() {
            navigator.clipboard.writeText(this.calldataEncoded).then(() => {
                this.$message.success('已复制到剪贴板');
            });
        },

        copyText(text) {
            navigator.clipboard.writeText(text).then(() => {
                this.$message.success('签名已复制');
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