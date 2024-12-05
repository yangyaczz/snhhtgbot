// bot.js
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { ethers } from 'ethers';



import { WalletGenerator, SecurityUtils, WalletStorage, handleGenerateWallet, handleShowWallet, handleCheckBalance, handleDeployAccount, handleSendFaucet, handleCreateRedEnvelope, handleClaimRedEnvelope, createRedEnvelope, claimRedEnvelope, handleCreatePrediction } from './utils.js';

import { handleGetMarket, handleRefreshCallback, placeBet, handleSettleMarket, handleClaimWinnings } from './utils.js';
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
    // { command: 'balance', description: 'check balance' },
    { command: 'createprediction', description: 'Create a new prediction market' },
    { command: 'getmarket', description: 'Get a new prediction market' },

    { command: 'settlemarket', description: 'Settle a prediction market' },
    { command: 'claimwinnings', description: 'Claim winnings' },

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

const bottomMenu = {
    reply_markup: {
        keyboard: [
            [{ text: '🔑 Create Wallet' }, { text: '💧 Get Tokens' }],
            [{ text: '👛 View Balance' }, { text: '⚙️ Deploy Account' }],
            [{ text: '✉️ Create Red Packet' }, { text: '🎁 Claim Red Packet' }],
            [{ text: '🎯 _Create Prediction' }, { text: '📊 _Get Market' }],
            [{ text: '⚖️ _Settle Market' }, { text: '💰 _Claim Winnings' }],
            [{ text: '📅 _Create Event' }, { text: '✅ _Check In Event' }],
            [{ text: '🎫 _Event Distribute Token' }, { text: '🖼️ _Event Distribute NFT' }]

        ],
        resize_keyboard: true,  // 自动调整键盘大小
        persistent: true,       // 保持菜单始终可见
    }
};

// // 处理 /start 命令
// bot.command('start', async (ctx) => {
//     const keyboard = {
//         reply_markup: {
//             inline_keyboard: [
//                 [
//                     { text: '🔑 Create Wallet', callback_data: 'generate_wallet' },
//                     { text: '💧 Get Test Tokens', callback_data: 'fauect_' },
//                 ],
//                 [
//                     { text: '👛 View Balance', callback_data: 'check_balance' },
//                     { text: '⚙️ Deploy Account', callback_data: 'deploy_account' },
//                 ],
//                 [
//                     { text: '🧧 Create Red Envelope', callback_data: 'CheckRedEnvelope' }
//                 ],
//                 [
//                     { text: '🎁 Claim Red Envelope', callback_data: 'ClaimRedEnvelope' }
//                 ],
//             ]
//         }
//     };

//     const welcomeMessage = `
//     👋 *Welcome to Red Envelope Bot!*

//     📝 *Available Commands: *
//     /create_red_envelope <total_value> <number_of_packets> - Create a new red packet
//     /claim_red_envelope <secret_key> - Claim a red packet

//     ⭐️ *Quick Actions:*
//     Use the buttons below to access wallet features
//     `;

//     await ctx.reply(welcomeMessage, {
//         parse_mode: 'Markdown',
//         ...keyboard
//     });
// });
// Start command handler

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
🌟 *Welcome to Wallet Bot!*

📝 *Available Commands:*
/create_red_envelope <total_value> <number_of_packets> - Create a new red packet
/claim_red_envelope <secret_key> - Claim a red packet

/createprediction name | description | optionA | optionB | hours
/getmarket <market_id>
/settlemarket <market_id> <winning_option>
/claimwinnings <market_id>

⭐️ *Quick Actions:*
Use the menu buttons below to access features
    `;

    await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        ...bottomMenu
    });
});


// 处理菜单按钮点击
bot.hears('🔑 Create Wallet', async (ctx) => {
    await handleGenerateWallet(ctx);
});

bot.hears('💧 Get Tokens', async (ctx) => {
    await handleSendFaucet(ctx);
});

bot.hears('👛 View Balance', async (ctx) => {
    await handleCheckBalance(ctx);
});

bot.hears('⚙️ Deploy Account', async (ctx) => {
    await handleDeployAccount(ctx);
});


bot.hears('✉️ Create Red Packet', async (ctx) => {
    try {
        // 检查是否为私聊
        if (ctx.chat?.type !== 'private') {
            return ctx.reply('⚠️ For security reasons, please create red packets in private chat');
        }

        // 初始化创建流程
        userStates.set(ctx.from.id, {
            state: USER_STATES.WAITING_AMOUNT
        });

        const msg = `
🧧 *Create Red Packet*

