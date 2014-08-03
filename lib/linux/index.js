var fs       = require('fs'),
    join     = require('path').join,
    distro   = require('linus'),
    which    = require('./which'),
    commands = require('./commands'),
    builder  = require('./../builder');

var distros  = commands.distros;

var init_system = 'sysvinit',
    extension   = null;

//////////////////////////////////////////////////////
// helpers

var debug = !!process.env.DEBUG,
    log   = debug ? console.log : function() { };

var setup_distro = function(cb) {

  if (which('systemctl')) {
    init_system = 'systemd';
  } else if (which('initctl')) {
    init_system = 'upstart';
    extension = '.conf';
  } 

  distro.name(function(err, name) {
    if (err) return cb(err);

    log('Distro detected: ' + name);
    var name = (name || 'Linux').replace(/LinuxMint|Elementary OS/, 'Ubuntu');
    var distro = name.toLowerCase().replace(' ', '_');

    cb(null, distro);
  })
}

////////////////////////////////////////////////
// init commands

var unload_remove = function(distro, key, cb) {
  log('Unloading init script.');
  commands.unload_script(distro, key, function(err){
    if (err) return cb(err);

    log('Removing init script.');
    commands.remove_script(distro, key, cb);
  });
}

exports.exists = function(key, cb) {
  setup_distro(function(err, distro) {
    if (err || !distros[distro]) 
      return cb(err || new Error('Unknown distro: ' + distro));

    commands.script_exists(distro, key, cb);
  });
}

exports.create = function(opts, cb) {
  exports.ensure_destroyed(opts.key, function(err, distro) {
    if (err) return cb(err);

    var template_path = __dirname + '/template.' + init_system;

    log('Generating init script from ' + template_path); 
    builder.generate(opts, template_path, extension, function(err, temp_script) {
      if (err) return cb(err);

      log('Setting up init script.');
      commands.install_script(distro, opts.key, temp_script, cb);
    });
  })
}

exports.start = function(key, cb) {
  setup_distro(function(err, distro) {
    if (err || !distros[distro]) 
      return cb(err || new Error('Unknown distro: ' + distro));

    log('Loading init script.');
    commands.load_script(distro, key, cb);
  })
}

exports.stop = function(key, cb) {
  setup_distro(function(err, distro) {
    if (err || !distros[distro]) 
      return cb(err || new Error('Unknown distro: ' + distro));

    log('Loading init script.');
    commands.unload_script(distro, key, cb);
  })
}

// gets distro name, tries to unload, returs error if failed
exports.destroy = function(key, cb) {
  setup_distro(function(err, distro) {
    if (err || !distros[distro]) 
      return cb(err || new Error('Unknown distro: ' + distro));

    unload_remove(distro, key, function(err) {
      cb(err, distro);
    });
  })
}

exports.ensure_destroyed = function(key, cb) {
  this.destroy(key, function(err, distro) {
    if (!err || err.message.match(/unrecognized service|Unknown job/i)) 
      return cb(null, distro);

    cb(err, distro);
  })
}
