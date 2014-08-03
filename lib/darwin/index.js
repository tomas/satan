var fs      = require('fs'),
    join    = require('path').join,
    launchd = require('launchd'),
    Builder = require('./../builder');

var plist_template = 'template.plist',
    template_path  = join(__dirname, plist_template);

//////////////////////////////////////////////////////
// helpers

var debug = false;

var log = function(str) {
  if (debug)
    log(str);
}

//////////////////////////////////////////////////////
// the actual hooks
//////////////////////////////////////////////////////

exports.exists = function(name, cb) {
  launchd.exists(name, cb);
}

exports.create = function(opts, cb) {
  launchd.remove(opts.name, function(err) {
    if (err && !err.toString().match('Not found:')) 
      return cb(err);

    var builder = new Builder(opts);
    builder.generate(template_path, '.plist', function(err, temp_script) {
      if (err) return cb(err);

      launchd.install(temp_script, cb);
    });
  });
}

exports.destroy = function(name, cb) {
  launchd.remove(name, cb);
}
