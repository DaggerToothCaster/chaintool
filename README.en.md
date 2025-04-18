# Ethereum Developer Tools (Vue-based)

![Ethereum Logo](https://ethereum.org/static/a183661dd70e0e5c70689a0ec95ef0ba/13c43/eth-diamond-purple.png)

A comprehensive collection of Ethereum development tools built with Vue.js, designed to simplify common blockchain development tasks.

## Features

### Wallet Management
- 🔑 **Private Key to Address** - Derive Ethereum addresses from private keys
- 🌱 **Mnemonic Phrase to Accounts** - Generate and load accounts from BIP39 mnemonic phrases
- 💼 **Wallet Information & Transaction Signing** - View wallet details and sign transactions

### Smart Contract Development
- 📜 **Function Selector Lookup** - Find function selectors from function signatures
- 🔍 **Event Topic Calculator** - Compute event topic hashes
- 🔄 **Calldata Encoder/Decoder** - Encode and decode transaction input data
- 📊 **ABI Visual Interface** - Interact with smart contracts through a visual ABI interface

### Data Utilities
- ⚖️ **Ethereum Unit Converter** - Convert between wei, gwei, ether and other units
- ✍️ **Message Signing & Verification** - Create and verify Ethereum signatures
- 📝 **Transaction Log Decoder** - Decode Ethereum transaction event logs

## Getting Started

### Prerequisites
- Node.js (v14+ recommended)
- npm or yarn
- Modern web browser with Ethereum provider (like MetaMask) for wallet-related features

### Installation
1. Clone the repository:
```bash
git clone https://github.com/your-repo/ethereum-dev-tools.git
cd ethereum-dev-tools
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run serve
# or
yarn serve
```

4. Open your browser to `http://localhost:8080`

## Usage Guide

### Private Key to Address
1. Enter your private key (with or without 0x prefix)
2. View derived Ethereum address and public key
3. Optionally display QR code for the address

### Mnemonic Phrase to Accounts
1. Enter your BIP39 mnemonic phrase (12 or 24 words)
2. Specify derivation path (default: BIP44 Ethereum path)
3. View generated accounts with addresses and private keys

### Calldata Encoder/Decoder
**Encoding:**
1. Enter function signature (e.g., `transfer(address,uint256)`)
2. Provide parameters (one per line)
3. Get encoded calldata for transactions

**Decoding:**
1. Enter function signature matching the calldata
2. Paste the calldata (0x prefixed hex)
3. View decoded parameters with types and values

### ABI Visual Interface
1. Paste your contract ABI JSON
2. The interface will display all available functions
3. Fill in parameters and call/view functions

## Development

### Project Structure
```
src/
├── components/       # Reusable Vue components
├── router/          # Vue router configuration
├── views/           # Main tool pages
├── utils/           # Ethereum utility functions
├── assets/          # Static assets
└── App.vue          # Main application component
```

### Building for Production
```bash
npm run build
# or
yarn build
```

### Customizing Configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## Security Considerations

⚠️ **Important Security Notes:**
- This tool runs entirely in the browser - private keys and mnemonics never leave your device
- For maximum security, use in an offline environment when handling sensitive keys
- Clear your browser cache after use when working with private keys
- Consider using a dedicated development browser profile

## Contributing

Contributions are welcome! Please open an issue or pull request for any:
- Bug fixes
- New features
- Documentation improvements
- UI/UX enhancements

## License

MIT License

## Acknowledgements

- Built with [Vue.js](https://vuejs.org/)
- Ethereum functionality powered by [ethers.js](https://docs.ethers.io/)
- UI components from [Element UI](https://element.eleme.io/)

---

For questions or support, please open an issue in the repository.