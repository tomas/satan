var async = require('async'),
    exec  = require('child_process').exec;

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

  var fx = cmds.map(function(cmd) {
    return function(cb) { 
      // console.log(cmd);
      exec(cmd, function(err, stdout, stderr) {
        var success = stdout.toString().match('SUCCESS');
        cb(success ? null : err || new Error(stdout));
      }) 
    }
  })

  async.series(fx, cb);
}
