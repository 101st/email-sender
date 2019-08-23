const emails = require('../models/emails');
const api = require('../api/api');

function prepareParamsArray(req) {
  try {

    let { params, args, separator } = req.body;
    params = params.trim();
    params = params.split('\n');
    args = args.split(';');

    for (let i = 0; i < params.length; i++) {
      params[i] = params[i].split(separator || ';');
      if (params[i].length !== args.length) {
        res.json({
          error: true,
          error_message: `ARGS count and PARAMS count is not valid (Should be the same count). Line:${i + 1}`
        });
        return;
      }
    }

    let paramsArray = [];
    for (let i = 0; i < params.length; i++) {
      let obj = {};
      for (let key in req.body) {
        if (key === 'params') {
          obj[key] = params[i];
        } else if (key === 'args') {
          obj[key] = args;
        } else {
          obj[key] = req.body[key];
        }
        obj['status'] = 'ready';
        obj['created'] = new Date();
      }
      paramsArray.push(obj);
    }
    return paramsArray;

  } catch (error) {
    console.log(error);
  }
}

async function startQueue() {
  try {

    let result = await emails.findOne({ status: 'ready' });

    let obj = {};
    switch (result.type) {
      case 'invoice':
      case 'invoice1':
      case 'invoice2':
      case 'invoice3':
        obj['_id'] = result._id;
        obj['type'] = result.type;
        for (let i = 0; i < result.args.length; i++) {
          obj[result.args[i]] = result.params[i];
        }
        break;
      default:
        console.log("Template don't found");
        break;
    }
    console.log(obj);
    //console.log(api);
    //let a = await api.execMethod('crm.deal.get', { id: obj._id });

  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  prepareParamsArray,
  startQueue
}