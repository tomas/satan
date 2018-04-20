var async = require('async'),
    exec  = require('child_process').exec;

var log = function(str) {
  console.log(str);
}

var run = function(cmd, cb) {
  exec(cmd, cb)
}

var errors = {
  '3'    : 'Path not found',
  '5'    : 'Access denied',
  '1060' : 'Does not exist',
  '1062' : 'Has not been started',
  '1073' : 'Service already exists',
  '1639' : 'Argument error'
}

exports.exists = function(key, cb) {
  run('sc qc ' + key, function(err, out) {
    if (err) return cb(err);

    var exists = out && !out.toString().match('1060');
    cb(null, exists);
  });
}

exports.status = function(key, cb) {
  run('sc qc ' + key, function(err, stdout) {
    // if (err) return cb(err);

    process.stdout.write(stdout);
  })
}

exports.bin_path = function(key, cb) {
  run('sc qc ' + key, function(err, out) {
    if (err) return cb(err);

    var match = out.toString().match(/([^\s]+).exe/);
    // log('Bin path: ' + match[0]);

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
      // log(cmd);

      run(cmd, function(err, stdout, stderr) {
        var failed = !!stdout.toString().match(regex);
        if (!failed)
          return cb();

        var e = (err && err.message.trim() != 'Command failed:') ? err : new Error(stdout.toString().trim());
        cb(e);
      })
    }
  })

  async.series(fx, cb);
}

exports.start = function(key, cb) {
  run('sc start ' + key, function(err, out) {
    if (out.match('PID'))
      cb();
    else
      cb(new Error(out.trim()))
  });
}

exports.stop = function(key, cb) {
  run('sc stop ' + key, function(err, out) {
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
  run('sc delete ' + key, function(e, out) {
    if (out && out.toString().match('1060'))
      return cb(new Error(out.toString()))

    cb();
  });
}
