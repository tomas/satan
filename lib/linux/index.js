var fs      = require('fs'),
    join    = require('path').join,
    which   = require('which');

var init_system = 'sysvinit';

if (which.sync('systemctl')) {
  init_system = 'systemd';
} else if (which.sync('initctl')) {
  init_system = 'upstart';
} 

var plist_template = 'template.plist',
    template_path  = join(__dirname, plist_template);

//////////////////////////////////////////////////////
// helpers

var debug = false;

var log = function(str) {
  if (debug)
    log(str);
}

var temp_path = function(filename) {
  var tempdir = process.env.TMPDIR || '/tmp';
  return join(tempdir, filename);
}

//////////////////////////////////////////////////////
// builder

var Builder = function(opts) {
  this.name   = opts.name;
  this.path   = opts.path;
  this.bin    = opts.bin;
  this.user   = opts.user   || opts.run_as || 'root';

  // this.desc   = opts.desc   || 'The ' + opts.name + ' daemon.';
  // this.author = opts.author || 'A nice guy.';
}

Builder.prototype.generate = function(destination, cb) {
  var self = this;
  fs.readFile(template_path, function(err, plist) {
    if (err) return cb(err);

    var data = plist.toString()
               .replace(/{{name}}/g, self.name)
               .replace(/{{path}}/g, self.path)
               .replace(/{{bin}}/g,  self.bin)
               .replace(/{{user}}/g, self.user);

    if (data === plist.toString() || data.match('{{'))
      return cb(new Error('Unable to replace variables in plist template!'))

    fs.writeFile(destination, data, cb);
  });
}

//////////////////////////////////////////////////////
// the actual hooks
//////////////////////////////////////////////////////

exports.exists = function(name, cb) {
  if (systemd)
  launchd.exists(name, cb);
}

exports.create = function(opts, cb) {
  launchd.remove(opts.name, function(err) {
    if (err) return cb(err);

    var builder     = new Builder(opts),
        temp_script = join(temp_path(opts.name + '.plist'));

    builder.generate(temp_script, function(err) {
      if (err) return cb(err);

      launchd.install(temp_script, cb);
    });
  })
}

exports.destroy = function(name, cb) {
  launchd.remove(name, cb);
}
