const {Telegraf, session, Markup} = require('telegraf');
const env = require('dotenv');
const sequelize = require('./sequelize');
const {models} = require('./sequelize');
const axios = require('axios');
const menuKeyboard = require('./keyboards/menu.keyboard');
const fs = require('fs');

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

  // const candidate = await models.user.findOne({where: {userId}});

  // if (!candidate) {
  //   const user = await models.user.create({
  //     userId, userName
  //   });

  //   await user.save();
  // }
  return ctx.replyWithHTML(
    'Здравствуйте. Нажмите на любую интересующую Вас кнопку',
    menuKeyboard
  );
});

bot.action('menu', async ctx => {
  return ctx.editMessageText(
    'Здравствуйте. Нажмите на любую интересующую Вас кнопку',
    menuKeyboard
  );
});


bot.action('weather', async ctx => {
  const res = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
    params: {
      q: 'toronto',
      lang: 'ru',
      units: 'metric',
      appid: '360158d995629e1c0b69119273d14e01'
    }
  });
  const weather = res.data.weather[0].description;
  const temp = Math.floor(res.data.main.temp);

  const message = `Погода в Торонто, Канада: ${weather}, ${temp} ℃`
  return ctx.editMessageText(message, Markup.inlineKeyboard([Markup.button.callback('Назад в меню', 'menu')]));
});

bot.action('read', async ctx => {
  const file = fs.readFileSync('./karmaniy_spravochnik_po_piton.zip', 'utf-8');

  await ctx.replyWithPhoto("https://pythonist.ru/wp-content/uploads/2020/03/photo_2021-02-03_10-47-04-350x2000-1.jpg", {caption: 'Идеальный карманный справочник для быстрого ознакомления с особенностями работы разработчиков на Python. Вы найдете море краткой информации о типах и операторах в Python, именах специальных методов, встроенных функциях, исключениях и других часто используемых стандартных модулях.”'});
  // await ctx.replyWithDocument(file);
  await ctx.replyWithDocument('https://drive.google.com/u/0/uc?id=1Xs_YjOLgigsuKl17mOnR_488MdEKloCD&export=download');
  return ctx.replyWithHTML('Для возвращения в меню нажмите на кнопку', Markup.inlineKeyboard([Markup.button.callback('Назад в меню', 'menu')]));
});


(async () => {
  try {
    // await sequelize.authenticate();
    console.log('The connection to the DB has been settled');
    bot.launch();
    console.log('Bot has been started...');
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();
