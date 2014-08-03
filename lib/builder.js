
var fs   = require('fs'),
    join = require('path').join;

var temp_path = function(filename) {
  var tempdir = process.env.TMPDIR || '/tmp';
  return join(tempdir, filename);
}

var Builder = function(opts) {
  this.name   = opts.name;
  this.path   = opts.path;
  this.bin    = opts.bin;
  this.user   = opts.user   || opts.run_as || 'root';

  this.desc   = opts.desc   || 'The ' + opts.name + ' daemon.';
  this.author = opts.author || 'A nice guy.';
}

Builder.prototype.generate = function(template, extension, cb) {
  var self = this,
      dest = join(temp_path(this.name + extension));

  fs.readFile(template, function(err, data) {
    if (err) return cb(err);

    var str = data.toString()
               .replace(/{{name}}/g, self.name)
               .replace(/{{path}}/g, self.path)
               .replace(/{{bin}}/g,  self.bin)
               .replace(/{{user}}/g, self.user)
               .replace(/{{desc}}/g, self.desc)
               .replace(/{{author}}/g, self.author);

    if (str === data.toString() || str.match('{{'))
      return cb(new Error('Unable to replace variables in plist template!'))

    fs.writeFile(dest, str, function(err) {
      if (err) return cb(err);

      cb(null, dest);
    });
  });
}

module.exports = Builder;