var exec = require('child_process').exec,
    join = require('path').join;

var scripts_path = '/etc/init';

var commands = {
  status : 'initctl status $1',
//  load   : 'initctl start $1',
//  unload : 'initctl stop $1',
  start  : 'initctl start $1',
  stop   : 'initctl stop $1',
  reload : 'initctl reload-configuration'
}

var run = function(cmd, key, cb) {
  var command = commands[cmd].replace('$1', key);
  exec(command, cb);
}

exports.name = 'upstart';

exports.get_path = function(distro_name, key) {
  return join(scripts_path, key + '.conf'); // /etc/init/foo-service.conf
}

exports.exists = function(key, cb) {
  run('status', key, function(err, out) {
    if (err) {
      if (err.message.match('unrecognized service'))
        return cb(null, false);
      else
        return cb(err);
    }

    return cb(null, true);
  });
}

exports.start = function(key, cb) {
  run('start', key, cb);
}

exports.stop = function(key, cb) {
  run('stop', key, cb);
}

// upstart detects changes via inotify
// so there's no need to run any command
exports.load = function(key, cb) {
  cb();
}

// upstart detects changes via inotify, so we'll only call stop()
// to ensure the daemon is not running
exports.unload = function(key, cb) {
  run('stop', key, function(err) {
    // Unknown instance is returned when not running.
    if (err && !err.message.match('Unknown instance:'))
      return cb(err);

    cb();
  });
}

exports.reload = function(key, cb) {
  run('reload', key, cb);
}

exports.reload_all = exports.reload;
