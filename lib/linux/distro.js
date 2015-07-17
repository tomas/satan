var fs          = require('fs'),
    which       = require('./which'),
    distro_name = require('linus').name;

var res;

// returns downcased, sanitized name of distro,
// e.g. 'elementary_os' instead of Elementary OS
function get_name(cb) {
  distro_name(function(err, name) {
    if (err) return cb(err);

    // log('Distro detected: ' + name);
    var lowercase = name.toLowerCase().replace(/ /g, '_');

    cb(null, lowercase);
  })
}

function get_init_location() {
  var bin = '';
  try {
    bin = fs.readlinkSync('/sbin/init');
  } catch(e) {
    // console.log('No /sbin/init found. Is this possible?')
  }
  return bin;
}

function detect_init_system() {
  // var sbin_init = get_init_location();

  if (fs.existsSync('/run/systemd/system')) {
    return 'systemd'
  } else if (which('initctl')) { // sbin_init.match('upstart')
    return 'upstart';
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
