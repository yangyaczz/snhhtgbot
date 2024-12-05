# Starknet Telegram Wallet Bot 🤖

A secure and user-friendly Telegram bot for managing Starknet wallets and facilitating red packet transactions. Built with Node.js and Starknet.js, this bot provides an intuitive interface for wallet management and social token distribution.

## 🌟 Features

### Wallet Management 💼


#### Core Features

* **Effortless Wallet Operations** 🔑
  - One-click wallet generation
  - Multi-wallet management support

* **Quick Fauect** 💧
  - Integrated faucet for test tokens
  - One-tap account deployment

* **Easy Monitoring** 👛
  - Fast balance checking
  - Real-time status updates

* **Red Envelope distrubute** 🧧
  - Fair random distribution algorithm
  - Transaction verification and tracking

#### Future Roadmap 🚀

* **Advanced Features**
  - PayMaster support for gasless transactions
  - FHE for enhanced wallet security
  - prediction in group



## 🔧 Technical Stack

- **Framework**: Node.js with Telegraf.js
- **Blockchain**: StarkNet L2 Network
- **Smart Contracts**: Cairo contracts for tokens and red packets
- **Storage**: Encrypted local storage for wallet data
- **Security**: 
  - Private chat enforcement for sensitive operations
  - Auto-deletion of sensitive information
  - Encrypted wallet storage

## 🚀 Bot Commands

```
/start - Launch bot and show main menu
/generatewallet - Create a new StarkNet wallet
/balance - Check wallet balances
/create_red_envelope - Create a new red packet
/claim_red_envelope - Claim an existing red packet
```

## 🔒 Security Features

1. **Private Chat Enforcement**
   - All sensitive operations restricted to private chats
   - Prevents exposure of sensitive data in group chats

2. **Wallet Security**
   - Encrypted storage of private keys
   - Auto-deletion of sensitive information
   - Secure key generation and storage

3. **Transaction Safety**
   - Transaction confirmation and verification
   - Clear transaction status updates
   - Traceable transaction history

## 💡 Key Benefits

1. **User Experience**
   - Intuitive Telegram interface
   - Persistent bottom menu for easy access
   - Clear status updates and confirmations
   - Step-by-step guidance for complex operations

2. **Social Features**
   - Red packet system for social token distribution
   - Group-friendly features
   - Easy sharing mechanisms

3. **Development Features**
   - Modular code structure
   - Comprehensive error handling
   - Clear logging and monitoring
   - Easy maintenance and updates

## 📝 Technical Details

### Smart Contract Integration
- Custom red packet contract for token distribution
- ERC20 token support
- StarkNet account abstraction

### Error Handling
- Comprehensive error messages
- User-friendly error notifications
- Detailed error logging for debugging

### State Management
- User session tracking
- Operation state management
- Transaction status tracking

## 🔧 Environment Requirements

```
Node.js >= 14.0.0
StarkNet.js >= 5.0.0
Telegraf.js >= 4.0.0
```

## 🌍 Network Support

- Currently operates on StarkNet Sepolia Testnet
- Supports future mainnet deployment
- Custom token contract deployment

## 🔜 Future Enhancements

1. **Enhanced Security**
   - Multi-signature support
   - Additional encryption layers
   - Advanced rate limiting

2. **Feature Expansion**
   - Multiple token support
   - Advanced distribution algorithms
   - Enhanced group features

3. **User Experience**
   - Multi-language support
   - Custom notification settings
   - Advanced transaction tracking

## 📚 Documentation

For detailed documentation about each feature and technical implementation, please refer to the following sections:
- [Wallet Management](docs/wallet.md)
- [Red Packet System](docs/red-packet.md)
- [Security Features](docs/security.md)
- [API Reference](docs/api.md)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.