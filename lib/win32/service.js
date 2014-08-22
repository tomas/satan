var async = require('async'),
    exec  = require('child_process').exec;

var errors = {
  '3'    : 'Path not found',
  '5'    : 'Access denied',
  '1060' : 'Does not exist',
  '1062' : 'Has not been started',
  '1073' : 'Service already exists',
  '1639' : 'Argument error'
}

exports.exists = function(key, cb) {
  exec('sc qc ' + key, function(err, out) {
    if (err) return cb(err);

    var exists = out && !out.toString().match('1060');
    cb(null, exists);
  });
}

exports.bin_path = function(key, cb) {
  exec('sc qc ' + key, function(err, out) {
    if (err) return cb(err);

    var match = out.toString().match(/([^\s]+).exe/);

    if (match)
      return cb(null, match[0].trim());

    cb(new Error('Unable to get bin path.'))
  })
}

exports.create = function(opts, cb) {

  var key  = opts.key,
      bin  = opts.bin,
      name = opts.name,
      desc = opts.desc;

  var cmds = [];

  var cmd = 'sc create ' + key + ' binPath= "' + bin + '"';
  cmd += ' start= auto'; // options: boot, system, auto, demand, disabled
  cmd += ' error= normal'; // notify if failed. with 'ignore' no message is shown.
  cmd += ' DisplayName= "' + name + '"';

  cmds.push(cmd);

  // restart after 10 seconds (or custom) if failed, and also
  // reset restart counter to 0 after 30 seconds of uptime
  var restart_wait = opts.restart_wait || 10000;
  var reset_after  = opts.reset_after  || 30;
  cmd = 'sc failure ' + key + ' reset= ' + reset_after + ' actions= restart/' + restart_wait;

  cmds.push(cmd);

  // if description is present, set it.
  if (desc) {
    cmds.push('sc description ' + key + ' "' + desc + '"');
  }

  var codes = Object.keys(errors),
      regex = new RegExp(' (' + codes.join('|') + '):');

  var fx = cmds.map(function(cmd) {
    return function(cb) {
      // console.log(cmd);

      exec(cmd, function(err, stdout, stderr) {
        var failed = !!stdout.toString().match(regex);
        cb(failed ? err || new Error(stdout.toString().trim()) : null);
      })
    }
  })

  async.series(fx, cb);
}

exports.start = function(key, cb) {
  exec('sc start ' + key, function(err, out) {
    if (out.match('PID'))
      cb();
    else
      cb(new Error(out.trim()))
  });
}

exports.stop = function(key, cb) {
  exec('sc stop ' + key, function(err, out) {
    if (out.toString().match('1062')) { // not running
      var err = new Error('Not running.');
      err.code = 'NOT_RUNNING'; // used by satan.ensure_stopped() to check
    } else if (out.toString().match('1060')) {
      cb(new Error('Service not found.'));
    }
    cb(err);
  });
}

exports.delete = function(key, cb) {
  exec('sc delete ' + key, function(e, out) {
    if (out && out.toString().match('1060'))
      return cb(new Error(out.toString()))

    cb();
  });
}
