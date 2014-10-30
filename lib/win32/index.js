var exec     = require('child_process').exec,
    basename = require('path').basename,
    nssm     = require('./nssm'),
    service  = require('./service');

/*
var get_pid_of_process = function(exe, cb) {
  var cmd = 'tasklist /nh /fi "imagename eq ' + exe + '"';

  exec(cmd, function(err, stdout) {
    if (err) return cb(err);

    if (stdout.toString().indexOf(exe) === -1)
      return cb(); //service not running

    var cols = stdout.split(/\s+/),
        pid  = cols[2];

    cb(null, parseInt(pid));
  });
}
*/

var kill_process = function(process_name, cb) {
  exec('taskkill /f /im ' + process_name, cb);
}

var stop_service_process = function(key, cb) {
  service.bin_path(key, function(err, bin_path) {
    if (err) return cb(err);

    var exe = basename(bin_path);
    kill_process(exe, cb);
  })
}

var delete_service = function(key, cb) {
  // use nssm for deleting services, that way we remove
  // anything that may have been inserted by them
  return nssm.uninstall(key, cb);

  service.delete(key, cb);
}

exports.exists = function(key, cb) {
  service.exists(key, cb);
}

exports.test_create = function(opts, cb) {
  cb(new Error('Not supported, since Windows does not use init scripts.'));
}

exports.create = function(opts, cb) {
  if (opts.daemon_path === null || opts.daemon_path === false)
    service.create(opts, cb);
  else
    nssm.install(opts, cb)
}

exports.ensure_created = function(opts, cb) {
  exports.ensure_destroyed(opts.key, function(err) {
    if (err) return cb(err);

    exports.create(opts, cb);
  })
}

exports.start = function(key, cb) {
  service.start(key, cb);
}

exports.stop = function(key, cb) {
  service.stop(key, cb);
}

// tries to stop. if unstoppable, kills the process
// if service doesn't exist, returns error
exports.ensure_stopped = function(key, cb) {
  exports.stop(key, function(err, stdout) {
    if (err && err.code != 1052) { // 1052 code means couldn't stop

      // only return error if error isn't 'NOT_RUNNING'
      return err.code == 'NOT_RUNNING' ? cb() : cb(err);
    }

    stop_service_process(key, cb);
  });
}

exports.destroy = function(key, cb) {
  this.exists(key, function(err, exists) {
    if (err || !exists) return cb(new Error('Service not found.'));

    exports.ensure_stopped(key, function(err) {
      // if (err) return cb(err); // still?

      delete_service(key, cb);
    })
  });
}

exports.ensure_destroyed = function(key, cb) {
  this.destroy(key, function(err) {
    if (err && !err.message.match(/not found/i))
      return cb(err);

    cb();
  })
}
