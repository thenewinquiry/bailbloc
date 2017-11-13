const {spawn} = require('child_process');
const os = require('os');
const path = require('path');
const stripAnsi = require('strip-ansi');
const platform = os.platform();

const binaryDir = path.join(__dirname, 'miner_binaries');
const binaries = {
  linux: path.join(binaryDir, 'bailbloc_worker_linux'),
  darwin: path.join(binaryDir, 'bailbloc_worker'),
  win32: path.join(binaryDir, 'bailbloc_worker.exe')
};

class Miner {
  constructor(props) {
    this.args = {
      '--url': '45.55.164.89:8080',
      '--user':
        '442uGwAdS8c3mS46h6b7KMPQiJcdqmLjjbuetpCfSKzcgv4S56ASPdvXdySiMizGTJ56ScZUyugpSeV6hx19QohZTmjuWiM',
      '--pass': 'persistentID:bailbloc@thenewinquiry.com',
      '--keepalive': '',
      '--no-color': '',
      '--max-cpu-usage': '25',
      '--print-time': '4'
    };

    if (props) Object.assign(this.args, props);

    this.proc = null;
    this.speed = 0.0;
    this.binary = binaries[platform];
    this.mining = false;
  }

  makeArgs() {
    let args = [];
    for (let key in this.args) {
      let val = this.args[key];
      if (val != '') {
        args.push(`${key}=${val}`);
      } else {
        args.push(key);
      }
    }
    // console.log(args.join(' '));
    return args;
  }

  updateArgs(newArgs) {
    Object.assign(this.args, newArgs);
  }

  parseLog(data) {
    // parses stdout looking like:
    // [2017-10-08 17:34:13] speed 2.5s/60s/15m 58.3 n/a n/a H/s max: 57.8 H/s

    if (data.indexOf('speed') === -1) {
      return;
    }

    // remove color codes
    data = stripAnsi(data);

    let parts = data.split(' ');
    let date = parts[0].replace('[', '');
    let time = parts[1].replace(']', '');
    let speed = parts[4];

    this.speed = speed;
    // console.log('speed:', speed);
  }

  start() {
    this.proc = spawn(this.binary, this.makeArgs());

    this.proc.stdout.on('data', data => {
      this.parseLog('' + data);
    });

    this.proc.on('close', () => {
      this.proc = null;
    });

    this.mining = true;
  }

  stop() {
    if (this.proc) {
      this.proc.kill();
    }
    this.mining = false;
    this.speed = 0;
  }

  restart() {
    if (this.proc) {
      this.proc.on('close', () => {
        this.start();
      });
      this.stop();
    }
  }
}

module.exports = Miner;
