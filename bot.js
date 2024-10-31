// bot.js
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { ethers } from 'ethers';



import { WalletGenerator, SecurityUtils, WalletStorage, handleGenerateWallet, handleShowWallet, handleCheckBalance, handleDeployAccount, handleSendFaucet, handleCreateRedEnvelope, handleClaimRedEnvelope, createRedEnvelope, claimRedEnvelope } from './utils.js';


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
    { command: 'start', description: 'start' },
    // { command: 'generatewallet', description: 'generate wallet' },
    { command: 'balance', description: 'check balance' },
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
                    { text: '🔑 Create Wallet', callback_data: 'generate_wallet' },
                    { text: '💧 Get Test Tokens', callback_data: 'fauect_' },
                ],
                [
                    { text: '👛 View Balance', callback_data: 'check_balance' },
                    { text: '⚙️ Deploy Account', callback_data: 'deploy_account' },
                ],
                [
                    { text: '🧧 Create Red Envelope', callback_data: 'CheckRedEnvelope' }
                ],
                [
                    { text: '🎁 Claim Red Envelope', callback_data: 'ClaimRedEnvelope' }
                ],
            ]
        }
    };

    const welcomeMessage = `
    👋 *Welcome to Red Envelope Bot!*

    📝 *Available Commands: *
    /create_red_envelope <total_value> <number_of_packets> - Create a new red packet
    /claim_red_envelope <secret_key> - Claim a red packet

    ⭐️ *Quick Actions:*
    Use the buttons below to access wallet features
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
bot.action('deploy_account', async (ctx) => {
    await ctx.answerCbQuery();
    await handleDeployAccount(ctx);
});

bot.command('fauect', handleSendFaucet);
bot.action('fauect_', async (ctx) => {
    await ctx.answerCbQuery();
    await handleSendFaucet(ctx);
});


// 用户状态管理
const userCreateStates = new Map();

// 状态类型
const CREATE_STATES = {
    IDLE: 'IDLE',
    WAITING_AMOUNT: 'WAITING_AMOUNT',
    WAITING_COUNT: 'WAITING_COUNT'
};

bot.command('create_red_envelope', handleCreateRedEnvelope);
bot.action('CheckRedEnvelope', async (ctx) => {
    // await ctx.answerCbQuery();
    // await handleCreateRedEnvelope(ctx);
    try {
        await ctx.answerCbQuery();

        // 检查是否为私聊
        if (ctx.chat?.type !== 'private') {
            return ctx.reply('⚠️ For security reasons, please create red packets in private chat');
        }

        // 初始化创建流程
        userCreateStates.set(ctx.from.id, {
            state: CREATE_STATES.WAITING_AMOUNT
        });

        const msg = `
        🧧 *Create Red Packet*
        
        Please enter the total amount (e.g. 100):`;

        await ctx.reply(msg, {
            parse_mode: 'Markdown',
            reply_markup: {
                force_reply: true, // 强制回复，自动显示输入框
                selective: true,
                input_field_placeholder: "Enter amount (TOKEN)" // 输入框占位提示
            }
        });

    } catch (error) {
        console.error('Error in create red packet flow:', error);
        await ctx.reply('❌ An error occurred. Please try again.');
    }

});




// 处理确认创建
bot.action(/confirm_create_(.+)_(.+)/, async (ctx) => {
    try {
        await ctx.answerCbQuery();

        const amount = ctx.match[1];
        const count = parseInt(ctx.match[2]);

        // 创建新红包
        await createRedEnvelope(ctx, amount, count);

    } catch (error) {
        console.error('Error in red packet confirmation:', error);
        await ctx.reply('❌ An error occurred while creating the red packet. Please try again.');
    }
});

// 取消创建
bot.action('cancel_create', async (ctx) => {
    await ctx.answerCbQuery();
    userCreateStates.delete(ctx.from.id);
    await ctx.reply('🚫 Red packet creation cancelled');
});



bot.command('claim_red_envelope', handleClaimRedEnvelope)
// bot.action('ClaimRedEnvelope', async (ctx) => {
//     await ctx.answerCbQuery();
//     await handleClaimRedEnvelope(ctx);
// });


// 用户状态管理
const userClaimStates = new Map();

// 处理领取红包按钮点击
bot.action('ClaimRedEnvelope', async (ctx) => {
    try {
        await ctx.answerCbQuery();

        // 初始化领取流程
        await ctx.reply(`
