import { Telegraf } from 'telegraf';

class PredictionBot {
    constructor(token) {
        this.bot = new Telegraf(token);
        this.predictions = new Map();
        this.setupHandlers();
    }

    setupHandlers() {
        this.bot.command('start', (ctx) => {
            const param = ctx.message.text.split(' ')[1];
            const chatType = ctx.chat.type;

            if (chatType === 'private' && param === 'create_prediction') {
                const keyboard = {
                    inline_keyboard: [[
                        { text: '👉 开始使用', callback_data: 'start_using' }
                    ],
                    [
                        { text: '↩️ 返回上一页', callback_data: 'exit_chat' }
                    ]]
                };

                ctx.reply(
                    '👋 欢迎使用预测投票机器人！\n\n' +
                    '• 您可以创建预测投票\n' +
                    '• 参与他人的投票\n' +
                    '• 分享预测给其他人\n\n' +
                    '选择下方按钮继续：',
                    { reply_markup: keyboard }
                );
            } else if (param === 'create_prediction') {
                this.handlePredict(ctx);
            } else {
                ctx.reply(
                    '👋 欢迎使用预测投票机器人！\n\n' +
                    '使用方法：\n' +
                    '1. 发送 /predict 创建新预测\n' +
                    '2. 选择 是/否 参与投票\n' +
                    '3. 可以转发预测给其他人\n\n' +
                    '现在就输入 /predict 开始创建你的第一个预测吧！'
                );
            }
        });

        this.bot.action('start_using', async (ctx) => {
            await ctx.answerCbQuery();
            this.handlePredict(ctx);
        });

        this.bot.action('exit_chat', async (ctx) => {
            await ctx.telegram.leaveChat(ctx.chat.id);
        });

        this.bot.command('predict', (ctx) => {
            this.handlePredict(ctx);
        });

        this.bot.on('callback_query', async (ctx) => {
            const query = ctx.callbackQuery;
            if (!query.data) return;

            if (['start_using'].includes(query.data)) return;

            const [action, vote, predictionId] = query.data.split('_');
            if (action !== 'vote') return;

            const prediction = this.predictions.get(predictionId);
            if (!prediction) {
                await ctx.answerCbQuery('预测已失效');
                return;
            }

            const userId = query.from.id;
            if (prediction.voters.has(userId)) {
                await ctx.answerCbQuery('你已经投过票了!');
                return;
            }

            prediction.voters.add(userId);
            prediction.votes[vote]++;

            const botUsername = ctx.botInfo.username;
            const startLink = `https://t.me/${botUsername}?start=create_prediction`;

            const keyboard = {
                inline_keyboard: [[
                    { text: `👍 是 (${prediction.votes.yes})`, callback_data: `vote_yes_${predictionId}` },
                    { text: `👎 否 (${prediction.votes.no})`, callback_data: `vote_no_${predictionId}` }
                ],
                [
                    { text: '📲 创建新预测', url: startLink }
                ]]
            };

            await ctx.editMessageText(
                `📊 投票结果:\n👍 赞成: ${prediction.votes.yes}\n👎 反对: ${prediction.votes.no}\n\n👉 ${startLink}`,
                {
                    reply_markup: keyboard,
                    protect_content: false
                }
            );
            await ctx.answerCbQuery('✅ 投票成功！');
        });
    }

    handlePredict(ctx) {
        const predictionId = String(Date.now());
        const botUsername = ctx.botInfo.username;
        const startLink = `https://t.me/${botUsername}?start=create_prediction`;

        return ctx.telegram.sendMessage(
            ctx.chat.id,
            `*📊 新预测*\n\n请选择你的答案！\n\n👉 点击下方按钮分享或创建新预测\n\n👉 [点击创建新预测](${startLink})`,
            {
                parse_mode: 'MarkdownV2',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '👍 是', callback_data: `vote_yes_${predictionId}` },
                        { text: '👎 否', callback_data: `vote_no_${predictionId}` }
                    ]]
                }
            }
        );
    }

    start() {
        this.bot.launch();
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }
}

export default PredictionBot;

// 使用示例
const bot = new PredictionBot('7594222718:AAEYFw5o-lO3TBEYLS-D_CMmWbCD2DloPho');
bot.start();