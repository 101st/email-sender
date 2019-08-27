const fs = require('fs');
var path = require('path');
const ejs = require('ejs');
const nodemailer = require('nodemailer');
const emails = require('../models/emails');
const bitrix = require('../api/bitrix');
const config = require('../config');

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

    let {
      _id,
      type,
      deal_id,
      year_id,
      period_id,
      file1,
      file2,
      file3,
      doc1,
      doc2,
      doc3
    } = obj;

    /* PREPARE DATA */

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

    let company = await bitrix.execMethod('crm.company.get', { id: company_id });
    let { TITLE: company_name } = company.result;

    let element_277 = await bitrix.execMethod('lists.element.get', {
      IBLOCK_TYPE_ID: 'bitrix_processes',
      IBLOCK_ID: '277',
      ELEMENT_ID: year_id
    });
    let { 191301: year_print } = element_277.result[0].PROPERTY_1903;

    let element_279 = await bitrix.execMethod('lists.element.get', {
      IBLOCK_TYPE_ID: 'bitrix_processes',
      IBLOCK_ID: '279',
      ELEMENT_ID: period_id
    });
    let { 188581: period_print } = element_279.result[0].PROPERTY_1897;

    let element_205 = await bitrix.execMethod('lists.element.get', {
      IBLOCK_TYPE_ID: 'bitrix_processes',
      IBLOCK_ID: '205',
      ELEMENT_ID: product_id
    });
    let { NAME: product_name } = element_205.result[0];
    let { '155881': product_email_support } = element_205.result[0].PROPERTY_1797;
    let { '157959': product_email_invoice } = element_205.result[0].PROPERTY_1803;
    let { '155907': product_domain_storage } = element_205.result[0].PROPERTY_1799;
    let { '155909': product_tt_url } = element_205.result[0].PROPERTY_1801;

    let element_199 = await bitrix.execMethod('lists.element.get', {
      IBLOCK_TYPE_ID: 'bitrix_processes',
      IBLOCK_ID: '199',
      ELEMENT_ID: party_id
    });
    let { NAME: party_name } = element_199.result[0];

    /* PREPARE TEMPLATE */
    let body = await ejs.renderFile(path.join(__dirname, '../template/body.ejs'), {
      product_email_support: product_email_support,
      segment_id: segment_id,
      product_name: product_name,
      party_id: party_id,
      period_print: period_print,
      year_print: year_print,
      company_name: company_name,
      party_name: party_name,
      deal_name: deal_name,
      email_to: email_to,
      product_id: product_id,
      product_tt_url: product_tt_url,
    });

    let subject = await ejs.renderFile(path.join(__dirname, '../template/subject.ejs'), {
      company_name: company_name,
      period_print: period_print,
      year_print: year_print
    });

    let doc = await ejs.renderFile(path.join(__dirname, '../template/doc.ejs'), {
      doc1: doc1,
      doc2: doc2,
      doc3: doc3
    });

    let url = await ejs.renderFile(path.join(__dirname, '../template/url.ejs'), {
      product_domain_storage: product_domain_storage,
      file1: file1,
      file2: file2,
      file3: file3
    });

    const nodemailer = require('nodemailer');
    let transporter = nodemailer.createTransport({
      host: config.dev.smtp.host,
      port: config.dev.smtp.port,
      secure: config.dev.smtp.secure,
      auth: {
        user: config.dev.smtp.user,
        pass: config.dev.smtp.password
      }
    });

    transporter.sendMail({
      from: product_email_invoice,
      to: email_to,
      bcc: product_email_invoice,
      subject: subject,
      html: body
    }, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log(info);
      }
    });

  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  prepareParamsArray,
  startQueue
}