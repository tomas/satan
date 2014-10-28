var fs          = require('fs'),
    which       = require('./which'),
    distro_name = require('linus').name;

var res;

// returns downcased, sanitized name of distro,
// e.g. 'elementary_os' instead of Elementary OS
var get_name = function(cb) {
  distro_name(function(err, name) {
    if (err) return cb(err);

    // log('Distro detected: ' + name);
    var lowercase = name.toLowerCase().replace(/ /g, '_');

    cb(null, lowercase);
  })
}

var get_init_location = function() {
  var bin = '';
  try {
    bin = fs.readlinkSync('/sbin/init');
  } catch(e) {
    // console.log('No /sbin/init found. Is this possible?')
  }
  return bin;
}

var detect_init_system = function() {
  var sbin_init = get_init_location();

  if (sbin_init.match('upstart') || which('initctl')) {
    return 'upstart';
  } else if (sbin_init.match('systemd') || which('systemctl')) {
    return 'systemd';
  } else {
    return 'sysvinit';
  }
}

exports.detect = function(cb) {
  if (res)
    return cb(null, res);

  get_name(function(err, name) {
    if (err) return cb(err);

    res = {};
    res.name = name;
    res.init_system = detect_init_system();
    cb(null, res);
  })
}
