
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
  data.env    = opts.env    || [];

  data.desc   = opts.desc   || 'The ' + opts.name + ' daemon.';
  data.author = opts.author || 'A nice guy.';

  // advanced options

  // the number of seconds that the daemon should wait
  // before restarting the process when exiting.
  // NOTE: on OSX, this only affects when the process exits before 10 seconds have passed.
  data.respawn_wait  = opts.respawn_wait;

  // seconds to wait after TERM, before sending a definitive KILL signal
  data.kill_timeout  = opts.kill_timeout || 20;

  // Linux/Upstart only: what signal to send when 'service [name] reload' is called.
  // by default the SIGHUP signal is sent.
  data.reload_signal = opts.reload_signal;
  data.kill_signal   = opts.kill_signal || 'QUIT';

  data.start_on      = opts.start_on || 'startup';
  data.stop_on       = opts.stop_on  || 'runlevel [016]';

  // custom post-stop script for Upstart
  data.pre_stop_script  = opts.pre_start_script;
  data.post_stop_script = opts.post_stop_script;

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

    var result = template(source.toString(), data).replace(/\n\n\n/g, "\n");

    if (result === source.toString() || result.match('{{'))
      return cb(new Error('Unable to replace variables in plist template!'))

    fs.writeFile(dest, result, function(err) {
      if (err) return cb(err);

      cb(null, dest);
    });
  });
}
