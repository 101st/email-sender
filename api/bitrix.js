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
        result = isJson(result) ? resolve(JSON.parse(result)) : resolve();
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
  let { auth_type, user_id, webhook_token, host } = config.dev.bitrix;
  if (auth_type !== 'webhook_token') {
    pathPart = method;
  } else {
    pathPart = `${user_id}/${webhook_token}/${method}`;
  }
  return request({
    host: host,
    path: '/rest/' + pathPart,
    data: JSON.stringify(prepareData(data))
  });
}

module.exports = {
  execMethod
}