
var fs    = require('fs'),
    join  = require('path').join,
    template = require('minstache');

var temp_path = function(filename) {
  var tempdir = process.env.TMPDIR || '/tmp';
  return join(tempdir, filename);
}

var check = function(opts) {
  var data = {};

  data.key    = opts.key;
  data.name   = opts.name || opts.key;
  data.path   = opts.path;
  data.bin    = opts.bin;

  // execution options
  data.user   = opts.user   || opts.run_as;
  data.opts   = opts.opts   || [];

  if (opts.env) {
    data.has_env = true;
    data.env = [];
    // map { foo: 'bar'} to [{ key: 'foo', value: 'bar' }]
    for (var key in opts.env) {
      var obj = { key: key, value: opts.env[key] };
      data.env.push(obj);
    }
  }

  data.desc   = opts.desc   || 'The ' + data.name + ' daemon.';
  data.author = opts.author || 'A nice guy.';

  // advanced options

  // the number of seconds that the daemon should wait
  // before restarting the process when exiting.
  // NOTE: on OSX, this only affects when the process exits before 10 seconds have passed.
  data.up_respawn_wait = opts.up_respawn_wait || opts.respawn_wait;
  data.sd_respawn_wait = opts.sd_respawn_wait || opts.respawn_wait;
  data.ld_respawn_wait = opts.ld_respawn_wait || opts.respawn_wait;

  // seconds to wait after TERM, before sending a definitive KILL signal
  data.kill_timeout    = opts.kill_timeout || 20;

  // Upstart/systemd: what signal to send when reload or stop is called.
  // by default the SIGHUP signal is sent.
  data.reload_signal   = opts.reload_signal; // only upstart
  data.kill_signal     = opts.kill_signal || 'QUIT';

  // upstart start options
  data.up_start_on     = opts.up_start_on || 'startup';
  data.up_stop_on      = opts.up_stop_on  || 'runlevel [016]';

  // systemd start options
  data.sd_start_after  = opts.sd_start_after || 'network.target';
  data.sd_restart      = opts.sd_restart     || 'always';

  // custom script support for Upstart
  ['pre_start', 'post_start', 'pre_stop', 'post_stop'].forEach(function(stage) {
    var script_name = 'up_' + stage + '_script';

    if (opts[script_name])
      data[script_name] = opts[script_name];
  })

  // LaunchDaemon: paths to watch for modifications. triggers restart if something changes.
  if (opts.watch_paths) {
    data.watch_paths = true;
    data.watch_paths_array = opts.watch_paths.map(function(dir) { return { path: dir } });
  }

  return data;
}

exports.generate = function(data, template_path, extension, cb) {
  var data = check(data),
      dest = join(temp_path(data.key + extension || ''));

  fs.readFile(template_path, function(err, source) {
    if (err) return cb(err);

    var result = template(source.toString(), data).replace(/^\s*\n/gm, '\n');

    if (result === source.toString() || result.match('{{'))
      return cb(new Error('Unable to replace variables in plist template!'))

    fs.writeFile(dest, result, function(err) {
      if (err) return cb(err);

      cb(null, dest);
    });
  });
}
