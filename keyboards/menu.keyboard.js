const { Markup } = require('telegraf');

module.exports = Markup.inlineKeyboard([
  Markup.button.callback('Погода в Канаде', 'weather'),
  Markup.button.callback('Хочу почитать!', 'read'),
  Markup.button.callback('Сделать рассылку', 'mailing'),
], {wrap: (btn, index, currentRow) => currentRow.length >= index / 2}
);
