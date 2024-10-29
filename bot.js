
// bot.js
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

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