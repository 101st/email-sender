const emails = require('../models/emails');
const bitrix = require('../api/bitrix');

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

    let deal = await bitrix.execMethod('crm.deal.get', { id: obj.deal_id });
    let {
      TITLE: deal_name,
      COMPANY_ID: company_id,
      UF_CRM_1520861014: bill_id,
      UF_CRM_5CB9EAE29B418: product_id,
      UF_CRM_5CBDF5A037324: segment_id,
      UF_CRM_1550228289: party_id,
      UF_CRM_1520864890: email_to
    } = deal.result;

    console.log(deal)
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  prepareParamsArray,
  startQueue
}