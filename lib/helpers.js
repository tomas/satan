var fs   = require('fs'),
    path = require('path');

exports.ensure_dir = function(dir, cb) {
  fs.exists(dir, function(exists) {
    if (exists) return cb();

    fs.mkdir(dir, cb);
  });
}

exports.copy = function(source, target, cb) {

  fs.stat(target, function(err, stat) {
    if (stat && stat.isDirectory())
      target = path.join(target, path.basename(source));

    var is  = fs.createReadStream(source),
        os  = fs.createWriteStream(target),
        out = 0;

    var done = function(err) {
      if (out++ > 0) return;
      cb(err);
    };

    is.on('end', done);
    is.on('error', done);
    os.on('error', done);

    is.pipe(os);
  })

};

// don't really know why I'm not using rename
exports.move = function(source, target, cb) {
  exports.copy(source, target, function(err) {
    if (err) return cb(err);
    
    fs.unlink(source, cb);
  })
}
