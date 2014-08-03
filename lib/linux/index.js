var fs      = require('fs'),
    join    = require('path').join,
    which   = require('which'),
    Builder = require('./../builder');

var init_system = 'sysvinit';

if (which.sync('systemctl')) {
  init_system = 'systemd';
} else if (which.sync('initctl')) {
  init_system = 'upstart';
} 

// var daemon = require('./' + init_system);

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

exports.exists = function(key, cb) {
  daemon.exists(key, cb);
}

exports.create = function(opts, cb) {
  this.ensure_destroyed(opts.key, function(err) {
    if (err) return cb(err);

    var builder = new Builder(opts);
    builder.generate(template_path, '.plist', function(err, temp_script) {
      if (err) return cb(err);

      daemon.install(temp_script, cb);
    });
  });
}

exports.start = function(key, cb) {
  daemon.start(key, cb);
}

exports.stop = function(key, cb) {
  daemon.stop(key, cb);
}

exports.destroy = function(key, cb) {
  daemon.remove(key, cb);
}

exports.ensure_destroyed = function(key, cb) {
  daemon.remove(key, function(err) {
    if (err && !err.toString().match('Not found:')) 
      return cb(err);

    cb()
  })
}