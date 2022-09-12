const {Telegraf, session, Markup} = require('telegraf');
const env = require('dotenv');
const sequelize = require('./sequelize');
const {models} = require('./sequelize');

if (process.env.NODE_ENV === 'development') {
  env.config({path: '.development.env'});
} else if (process.env.NODE_ENV === 'production') {
  env.config({path: '.production.env'});
}

const bot = new Telegraf(process.env.BOT_TOKEN);


bot.use(session());

bot.start(async ctx => {
  const userId = ctx.update.message.from.id;
  const userName = ctx.update.message.from.username;

  const candidate = await models.user.findOne({where: {userId}});

  if (!candidate) {
    const user = await models.user.create({
      userId, userName
    });

    await user.save();
  }
  ctx.replyWithHTML(
    'Здравствуйте. Нажмите на любую интересующую Вас кнопку',
    Markup.inlineKeyboard([
      Markup.button.callback('Погода в Канаде', 'wether'),
      Markup.button.callback('Хочу почитать!', 'read'),
      Markup.button.callback('Сделать рассылку', 'mailing'),
    ], {wrap: (btn, index, currentRow) => currentRow.length >= index / 2}));
});


(async () => {
  try {
    await sequelize.authenticate();
    console.log('The connection to the DB has been settled');
    bot.launch();
    console.log('Bot has been started...');
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();
