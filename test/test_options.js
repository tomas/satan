var should = require('should'),
    sinon  = require('sinon');
    distro = require('../lib/linux/distro'),
    satan  = require('..');

describe('generating', function() {

  var prev_platform,
      detect_stub;

  function set_platform(os, init_system) {
    prev_platform = process.platform;
    process.platform = os;

    if (init_system) {
      detect_stub = sinon.stub(distro, 'detect', function(cb) {
        var obj = { name: 'Ubuntu', init_system: init_system };
        cb(null, obj);
      })
    }
  }

  function reset_platform() {
    process.platform = prev_platform;
    prev_platform = null;

    detect_stub.restore();
    detect_stub = null;
  }

  describe('linux upstart', function() {

    before(function() {
      set_platform('linux', 'upstart');
    })

    after(reset_platform);

    it('key is required', function(done) {
      var opts = { bin: '/bin/true' };

      satan.test_create(opts, function(err) {
        err.should.be.a.Error;
        err.message.should.containEql('Required options');
        done();
      })
    })

    it('defaults are set to their defaults', function(done) {
      var opts = { key: 'test-foo', bin: '/bin/true' };

      satan.test_create(opts, function(err, res) {
        res.toString().should.containEql('start on startup');
        res.toString().should.containEql('stop on runlevel [016]');
        res.toString().should.containEql('kill signal QUIT');
        res.toString().should.containEql('kill timeout 20');
        done()
      })
    })

    it('optional paths are optional', function(done) {
      var opts = { key: 'test-foo', bin: '/bin/true' };

      satan.test_create(opts, function(err, res) {
        res.toString().should.not.containEql('user');
        res.toString().should.not.containEql('chdir');
        res.toString().should.not.containEql('env');
        res.toString().should.not.containEql('post-stop exec sleep'); // respawn_wait
        res.toString().should.not.containEql('reload signal');

        // pre/post start/stop scripts
        res.toString().should.not.containEql('pre-start');
        res.toString().should.not.containEql('post-start');
        res.toString().should.not.containEql('pre-stop');
        res.toString().should.not.containEql('post-stop');
        done()
      })
    })

    it('path is set when passed', function(done) {
      var opts = { key: 'test-foo', bin: '/bin/true', path: '/tmp' };

      satan.test_create(opts, function(err, res) {
        res.toString().should.containEql('chdir /tmp');
        done()
      })
    })

    it('respawn wait too', function(done) {
      var opts = { key: 'test-foo', bin: '/bin/true', respawn_wait: 9 };

      satan.test_create(opts, function(err, res) {
        res.toString().should.containEql('post-stop exec sleep 9');
        done()
      })
    })

    it('kill timeout is set', function(done) {
      var opts = { key: 'test-foo', bin: '/bin/true', kill_timeout: 12 };

      satan.test_create(opts, function(err, res) {
        res.toString().should.containEql('kill timeout 12');
        done()
      })
    })

  })

  describe('linux systemd', function() {

    before(function() {
      set_platform('linux', 'systemd');
    })

    after(function() {
      reset_platform();
    })

    it('key is required', function(done) {
      var opts = { bin: '/bin/true' };

      satan.test_create(opts, function(err) {
        err.should.be.a.Error;
        err.message.should.containEql('Required options');
        done();
      })
    })

    it('defaults are set to their defaults', function(done) {
      var opts = { key: 'test-foo', bin: '/bin/true' };

      satan.test_create(opts, function(err, res) {
        res.toString().should.containEql('After=network.target');
        res.toString().should.containEql('WantedBy=multi-user.target');
        res.toString().should.containEql('Restart=always');
        res.toString().should.containEql('TimeoutStopSec=20'); // kill timeout
        res.toString().should.containEql('KillSignal=QUIT'); // kill timeout
        done()
      })
    })

    it('optional paths are optional', function(done) {
      var opts = { key: 'test-foo', bin: '/bin/true' };

      satan.test_create(opts, function(err, res) {
        res.toString().should.not.containEql('User=');
        res.toString().should.not.containEql('WorkingDirectory=');
        res.toString().should.not.containEql('Environment=');
        res.toString().should.not.containEql('RestartSec='); // respawn_wait
        done()
      })
    })

    it('path is set when passed', function(done) {
      var opts = { key: 'test-foo', bin: '/bin/true', path: '/tmp' };

      satan.test_create(opts, function(err, res) {
        res.toString().should.containEql('WorkingDirectory=/tmp');
        done()
      })
    })

    it('respawn wait too', function(done) {
      var opts = { key: 'test-foo', bin: '/bin/true', respawn_wait: 9 };

      satan.test_create(opts, function(err, res) {
        res.toString().should.containEql('RestartSec=9');
        done()
      })
    })

    it('kill timeout is set', function(done) {
      var opts = { key: 'test-foo', bin: '/bin/true', kill_timeout: 12 };

      satan.test_create(opts, function(err, res) {
        res.toString().should.containEql('TimeoutStopSec=12');
        done()
      })
    })
  })
})
