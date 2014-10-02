var fs       = require('fs'),
    join     = require('path').join,
    exec     = require('child_process').exec,
    whenever = require('whenever'),
    distro   = require('./distro'),
    copy     = require('../helpers').copy,
    builder  = require('./../builder');

var backends = whenever('*', __dirname + '/backends');

//////////////////////////////////////////////////////
// helpers

var debug = !!process.env.DEBUG,
    log   = debug ? console.log : function() { };

////////////////////////////////////////////////
// init commands

var get_backend = function(distro) {
  return backends[distro.init_system];
}

var call_backend = function(command, key, cb) {
  distro.detect(function(err, distro) {
    if (err) return cb(err);

    var backend = get_backend(distro);
    log('Running ' + command + ' in ' + backend.name);
    backend[command](key, cb);
  })
}

var build = function(opts, cb) {
  distro.detect(function(err, distro) {
    if (err) return cb(err);

    var template_path = __dirname + '/template.' + distro.init_system,
        extension     = distro.init_system == 'upstart' ? '.conf' : null;

    log('Generating init script from ' + template_path);
    builder.generate(opts, template_path, extension, function(err, file) {
      cb(err, file, distro);
    });

  })
}

var build_install = function(opts, cb) {
  build(opts, function(err, temp_script, distro) {
    if (err) return cb(err);

    log('Setting up init script.');
    install_script(distro, opts.key, temp_script, function(err) {
      if (err) return cb(err);

      call_backend('reload', opts.key, cb);
    });
  });
}

var unload_remove = function(key, cb) {
  log('Unloading init script: ' + key);
  call_backend('unload', key, function(err) {
    if (err) return cb(err);

    remove_script(key, function(err) {
      // if (err) return cb(err);

      call_backend('reload_all', cb);
    });
  });
}

var install_script = function(distro, key, file, cb) {
  var backend = get_backend(distro),
      target  = backend.get_path(distro.name, key);

  log('Copying script to ' + target);
  copy(file, target, cb);
}

var remove_script = function(key, cb) {
  distro.detect(function(err, distro) {
    if (err) return cb(err);

  var backend = get_backend(distro),
      target  = backend.get_path(distro.name, key);

    fs.exists(target, function(exists) {
      if (!exists) return cb();

      log('Removing file: ' + target);
      fs.unlink(target, cb);
    })
  })
}

exports.exists = function(key, cb) {
  call_backend('exists', key, cb);
}

exports.test_create = function(opts, cb) {
  build(opts, function(err, file) {
    if (err) return cb(err);

    var res = fs.readFileSync(file);
    fs.unlinkSync(file);
    cb(null, res);
  });
}

exports.create = function(opts, cb) {
  build_install(opts, cb);
}

exports.start = function(key, cb) {
  call_backend('start', key, cb);
}

exports.stop = function(key, cb) {
  call_backend('stop', key, cb);
}

exports.ensure_stopped = exports.stop;

// checks if exists, if yes, tries to unload, returs error if failed
exports.destroy = function(key, cb) {
  this.exists(key, function(err, exists) {
    if (err || !exists)
      return cb(new Error('Service not found.'));

    unload_remove(key, cb);
  })
}

exports.ensure_created = function(opts, cb) {
  exports.ensure_destroyed(opts.key, function(err) {
    if (err) return cb(err);

    build_install(opts, cb);
  })
}

exports.ensure_destroyed = function(key, cb) {
  this.destroy(key, function(err) {
    if (!err || err.message.match(/not found/i))
      return cb();

    cb(err);
  })
}
