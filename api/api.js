const emails = require('../models/emails');
const service = require('../service/service');
const https = require('https');
const config = require('../config');

function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

function request(options) {
  return new Promise((resolve, reject) => {
    var req = https.request({
      host: options.host,
      port: options.port || 443,
      path: options.path + (options.additionally || ''),
      method: options.method || 'POST',
      cookie: options.cookie || '',
      headers: {
        'Content-Type': options.contentType || 'application/json',
        'Content-Length': Buffer.byteLength(options.data),
        'If-Modified-Since': options.if_modified_since || ''
      }
    }, function (res) {
      res.setEncoding('utf8');
      let result = '';
      res.on('data', function (chunk) {
        result += chunk;
      });
      res.on('end', () => {
        result = isJson(result) ? resolve(result) : resolve();
      });
    });
    req.on('error', (error) => {
      reject(error);
    });
    req.write(options.data);
    req.end();
  });
}

function prepareData(data) {
  let params = {};
  for (const prop in data) {
    if (data[prop]) {
      let obj = {};
      obj[prop] = data[prop];
      params = Object.assign(params, obj);
    }
  }
  return params;
}

function execMethod(method, data) {
  let pathPart = '';
  if (config.auth_type !== 'webhook_token') {
    pathPart = method;
  } else {
    pathPart = `${config.user_id}/${config.webhook_token}/${method}`;
  }
  return request({
    host: config.host,
    path: '/rest/' + pathPart,
    data: JSON.stringify(prepareData(data))
  });
}

function addEmailsToDatabase(req, res) {
  try {

    /* prepare params array */
    let paramsArray = service.prepareParamsArray(req);
    /* add params to DB */
    emails.create(paramsArray, function (err, results) {
      if (err)
        res.send(err);
      else
        res.send('OK');
    });

  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  addEmailsToDatabase,
  execMethod
};