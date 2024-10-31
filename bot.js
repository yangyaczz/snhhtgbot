// bot.js
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import fs from 'fs/promises';

import { WalletGenerator, SecurityUtils, WalletStorage, handleGenerateWallet, handleShowWallet, handleCheckBalance, handleDeployAccount, handleSendFauect} from './utils.js';


// 加载环境变量
dotenv.config();
const config = {
    encryptionKey: process.env.ENCRYPTION_KEY,
    storagePath: './secure_storage'
};


// 创建 bot 实例
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);


// 注册命令列表
bot.telegram.setMyCommands([
    { command: 'start', description: '开始使用' },
    { command: 'generatewallet', description: '生成新钱包' },
    { command: 'showkeys', description: '显示钱包信息' },
    { command: 'balance', description: '查询钱包余额' },
    { command: 'deployaccount', description: '部署钱包'}
]).then(() => {
    console.log('命令已注册');
}).catch(error => {
    console.error('注册命令失败:', error);
});



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
                    { text: '💰 Generate Wallet', callback_data: 'generate_wallet' },
                    { text: '🔑 Show Wallet', callback_data: 'show_wallet' }
                ],
                // [
                //     { text: '💵 Deploy Account', callback_data: 'check_balance' }   
                // ],
                [
                    { text: '💵 Check Balance', callback_data: 'check_balance' }   
                ],
                [
                    { text: '💧 receive faucet', callback_data: 'check_balance' }   
                ],
                [
                    { text: '🧧 create red envelope', callback_data: 'check_balance' }   
                ],
                [
                    { text: '🧧 receive red envelope', callback_data: 'check_balance' }   
                ],
            ]
        }
    };

    const welcomeMessage = `
    👋 *欢迎使用 Wallet 机器人！*

    📝 *可用命令：*
    /generatewallet - 生成新钱包
    /showkeys - 显示钱包信息

    👇 *或使用下方按钮操作：*
    `;

    await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        ...keyboard
    });
});



// 从助记词恢复钱包
// bot.command('recoverwallet', async (ctx) => {
//     try {
//         // 检查是否为私聊
//         if (ctx.chat.type !== 'private') {
//             return ctx.reply('⚠️ 安全原因，该命令只能在私聊中使用');
//         }

//         // 获取助记词参数
//         const mnemonic = ctx.message.text.split(' ').slice(1).join(' ');

//         if (!mnemonic) {
//             return ctx.reply(
//                 '请在命令后附上你的助记词，例如：\n' +
//                 '/recoverwallet word1 word2 word3 ...'
//             );
//         }

//         // 验证并恢复钱包
//         const walletData = await WalletGenerator.fromMnemonic(mnemonic);

//         // 加密保存
//         await WalletStorage.saveWallet(ctx.from.id, walletData);

//         // 返回公开信息
//         await ctx.reply(
//             '✅ 钱包已恢复\n\n' +
//             `地址: \`${walletData.address}\`\n\n` +
//             '使用 /showkeys 查看完整信息',
//             { parse_mode: 'Markdown' }
//         );

//     } catch (error) {
//         console.error('Wallet recovery error:', error);
//         await ctx.reply('❌ 恢复钱包失败，请确保助记词正确');
//     }
// });



// 注册命令和按钮处理
bot.command('generatewallet', handleGenerateWallet);
bot.action('generate_wallet', async (ctx) => {
    await ctx.answerCbQuery(); // 必须响应按钮点击
    await handleGenerateWallet(ctx);
});

bot.command('showkeys', handleShowWallet);
bot.action('show_wallet', async (ctx) => {
    await ctx.answerCbQuery(); // 必须响应按钮点击
    await handleShowWallet(ctx);
});


bot.command('deployaccount', handleDeployAccount)

bot.command('fauect', handleSendFauect);


bot.command('balance', handleCheckBalance);
bot.action('check_balance', async (ctx) => {
    await ctx.answerCbQuery();
    await handleCheckBalance(ctx);
});



// 处理普通文本消息
bot.on('text', async (ctx) => {
    // 如果是命令则跳过
    if (ctx.message.text.startsWith('/')) return;

    await ctx.reply(`收到你的消息: ${ctx.message.text}`);
});


///////

async function checkStorage() {
    try {
        await fs.access(config.storagePath);
    } catch (error) {
        await fs.mkdir(config.storagePath, { recursive: true });
    }
}
await checkStorage();

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