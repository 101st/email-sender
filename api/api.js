const emails = require('../models/emails');
const service = require('../service/service');

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
  addEmailsToDatabase
};