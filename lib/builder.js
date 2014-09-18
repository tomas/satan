
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

  // wait defines the number of seconds that the daemon should wait 
  // before restarting the process when exiting. defaults to five.
  // launchdaemon sets this to 10 by default. the others just restart immediately.
  data.wait   = opts.wait   || 5;

  data.desc   = opts.desc   || 'The ' + opts.name + ' daemon.';
  data.author = opts.author || 'A nice guy.';
  
  return data;
}

exports.generate = function(data, template_path, extension, cb) {
  var data = check(data),
      dest = join(temp_path(data.key + extension || ''));

  fs.readFile(template_path, function(err, source) {
    if (err) return cb(err);

    var result = template(source.toString(), data);

    if (result === source.toString() || result.match('{{'))
      return cb(new Error('Unable to replace variables in plist template!'))

    fs.writeFile(dest, result, function(err) {
      if (err) return cb(err);

      cb(null, dest);
    });
  });
}
