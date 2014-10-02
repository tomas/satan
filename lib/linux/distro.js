var which       = require('./which'),
    distro_name = require('linus').name;

var res;

var get_name = function(cb) {

  if (distro_name) // already set up
    return cb(null, distro_name);

  distro_name(function(err, name) {
    if (err) return cb(err);

    log('Distro detected: ' + name);
    var name = (name || 'Linux').replace(/LinuxMint|Elementary OS/, 'Ubuntu');
    var distro = name.toLowerCase().replace(' ', '_');
    distro_name = distro;

    cb(null, distro);
  })
}

var detect_init_system = function() {
  if (which('systemctl')) {
    return 'systemd';
  } else if (which('initctl')) {
    return 'upstart';
  } else {
    return 'sysvinit';
  }
}

exports.detect = function(cb) {
  console.log('executing');

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
