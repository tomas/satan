var exec = require('child_process').exec,
    join = require('path').join;

var scripts_path = '/etc/systemd/system';

var commands = {
  status : 'systemctl status $1.service',
  load   : 'systemctl enable $1.service', 
  unload : 'systemctl disable $1.service',
  reload : 'systemctl --system daemon-reload', // reloads all configs
  start  : 'systemctl start $1.service',
  stop   : 'systemctl stop $1.service'
}

var run = function(cmd, key, cb) {
  var command = commands[cmd].replace('$1', key);
  // console.log(command);
  exec(command, cb);
}

exports.name = 'systemd';

exports.get_path = function(distro_name, key) {
  return join(scripts_path, key + '.service'); // /etc/systemd/foo-service
}

exports.exists = function(key, cb) {
  run('status', key, function(err, out) {
    var loaded = out && !!out.toString().match('Loaded: loaded');
    cb(null, loaded);
  });
}

exports.start = function(key, cb) {
  run('start', key, cb);
}

exports.stop = function(key, cb) {
  run('stop', key, cb);
}

exports.load = function(key, cb) {
  run('load', key, cb);
} 

exports.unload = function(key, cb) {
  run('unload', key, cb);
}

exports.reload = function(key, cb) {
  run('unload', key, function(err) {
    // if (err) return cb(err);

    run('load', key, cb);
  });
}

/*
exports.reload = function(cb) {
  run('reload', cb);
}
*/