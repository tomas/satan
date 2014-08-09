var path    = require('path'),
    helpers = require('../helpers'),
    async   = require('async'),
    exec    = require('child_process').exec;
    
var nssm    = path.join(__dirname, 'nssm.exe');

/*

nssm install Jenkins %PROGRAMFILES%\Java\jre7\bin\java.exe
nssm set Jenkins AppParameters -jar slave.jar -jnlpUrl https://jenkins/computer/%COMPUTERNAME%/slave-agent.jnlp -secret redacted
nssm set Jenkins AppDirectory C:\Jenkins
nssm set Jenkins AppStdout C:\Jenkins\jenkins.log
nssm set Jenkins AppStderr C:\Jenkins\jenkins.log
nssm set Jenkins AppStopMethodSkip 6
nssm set Jenkins AppStopMethodConsole 1000
nssm set Jenkins AppThrottle 5000
nssm start Jenkins

*/

exports.install = function(opts, cb) {
  var key  = opts.key,
      bin  = opts.bin;

  if (!key || !bin)
    return cb(new Error('Both key and bin are required.'))

  var bin_name    = path.basename(bin),
      bin_path    = path.dirname(bin);

  var daemon_path = opts.daemon_path || bin_path,
      daemon_bin  = path.join(daemon_path, opts.daemon_name || 'nssm.exe');

  var fx = [
    function(cb) { helpers.ensure_dir(daemon_path, cb) },
    function(cb) { helpers.copy(nssm, daemon_bin, cb) } 
  ];

  var cmds = [
    'install ' + key + ' ' + bin,
    'set ' + key + ' DisplayName ' + '"' + (opts.name || key) + '"'
  ];

  if (opts.args)
    cmds.push('set ' + key + ' AppParameters ' + opts.args);

  if (opts.path)
    cmds.push('set ' + key + ' AppDirectory "' + opts.path + '"');

  if (opts.desc)
    cmds.push('set ' + key + ' Description "' + opts.desc + '"');

  cmds.forEach(function(c) {
    fx.push(function(cb) { 
      exec(daemon_bin + ' ' + c, cb);
    })
  })

  async.series(fx, cb);
}

exports.uninstall = function(key, cb) {
  exec(nssm + ' remove ' + key + ' confirm', cb);
}