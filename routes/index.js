var phantom = require('phantom');
var fs = require('fs');
var ph;
var base_path = "./public/images/";
var id = 0;
//Iterate over images and increase id based on max
fs.readdir(base_path, function (err, files) { if (err) throw err;
  files.forEach( function (file) {
    var val = parseInt(file.split(".")[0]);
    if(!isNaN(val))
    {
      id = val + 1;
    }
  });
});

//Create the phantom instance to be shared among all instances
phantom.create("--web-security=no", "--ignore-ssl-errors=yes", { port: 12345 }, function (_ph) {
  ph = _ph;
});

exports.index = function(req, res){
  var url = req.query.url;
  var selector = req.query.selector;
  var trim = req.query.trim || 100;
  
  ph.createPage(function(page) {
    page.open(url, function (status) {
      page.set('viewportSize', { width: 1200, height: 800 }, function (result) {
        page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function(err) {
          setTimeout(function() {
            return page.evaluate(function(selector, id) {
              var el = $(selector);
              if(el.html() != null)
              {
                return {
                  status: true,
                  html: el.html().replace(/\s{2,}/g, ' '),
                  top: el.get(0).offsetTop,
                  left: el.get(0).offsetLeft,
                  width: el.get(0).offsetWidth,
                  height: el.get(0).offsetHeight,
                  maxWidth: document.body.offsetWidth,
                  maxHeight: document.body.offsetHeight
                };
              }
              else
              {
                return {
                  status: false
                }
              }
            }, function(result) {
              if(result.status)
              {
                page.set('clipRect', { 
                  top: Math.max(result.top-trim, 0), 
                  left: Math.max(result.left-trim, 0), 
                  width: Math.min(result.width+(trim*2), result.maxWidth), 
                  height: Math.min(result.height+(trim*2), result.maxHeight) 
                });
                page.render(base_path + (id++) + '.png', function(err) {
                  page.close();
                  res.json({url: url, selector: selector, content: result, id: id-1});
                });
              } else 
              {
                page.close();
                res.json({url: url, selector: selector, error: "not found"});
              }
            }, selector);
          }, 1000);
        });
      });
    });
  });
};