
var index = require("./routes/index");

exports.create = function(app) {
  app.get('/', index.index);
}