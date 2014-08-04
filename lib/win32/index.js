var exec = require('child_process').exec,
    basename = require('path').basename;

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

var kill_process = function(process_name, cb) {
  exec('taskkill /f /im ' + process_name, cb);
}

var get_bin_path = function(key, cb) {
  exec('sc qc ' + key, function(err, out) {
    if (err) return cb(err);

    var match = out.toString().match(/PATH_NAME\s+:\s?([^\s]+)/);

    if (match)
      return cb(null, match[1].trim());

    cb(new Error('Unable to get bin path.'))      
  })
}

var force_stop = function(key, cb) {
  get_bin_path(key, function(err, bin_path) {
    if (err) return cb(err);

    var exe = basename(bin_path);
    kill_process(exe, cb);
  })
}

exports.exists = function(key, cb) {
  exec('sc qc ' + key, function(err, out) {
    if (err) return cb(err);

    var exists = out && !!out.toString().match('SUCCESS') || false;
    cb(null, exists);
  });
}

exports.create = function(opts, cb) {
  var key  = opts.key,
      bin  = opts.bin,
      name = opts.name;

  var cmd = 'sc create ' + key + ' binPath= ' + bin;
  cmd += ' start= auto'; // options: boot, system, auto, demand, disabled
  cmd += ' DisplayName= "' + name + '"';

  exec(cmd, cb);
}

exports.start = function(key, cb) {
  exec('sc start ' + key, function(err, out){
    if (out.match('PID'))
      cb();
    else
      cb(new Error(out.trim()))
  });  
}

exports.stop = function(key, cb) {
  exec('sc stop ' + key);
}

exports.destroy = function(key, cb) {
  this.exists(key, function(exists) {
    if (!exists) return cb(new Error('Service not found.'));

  force_stop(key, function(err) {
    // if (err) return cb(err); // if process not running, not to worry.

    exec('sc delete ' + key, function(e, out) {
      if (out && out.toString().match('1060'))
        return cb(new Error(out.toString()))

      cb()
    });
  })
}

exports.ensure_created = function(opts, cb) {
  ensure_destroyed(function(err) {
    if (err) return cb(err);

    exports.create(opts, cb);
  })
}

exports.ensure_destroyed = function(key, cb) {
  this.destroy(key, function(err) {
    if (err && !err.message.match(/not found/i))
      return cb(err);

    cb();
  })
}