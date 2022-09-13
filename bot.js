const {Telegraf, session, Markup} = require('telegraf');
const env = require('dotenv');
const sequelize = require('./sequelize');
const {models} = require('./sequelize');
const axios = require('axios');
const menuKeyboard = require('./keyboards/menu.keyboard');
const utf8 = require('utf8');

if (process.env.NODE_ENV === 'development') {
  env.config({path: '.development.env'});
} else if (process.env.NODE_ENV === 'production') {
  env.config({path: '.production.env'});
}

const bot = new Telegraf(process.env.BOT_TOKEN, {polling: true});


bot.use(session());


bot.start(async ctx => {
  // Определяем сессионное хранилище для дальнейших манипуляций, связанных с рассылкой
  ctx.session = {};
  ctx.session.mailing = false;
  const userId = ctx.update.message.from.id;
  const userName = ctx.update.message.from.username;

  // Ищем юзера по telegram user ID в базе данных
  const candidate = await models.user.findOne({where: {userId}});

  // Если юзера в базе нет - создаём его
  if (!candidate) {
    const user = await models.user.create({userId,userName});

    await user.save();
  }
  return ctx.replyWithHTML(
    'Здравствуйте. Нажмите на любую интересующую Вас кнопку',
    menuKeyboard
  );
});

// Роут для навигации | стартовое меню
bot.action('menu', async ctx => {
  ctx.session = {};
  ctx.session.mailing = false;
  return ctx.editMessageText(
    'Здравствуйте. Нажмите на любую интересующую Вас кнопку',
    menuKeyboard
  );
});


bot.action('weather', async ctx => {
  // Получаем данные о погоде
  const res = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
    params: {
      q: 'toronto',
      lang: 'ru',
      units: 'metric',
      appid: process.env.WEATHER_TOKEN
    }
  });
  const weather = res.data.weather[0].description;
  const temp = Math.floor(res.data.main.temp);

  const message = `Погода в Торонто, Канада: ${weather}, ${temp} ℃`;
  return ctx.editMessageText(message, Markup.inlineKeyboard([Markup.button.callback('Назад в меню', 'menu')]));
});

// Роут для выдачи материалов для чтения
bot.action('read', async ctx => {
  // Картинка с текстом
  await ctx.replyWithPhoto("https://pythonist.ru/wp-content/uploads/2020/03/photo_2021-02-03_10-47-04-350x2000-1.jpg", {
    caption: 'Идеальный карманный справочник для быстрого ознакомления с особенностями работы разработчиков на Python. Вы найдете море краткой информации о типах и операторах в Python, именах специальных методов, встроенных функциях, исключениях и других часто используемых стандартных модулях.'
  });
  // Архив для скачивания
  await ctx.replyWithDocument('https://drive.google.com/u/0/uc?id=1Xs_YjOLgigsuKl17mOnR_488MdEKloCD&export=download');
  // Навигация
  return ctx.replyWithHTML('Для возвращения в меню нажмите на кнопку', Markup.inlineKeyboard([Markup.button.callback('Назад в меню', 'menu')]));
});


// Роут для подтверждения рассылки
bot.action('mailing', async ctx => {
  return ctx.editMessageText('Вы выбрали рассылку всем пользователям. Вы уверен что хотите это сделать?', Markup.inlineKeyboard([
    Markup.button.callback('Уверен', 'startMailing'),
    Markup.button.callback('Отмена', 'menu'),
  ]));
});

// Роут, включающий ожидание текста для рассылки
bot.action('startMailing', async ctx => {
  ctx.session.mailing = true;
  return ctx.editMessageText('Введите сообщение, которое хотите отправить всем пользователям.');
});

// Роут, реализующий рассылку
bot.on('message', async ctx => {
  if (ctx.session.mailing) {
    const message = utf8.encode(ctx.message.text);
    let count = 0;

    // Функция и массив для склонения слов
    const declOfNum = (n, titles) => {
      return n + ' ' + titles[n % 10 === 1 && n % 100 !== 11 ?
        0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];
    };
    const words = ['пользователю', 'пользователям'];

    // Получение всех telegram user ID из БД
    const users = await models.user.findAll({attributes: ['userId']});

    for (let user of users) {
      // Проверяем, что юзер из БД - не сам отправитель
      if (user.userId !== ctx.update.message.from.id) {
        // используем аксиос, так как нативный метод выбрасывает исключение, если получалеть заблокировал бота.
        const res = await axios.get(
          `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage?chat_id=${user.userId}&text=${message}`,
          {
            // Для того, что бы бот не падал, если получатель заблокирова бота - убираем исключения при 403 статусе
            validateStatus: status => {
              if (status === 403 || status === 200 || status === 201) {
                return true;
              }
            }
          }
        );
        // если сообщение было доставлено - увеличиваем счётчик успешных отправок
        if (res.status === 200 || res.status === 201) {
          count++;
        }
      }
    }

    ctx.session.mailing = false;

    // В зависимости от количества получателей - отвечаем отправителю
    if (count) {
      return ctx.replyWithHTML(`Сообщение было отправлено ${declOfNum(count, words)}`, Markup.inlineKeyboard([Markup.button.callback('Вернутся в меню', 'menu')]));
    } else {
      return ctx.replyWithHTML(`Сообщение не было отправлено никому. Возможно, у бота нету пользователей, кроме Вас`, Markup.inlineKeyboard([Markup.button.callback('Вернутся в меню', 'menu')]));
    }

  } else {
    // Если не включено ожидание текста для рассылки, то бот будет отвечать стартовым меню
    return ctx.replyWithHTML(
      'Здравствуйте. Нажмите на любую интересующую Вас кнопку',
      menuKeyboard
    );
  }
});

// Функция подключения к БД и запуска бота
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
