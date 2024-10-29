// bot.js
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

import { ethers } from 'ethers';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// 加载环境变量
dotenv.config();

const config = {
    encryptionKey: process.env.ENCRYPTION_KEY,
    storagePath: './secure_storage'
};

// 钱包生成器类
class WalletGenerator {
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
class SecurityUtils {
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
class WalletStorage {
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

// 创建 bot 实例
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// 错误处理中间件
bot.catch((err, ctx) => {
    console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
});

// 日志中间件
bot.use(async (ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    console.log('Response time: %sms', ms);
});

// 处理 /start 命令
bot.command('start', async (ctx) => {
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '帮助', callback_data: 'help' },
                    { text: '关于', callback_data: 'about' }
                ]
            ]
        }
    };

    await ctx.reply(
        '👋 欢迎使用测试机器人！\n\n' +
        '可用命令：\n' +
        '/help - 显示帮助信息\n' +
        '/echo - 复读消息\n' +
        '/keyboard - 显示自定义键盘',
        keyboard
    );
});

// 处理 /help 命令
bot.command('help', async (ctx) => {
    await ctx.reply(
        '📝 命令列表：\n' +
        '/start - 开始使用机器人\n' +
        '/help - 显示此帮助信息\n' +
        '/echo <文本> - 复读你的消息\n' +
        '/keyboard - 显示自定义键盘'
    );
});

// 处理 /echo 命令
bot.command('echo', async (ctx) => {
    const message = ctx.message.text.split(' ').slice(1).join(' ');
    if (message) {
        await ctx.reply(`你说: ${message}`);
    } else {
        await ctx.reply('请在 /echo 后面输入要复读的内容');
    }
});

// 处理 /keyboard 命令
bot.command('keyboard', async (ctx) => {
    await ctx.reply('这是一个自定义键盘示例', {
        reply_markup: {
            keyboard: [
                ['👍 好的', '👎 不好'],
                ['❓ 帮助', '📝 反馈']
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});

// 处理回调查询
bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
        '📝 这是内联按钮触发的帮助信息\n' +
        '你可以使用以下命令：\n' +
        '/start - 重新开始\n' +
        '/help - 显示帮助\n' +
        '/echo - 复读消息'
    );
});

bot.action('about', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🤖 这是一个用 Telegraf 开发的测试机器人');
});

// 处理普通文本消息
bot.on('text', async (ctx) => {
    // 如果是命令则跳过
    if (ctx.message.text.startsWith('/')) return;

    // 处理自定义键盘的响应
    switch (ctx.message.text) {
        case '👍 好的':
            await ctx.reply('很高兴你觉得好！');
            break;
        case '👎 不好':
            await ctx.reply('抱歉，我会继续改进的！');
            break;
        case '❓ 帮助':
            await ctx.reply('请使用 /help 命令获取帮助');
            break;
        case '📝 反馈':
            await ctx.reply('请直接发送你的反馈信息');
            break;
        default:
            // 复读其他消息
            await ctx.reply(`收到你的消息: ${ctx.message.text}`);
    }
});


////////

// 生成钱包命令
bot.command('generatewallet', async (ctx) => {
    try {
        // 检查是否为私聊
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ 安全原因，该命令只能在私聊中使用');
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
});

// 从助记词恢复钱包
bot.command('recoverwallet', async (ctx) => {
    try {
        // 检查是否为私聊
        if (ctx.chat.type !== 'private') {
            return ctx.reply('⚠️ 安全原因，该命令只能在私聊中使用');
        }

        // 获取助记词参数
        const mnemonic = ctx.message.text.split(' ').slice(1).join(' ');

        if (!mnemonic) {
            return ctx.reply(
                '请在命令后附上你的助记词，例如：\n' +
                '/recoverwallet word1 word2 word3 ...'
            );
        }

        // 验证并恢复钱包
        const walletData = await WalletGenerator.fromMnemonic(mnemonic);

        // 加密保存
        await WalletStorage.saveWallet(ctx.from.id, walletData);

        // 返回公开信息
        await ctx.reply(
            '✅ 钱包已恢复\n\n' +
            `地址: \`${walletData.address}\`\n\n` +
            '使用 /showkeys 查看完整信息',
            { parse_mode: 'Markdown' }
        );

    } catch (error) {
        console.error('Wallet recovery error:', error);
        await ctx.reply('❌ 恢复钱包失败，请确保助记词正确');
    }
});

// 显示私钥信息命令
bot.command('showkeys', async (ctx) => {
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
});

///////

// 启动 bot
bot.launch()
    .then(() => {
        console.log('Bot 已启动...');
    })
    .catch((err) => {
        console.error('Bot 启动失败:', err);
    });

// 优雅退出
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));