// utils.js
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

// 配置导入
const config = {
    encryptionKey: process.env.ENCRYPTION_KEY,
    storagePath: './secure_storage'
};

// 钱包生成器类
export class WalletGenerator {
    static async generateWallet() {
        // 生成随机熵创建钱包
        const wallet = ethers.Wallet.createRandom();

        return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic.phrase,
            path: "m/44'/60'/0'/0/0"    // 标准以太坊派生路径
        };
    }

    static async fromMnemonic(mnemonic) {
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);
        return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: mnemonic,
            path: "m/44'/60'/0'/0/0"
        };
    }
}

// 加密工具类
export class SecurityUtils {
    static async encrypt(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            'aes-256-gcm',
            Buffer.from(config.encryptionKey, 'hex'),
            iv
        );

        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        return {
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            encryptedData: encrypted
        };
    }

    static async decrypt(encryptedData, iv, authTag) {
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(config.encryptionKey, 'hex'),
            Buffer.from(iv, 'hex')
        );

        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    }
}

// 钱包存储管理类
export class WalletStorage {
    static async saveWallet(userId, walletData) {
        const encrypted = await SecurityUtils.encrypt(walletData);

        // 创建用户特定的存储目录
        const userDir = path.join(config.storagePath, userId.toString());
        await fs.mkdir(userDir, { recursive: true });

        // 保存加密数据
        await fs.writeFile(
            path.join(userDir, 'wallet.enc'),
            JSON.stringify(encrypted),
            'utf8'
        );

        return encrypted;
    }

    static async getWallet(userId) {
        const filePath = path.join(config.storagePath, userId.toString(), 'wallet.enc');
        const fileContent = await fs.readFile(filePath, 'utf8');
        const encrypted = JSON.parse(fileContent);

        return await SecurityUtils.decrypt(
            encrypted.encryptedData,
            encrypted.iv,
            encrypted.authTag
        );
    }
}

async function checkWalletExists(userId) {
    try {
        const userDir = path.join(config.storagePath, userId.toString());
        const walletPath = path.join(userDir, 'wallet.enc');
        await fs.access(walletPath);
        return true; // 文件存在
    } catch {
        return false; // 文件不存在
    }
}

export async function handleGenerateWallet(ctx) {
    try {
        // 检查是否为私聊
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ 安全原因，该操作只能在私聊中使用');
        }

        // 检查用户是否已有钱包
        const hasWallet = await checkWalletExists(ctx.from.id);
        if (hasWallet) {
            return ctx.reply(
                '❌ 你已经有一个钱包了！\n\n' +
                '为了安全考虑，每个用户只能创建一个钱包。\n' +
                '如果你需要查看现有钱包信息，请使用 /showkeys 命令。',
                { parse_mode: 'Markdown' }
            );
        }

        // 生成新钱包
        const walletData = await WalletGenerator.generateWallet();

        // 加密保存
        await WalletStorage.saveWallet(ctx.from.id, walletData);

        // 返回公开信息
        await ctx.reply(
            '✅ 以太坊钱包已生成\n\n' +
            `地址: \`${walletData.address}\`\n\n` +
            '⚠️ 重要提示：\n' +
            '1. 私钥和助记词已安全加密保存\n' +
            '2. 使用 /showkeys 命令查看完整信息\n' +
            '3. 请立即备份并妥善保管你的密钥\n' +
            '4. 永远不要分享你的私钥和助记词',
            { parse_mode: 'Markdown' }
        );

    } catch (error) {
        console.error('Wallet generation error:', error);
        await ctx.reply('❌ 生成钱包时发生错误，请重试');
    }
}

export async function handleShowWallet(ctx) {
    try {
        // 检查是否为私聊
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ 该命令只能在私聊中使用！');
        }

        // 获取钱包信息
        const wallet = await WalletStorage.getWallet(ctx.from.id);

        // 发送加密信息
        const message = await ctx.reply(
            '🔐 钱包信息（60秒后自动删除）：\n\n' +
            `地址:\n\`${wallet.address}\`\n\n` +
            `私钥:\n\`${wallet.privateKey}\`\n\n` +
            `助记词:\n\`${wallet.mnemonic}\`\n\n` +
            `派生路径:\n\`${wallet.path}\`\n\n` +
            '⚠️ 警告：\n' +
            '1. 请立即将这些信息保存到安全的离线位置\n' +
            '2. 永远不要分享你的私钥和助记词\n' +
            '3. 此消息将在60秒后自动删除',
            { parse_mode: 'Markdown' }
        );

        // 60秒后删除消息
        setTimeout(async () => {
            try {
                await ctx.telegram.deleteMessage(ctx.chat.id, message.message_id);
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        }, 60000);

    } catch (error) {
        console.error('Error showing keys:', error);
        await ctx.reply('❌ 获取钱包信息失败，请确保你已生成钱包');
    }
}



export async function getWalletBalance(address) {
    try {
        // 使用 Infura 或其他提供商
        const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
        const balance = await provider.getBalance(address);
        
        // 转换为 ETH 单位
        const balanceInEth = ethers.utils.formatEther(balance);
        return balanceInEth;
    } catch (error) {
        console.error('获取余额失败:', error);
        throw error;
    }
}


// 处理查询余额的命令
export async function handleCheckBalance(ctx) {
    try {
        // 检查是否为私聊
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ 安全原因，该命令只能在私聊中使用');
        }

        // 获取用户的钱包信息
        const userId = ctx.from.id;
        const walletData = await WalletStorage.getWallet(userId);

        if (!walletData) {
            return ctx.reply('❌ 未找到钱包信息，请先使用 /generatewallet 生成钱包');
        }

        // 查询余额
        const balance = await getWalletBalance(walletData.address);

        // 发送余额信息
        await ctx.reply(
            '💰 *钱包余额*\n\n' +
            `地址: \`${walletData.address}\`\n` +
            `余额: *${balance} ETH*\n\n` +
            '_提示: 余额每次查询可能略有延迟_',
            { parse_mode: 'Markdown' }
        );

    } catch (error) {
        console.error('查询余额失败:', error);
        await ctx.reply('❌ 查询余额失败，请稍后重试');
    }
}