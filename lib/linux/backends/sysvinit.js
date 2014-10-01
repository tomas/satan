var exec   = require('child_process').exec,
    detect = require('../distro').detect,
    join = require('path').join;


var distros = {
  debian: {
    status : '/etc/init.d/$1 status',
    load   : 'update-rc.d $1 defaults',
    unload : 'update-rc.d -f $1 remove',
    path   : '/etc/init.d'
  },
  redhat: {
    status : 'chkconfig $1 status', // TODO: check this, not really sure
    load   : 'chkconfig $1 on',
    unload : 'chkconfig $1 off',
    path   : '/etc/rc.d/init.d'
  },
  suse: {
    status : 'chkconfig --status $1', // TODO: check this, not really sure
    load   : 'chkconfig --add $1',
    unload : 'chkconfig --del $1',
    path   : '/etc/init.d'
  }
};

distros.fedora        = distros.redhat;
distros.ubuntu        = distros.debian;
distros.linuxmint     = distros.debian;
distros.elementary_os = distros.debian;

var run = function(cmd, key, cb) {
  detect(function(err, distro) {
    if (err) return cb(err);

    var distro_conf = distros[distro.name];
    if (!distro_conf)
      return cb(new Error('Unknown distro: ' + distro.name));

    if (cmd == 'start' || cmd == 'stop')
      var command = distro_conf.path + '/' + key + ' ' + cmd; // /etc/init.d/foo-service start
    else
      var command = distro_conf[cmd].replace('$1', key);

    exec(command, cb);
  })
}

exports.name = 'sysvinit';

exports.get_path = function(distro_name, key) {
  var base = distros[distro_name] ? distros[distro_name].path : '/etc/init.d'; // assume default
  return join(base, key); // /etc/init.d/foo-service
}

exports.exists = function(key, cb) {
  run('status', key, function(err, out) {
    if (err) { 
      if (err.message.match(/not found/i)) // TODO: improve this
        return cb(null, false);
      else
        return cb(err);
    }

    return cb(null, true);
  });
}

exports.load = function(key, cb) {
  run('load', key, cb);
}

exports.unload = function(key, cb) {
  run('unload', key, cb);
}

exports.start = function(key, cb) {
  run('start', key, cb);
}

exports.stop = function(key, cb) {
  run('stop', key, cb);
}

exports.reload = function(key, cb) {
  run('unload', key, function(err) {
    // if (err) return cb(err);

    run('load', key, cb);
  });
}

exports.reload_all = function(cb) {
  cb(); // TODO: find a way around this
}