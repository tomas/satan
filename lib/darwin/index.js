var fs      = require('fs'),
    join    = require('path').join,
    launchd = require('launchd'),
    builder = require('./../builder');

var plist_template = 'template.plist',
    template_path  = join(__dirname, plist_template);

//////////////////////////////////////////////////////
// helpers

var debug = false;

var log = function(str) {
  if (debug)
    log(str);
}

var build = function(opts, cb) {
  builder.generate(opts, template_path, '.plist', cb);
}

//////////////////////////////////////////////////////
// the actual hooks
//////////////////////////////////////////////////////

exports.exists = function(key, cb) {
  launchd.exists(key, cb);
}

exports.test_create = function(opts, cb) {
  build(opts, function(err, temp_script) {
    if (err) return cb(err);

    var res = fs.readFileSync(temp_script);
    fs.unlinkSync(temp_script);
    cb(null, res);
  })
}

exports.create = function(opts, cb) {
  build(opts, function(err, temp_script) {
    if (err) return cb(err);

    launchd.install(temp_script, cb);
  });
}

exports.start = function(key, cb) {
  launchd.start(key, cb);
}

exports.stop = function(key, cb) {
  launchd.stop(key, cb);
}

exports.ensure_stopped = exports.stop;

exports.destroy = function(key, cb) {
  launchd.remove(key, cb);
}

exports.ensure_created = function(opts, cb) {
  this.ensure_destroyed(opts.key, function(err) {
    if (err) return cb(err);

    exports.create(opts, cb);
  });
}

exports.ensure_destroyed = function(key, cb) {
  launchd.remove(key, function(err) {
    if (err && !err.toString().match('Not found:'))
      return cb(err);

    cb()
  })
}