Please enter the total amount (e.g. 100):`;

        await ctx.reply(msg, {
            parse_mode: 'Markdown',
            reply_markup: {
                force_reply: true,
                selective: true,
                input_field_placeholder: "Enter amount (TOKEN)"
            }
        });

    } catch (error) {
        console.error('Error in create red packet flow:', error);
        await ctx.reply('❌ An error occurred. Please try again.');
    }
});

bot.hears('🎁 Claim Red Packet', async (ctx) => {
    try {
        // 检查是否为私聊
        if (ctx.chat?.type !== 'private') {
            return ctx.reply('⚠️ For security reasons, please claim red packets in private chat');
        }

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


bot.command('createprediction', handleCreatePrediction);

bot.command('getmarket', handleGetMarket);
bot.action(/^bet_\d+_[01]$/, handleBetCallback);
bot.action(/^refresh_\d+$/, handleRefreshCallback);


// 用户状态管理
const userStates = new Map();

// 状态类型
const USER_STATES = {
    IDLE: 'IDLE',
    WAITING_AMOUNT: 'WAITING_AMOUNT',
    WAITING_COUNT: 'WAITING_COUNT',
    BETTING: 'BETTING'
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
        userStates.set(ctx.from.id, {
            state: USER_STATES.WAITING_AMOUNT
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
    userStates.delete(ctx.from.id);
    await ctx.reply('🚫 Red packet creation cancelled');
});



bot.command('claim_red_envelope', handleClaimRedEnvelope)
// bot.action('ClaimRedEnvelope', async (ctx) => {
//     await ctx.answerCbQuery();
//     await handleClaimRedEnvelope(ctx);
// });
bot.command('settlemarket', handleSettleMarket);

bot.command('claimwinnings', handleClaimWinnings);

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

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;

    // 如果是命令则跳过
    if (ctx.message.text.startsWith('/')) return;

    // 获取用户状态
    const userState = userStates.get(userId);

    if (!userState) {
        // 如果没有状态，则是普通消息
        await ctx.reply(`your message: ${ctx.message.text}`);
        return;
    }

    try {
        switch (userState.state) {
            case USER_STATES.BETTING:
                // 处理下注金额输入
                try {
                    const amount = ctx.message.text.trim();
                    // 验证金额格式
                    ethers.utils.parseEther(amount);

                    // 执行下注交易
                    await placeBet(
                        ctx,
                        userState.marketId,
                        userState.option,
                        amount
                    );

                    // 清除用户状态
                    userStates.delete(userId);

                } catch (error) {
                    await ctx.reply('❌ Invalid amount format. Please enter a valid number.');
                }
                break;

            case USER_STATES.WAITING_AMOUNT:
                // 处理红包金额输入
                try {
                    const amount = ctx.message.text;
                    ethers.utils.parseEther(amount);

                    userState.amount = amount;
                    userState.state = USER_STATES.WAITING_COUNT;

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
                break;

            case USER_STATES.WAITING_COUNT:
                // 处理红包数量输入
                const count = parseInt(ctx.message.text);
                if (!Number.isInteger(count) || count <= 0) {
                    await ctx.reply('❌ Please enter a valid positive integer.');
                    return;
                }

                const amount = userState.amount;
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

                userStates.delete(userId);
                break;
        }
    } catch (error) {
        console.error('Error processing user input:', error);
        await ctx.reply('❌ An error occurred. Please try again.');
        userStates.delete(userId);
    }
});


export async function handleBetCallback(ctx) {
    try {
        const callbackData = ctx.callbackQuery.data;
        const [_, marketId, option] = callbackData.split('_');

        if (option !== '0' && option !== '1') {
            await ctx.answerCbQuery('❌ Invalid option', { show_alert: true });
            return;
        }

        // 首先检查用户是否有钱包
        const userId = ctx.from.id;
        const walletData = await WalletStorage.getWallet(userId);

        if (!walletData) {
            await ctx.answerCbQuery('❌ Please create a wallet first using /generatewallet', { show_alert: true });
            return;
        }

        // 初始化下注状态
        await ctx.answerCbQuery();
        await ctx.reply(
            `💰 *Place Your Bet*\n\n` +
            `Market ID: *${marketId}*\n` +
            `Option: *${option}*\n\n` +
            `Please enter the amount you want to bet (in TOKEN):`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    force_reply: true,
                    selective: true,
                    input_field_placeholder: "Enter amount (e.g., 100)"
                }
            }
        );

        // 设置用户状态为下注状态
        userStates.set(userId, {
            state: USER_STATES.BETTING,
            marketId: marketId,
            option: option
        });

    } catch (error) {
        console.error('Error handling bet callback:', error);
        await ctx.answerCbQuery('❌ Failed to process bet', { show_alert: true });
    }
}



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