🎁 *Claim Red Packet*

Please enter the secret key:`, {
            parse_mode: 'Markdown',
            reply_markup: {
                force_reply: true,
                selective: true,
                input_field_placeholder: "Enter secret key (0x...)"
            }
        });

        // 设置用户状态为等待输入密钥
        userClaimStates.set(ctx.from.id, true);

    } catch (error) {
        console.error('Error starting claim process:', error);
        await ctx.reply('❌ An error occurred. Please try again.');
    }
});






bot.command('balance', handleCheckBalance);
bot.action('check_balance', async (ctx) => {
    await ctx.answerCbQuery();
    await handleCheckBalance(ctx);
});

// 统一的文本消息处理器
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;

    // 如果是命令则跳过
    if (ctx.message.text.startsWith('/')) return;

    // 检查是否在创建红包状态
    const createState = userCreateStates.get(userId);
    if (createState) {
        try {
            switch (createState.state) {
                case CREATE_STATES.WAITING_AMOUNT:
                    // 验证并保存金额
                    try {
                        const amount = ctx.message.text;
                        ethers.utils.parseEther(amount); // 验证金额格式

                        // 保存金额并更新状态
                        createState.amount = amount;
                        createState.state = CREATE_STATES.WAITING_COUNT;

                        // 提示输入红包数量
                        await ctx.reply(`
💰 Amount: *${amount} TOKEN*
Please enter number of shares:`, {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                force_reply: true,
                                selective: true,
                                input_field_placeholder: "Enter number of shares"
                            }
                        });
                    } catch (error) {
                        await ctx.reply('❌ Invalid amount format. Please enter a valid number.');
                    }
                    return;

                case CREATE_STATES.WAITING_COUNT:
                    // 验证红包数量
                    const count = parseInt(ctx.message.text);
                    if (!Number.isInteger(count) || count <= 0) {
                        await ctx.reply('❌ Please enter a valid positive integer.');
                        return;
                    }

                    // 显示确认信息
                    const amount = createState.amount;
                    const averageAmount = (Number(amount) / count).toFixed(2);

                    await ctx.reply(`
📝 *Confirm Red Packet Details*

Amount: *${amount} TOKEN*
Shares: *${count}*
Average: *${averageAmount} TOKEN* per share

Create this red packet?`, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '✅ Confirm', callback_data: `confirm_create_${amount}_${count}` }],
                                [{ text: '❌ Cancel', callback_data: 'cancel_create' }]
                            ]
                        }
                    });

                    userCreateStates.delete(userId); // 清理状态
                    return;
            }
        } catch (error) {
            console.error('Error processing create input:', error);
            await ctx.reply('❌ An error occurred. Please try again.');
            userCreateStates.delete(userId);
            return;
        }
    }

    // 检查是否在领取红包状态
    if (userClaimStates.get(userId)) {
        try {
            const password = ctx.message.text.trim();
            // 清除用户状态
            userClaimStates.delete(userId);

            // 执行领取操作
            await claimRedEnvelope(ctx, password);
            return;
        } catch (error) {
            console.error('Error processing claim:', error);
            await ctx.reply('❌ An error occurred. Please try again.');
            userClaimStates.delete(userId);
            return;
        }
    }

    // 如果不是任何特殊状态，则是普通消息
    await ctx.reply(`your message: ${ctx.message.text}`);
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