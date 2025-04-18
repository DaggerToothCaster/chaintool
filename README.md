# 以太坊开发工具集（基于Vue）

![以太坊Logo](public/img/project.png)

一套基于Vue.js构建的以太坊开发工具集合，旨在简化区块链开发中的常见任务。

## 功能列表

### 钱包管理
- 🔑 **私钥加载地址** - 从私钥推导以太坊地址
- 🌱 **助记词生成账户** - 使用BIP39助记词生成和加载账户
- 💼 **钱包信息及交易签名** - 查看钱包详情并签名交易

### 智能合约开发
- 📜 **函数选择器查询** - 通过函数签名查询对应的函数选择器
- 🔍 **事件Topic查询** - 计算事件主题哈希值
- 🔄 **Calldata编解码** - 对交易输入数据进行编码和解码
- 📊 **ABI可视化调用** - 通过可视化界面调用智能合约ABI

### 数据工具
- ⚖️ **以太单位转换器** - 在wei、gwei、ether等单位间转换
- ✍️ **消息签名与验证** - 创建和验证以太坊签名
- 📝 **交易日志解码器** - 解码以太坊交易事件日志

## 快速开始

### 环境要求
- Node.js（推荐v14+版本）
- npm或yarn
- 现代浏览器（建议安装MetaMask等以太坊钱包扩展）

### 安装步骤
1. 克隆仓库：
```bash
git clone https://github.com/your-repo/ethereum-dev-tools.git
cd ethereum-dev-tools
```

2. 安装依赖：
```bash
npm install
# 或
yarn install
```

3. 启动开发服务器：
```bash
npm run serve
# 或
yarn serve
```

4. 浏览器访问 `http://localhost:8080`

## 使用指南

### 私钥加载地址
1. 输入私钥（可带或不带0x前缀）
2. 查看推导出的以太坊地址和公钥
3. 可选生成地址二维码

### 助记词生成账户
1. 输入BIP39助记词（12或24个单词）
2. 指定派生路径（默认使用BIP44以太坊路径）
3. 查看生成的账户地址和对应私钥

### Calldata编解码
**编码：**
1. 输入函数签名（如`transfer(address,uint256)`）
2. 按行输入参数值
3. 获取交易calldata编码结果

**解码：**
1. 输入与calldata匹配的函数签名
2. 粘贴calldata数据（0x开头的十六进制）
3. 查看解码后的参数类型和值

### ABI可视化调用
1. 粘贴合约ABI JSON
2. 界面将显示所有可用函数
3. 填写参数并调用/查询函数

## 开发说明

### 项目结构
```
src/
├── components/       # 可复用Vue组件
├── router/          # 路由配置
├── views/           # 工具主页面
├── utils/           # 以太坊工具函数
├── assets/          # 静态资源
└── App.vue          # 主应用组件
```

### 生产环境构建
```bash
npm run build
# 或
yarn build
```

## 安全须知

⚠️ **重要安全提示：**
- 本工具完全在浏览器中运行 - 私钥和助记词不会离开您的设备
- 处理敏感密钥时，建议在离线环境中使用
- 使用私钥后请清除浏览器缓存
- 建议使用专门的开发浏览器配置文件

## 参与贡献

欢迎贡献！如有以下需求请提交issue或pull request：
- Bug修复
- 新功能建议
- 文档改进
- UI/UX优化

## 开源协议

MIT许可证

## 致谢

- 基于[Vue.js](https://vuejs.org/)构建
- 以太坊功能由[ethers.js](https://docs.ethers.io/)提供支持
- UI组件来自[Element UI](https://element.eleme.io/)

---

如有问题或需要支持，请在仓库中提交issue。