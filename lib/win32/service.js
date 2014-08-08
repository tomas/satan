exports.create = function(opts, cb) {

  var key  = opts.key,
      bin  = opts.bin,
      name = opts.name,
      desc = opts.desc;

  var cmd = 'sc create ' + key + ' binPath= ' + bin;
  cmd += ' start= auto'; // options: boot, system, auto, demand, disabled
  cmd += ' DisplayName= "' + name + '"';

  exec(cmd, function(err) {
    if (err || !desc) return cb(err);

    var cmd = 'sc description ' + key + ' "' + desc + '"';
    exec(cmd, cb);
  });

}
