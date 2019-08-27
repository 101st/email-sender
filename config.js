module.exports = {
  dev: {
    mongodb: 'mongodb://potorochinau:acera510@ds139937.mlab.com:39937/ns2',
    bitrix: {
      host: 'run24.bitrix24.ru',
      user_id: '1513',
      webhook_token: 'v5prxf1c1gdyya56',
      auth_type: 'webhook_token'
    },
    smtp: {
      host: 'smtp.sendgrid.net',
      port: 465,
      secure: true,
      user: 'apikey',
      password: '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'
    }
  }
};