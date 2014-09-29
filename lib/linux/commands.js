var fs   = require('fs'),
    join = require('path').join,
    copy = require('../helpers').copy,
    exec = require('child_process').exec;

var debug = process.env.DEBUG;

var distros = {
  debian: {
    load: 'update-rc.d $1 defaults',
    unload: 'update-rc.d -f $1 remove',
    status: '/etc/init.d/$1 status',
    path: '/etc/init.d'
  },
  ubuntu: {
    load: 'service $1 start',
    unload: 'service $1 stop',
    status: 'service $1 status',
    path: '/etc/init',
    extension: '.conf'
  },
  redhat: {
    load: 'chkconfig $1 on',
    unload: 'chkconfig $1 off',
    status: 'chkconfig $1 status', // TODO: check this, not really sure
    path: '/etc/rc.d/init.d'
  },
  suse: {
    load: 'chkconfig --add $1',
    unload: 'chkconfig --del $1',
    status: 'chkconfig --status $1', // TODO: check this, not really sure
    path: '/etc/init.d'
  }
};

distros.fedora        = distros.redhat;
distros.linuxmint     = distros.ubuntu;
distros.elementary_os = distros.ubuntu;

/////////////////////////////////////////////////
// helpers
/////////////////////////////////////////////////

var log = function(str){
  if (debug)
    console.log(str);
}

var run_init_command = function(cmd, distro, key, cb) {
  var distro_conf = distros[distro];
  var command = distro_conf[cmd].replace('$1', key);
  log('Running command: ' + command);;
  exec(command, cb);
}

var get_init_script_path = function(distro, key) {
  var init_path = distros[distro].path,
      file = join(init_path, key);

  if (distros[distro].extension)
    file = file + distros[distro].extension;

  return file;
};

exports.script_exists = function(distro, key, cb) {
  run_init_command('status', distro, key, function(err, out) {
    if (err) {
      if (err.message.match(/unrecognized service|not-found/))
        return cb(null, false);
      else
        return cb(err);
    }

    cb(null, true);
  });
}

exports.install_script = function(distro, key, file, cb) {
  var target = get_init_script_path(distro, key);
  copy(file, target, cb);
}

exports.load_script = function(distro, key, cb) {
  run_init_command('load', distro, key, cb);
};

exports.unload_script = function(distro, key, cb) {
  run_init_command('unload', distro, key, function(err) {
    if (err && !err.message.match(/Unknown instance|not loaded/)) // not running
      return cb(err);

    cb();
  });
};

exports.remove_script = function(distro, key, cb) {
  var target = get_init_script_path(distro, key);

  fs.exists(target, function(exists) {
    if (!exists) return cb();

    fs.unlink(target, cb);
  })
};

exports.distros = distros;
