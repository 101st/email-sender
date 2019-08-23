var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var emails = new Schema({
  args: {
    type: Array,
    default: []
  },
  created: {
    type: String,
    default: ''
  },
  params: {
    type: Array,
    default: []
  },
  status: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('emails', emails);