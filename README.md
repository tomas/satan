Satan
=====

Make daemons out of your processes at will. Then destroy them forever.

Example
-------

    var satan = require('satan');

    var opts = {
      bin  : '/usr/bin/node',                           // full path to bin
      args : 'app.js -p 8001',                          // command line arguments
      path : '/home/tomas/code/secret-project',         // working directory
      key  : 'secret-project'                           // for identifying the service
    }

    satan.create(opts, function(err) {
      if (err)
        return console.log('Failed to create daemon.')

      console.log('Success! Launching process...');
      satan.start(opts.key, function(err) {
        console.log(err || 'Running.')
      });
    })

You can create a daemon out of any process, of course. Just point the bin to where it should.

    var opts = {
      bin  : '/path/to/my/daemon.py',
      key  : 'com.example.daemon'
    }

    satan.create(opts, function(err) {
      console.log(err || 'Let me do your bidding, master.');
    });

All arguments are optional, except for `bin` and `key`. In Linux, you can also pass both `name` and `desc` options, which will be inserted in the generated init script. Satan support sysinitv, upstart and systemd and automatically detects which one your Linux uses.

    var opts = {
      bin  : 'puma -p 8000',
      path : '/home/tomas/apps/awesome',
      key  : 'awesome-app',
      name : 'Awesome App',
      desc : 'My awesome app.'
    }

    satan.ensure_created(opts, function(err) {
      // in this case, satan will not return an error if the service already exists.
    });

Windows
-------

To daemonize your processes in Windows, Satan uses a nitfy tool call `nssm` (e.g. the 'non sucking service manager') to spawn and keep your process up and running. So, when calling `create`, Satan basically makes a copy of the `nssm.exe` binary, and creates a new system service that points to it. 

By default the `nssm.exe` binary is copied to the same path as your bin, but you can use a custom location for the nssm.exe binary by passing a `daemon_path` option, like this:

    var opts = {
      bin  : 'npm start',
      path : 'C:\Users\tomas\apps\static-http'
      key  : 'StaticHTTP',
      name : 'Static HTTP Server',
      desc : 'Serves static files from my Public folder to local network users.',
      daemon_path : path.join(process.env.WINDIR, 'system32')
    }

If you also want to use a custom name for .exe, just include a `daemon_name` option.

    opts.daemon_name = 'awesome-daemon.exe';

Now, if you already _have_ a Windows Service executable, and don't need to use the `nssm.exe` method, set the `daemon_path` option to `null` or `false` when creating the daemon.

    var opts = {
      daemon_path : null,
      bin  : 'C:\IBN\Profiles\QRDX\corpsvc.exe',
      key  : 'CorporateService',
      name : 'Very Corporate Service',
      desc : 'Reminds users that they are part of a very corporate environment.'
    }

    satan.create(opts, cb);

API
---

## satan.create(opts, cb)

Creates a new daemon. Returns an error if it already exists.

## satan.ensure_created(opts, cb)

Creates a new daemon. Does not return an error if it exists.

## satan.start(daemon_key, cb)

Stats a daemon. Uses the daemon's key for identifying it. Callsback an error if it failed.

## satan.stop(daemon_key, cb)

Stops a daemon. Uses the daemon's key for identifying it. Callsback an error if it failed.

## satan.destroy(daemon_key, cb)

Destroys an existing daemon. Returns an error if not found.

## satan.ensure_destroyed(daemon_key, cb)

Destroys an existing daemon. Does not return an error if not found.

Options
-------

On creation:

    - `key`: Identifier for the service. OSX users should use the `com.example.app` notation.
    - `bin`: Absolute or relative path to the executable. If relative, make sure to include the `path` option.
    - `args`: Additional arguments to pass to the bin. Optional. Not an array, just a string. 
    - `path`: Absolute path to set as the current working directory before calling the bin. Somewhat optional (read the `bin` part above).
    - `name`: More descriptive name for your daemon, to be included in the init script or the Windows Services list.
    - `desc`: Even more descriptive text for your daemon. Not necessary, but makes it look nicer.

Windows-only options:

    - daemon_path: Custom path to use for the `nssm.exe` binary  when setting up your daemon. If `null` or `false`, Satan assumes your bin can run as a Windows Service and will not copy any additional binaries.
    - daemon_name: Custom name to use for the `nssm.exe` executable. Optional.

Final part
----------

Written by Tomás Pollak.
(c) Fork, Ltd. MIT License.