'use strict';

const Command = require('common-bin');
const path = require('path');
const pkg = require('../package.json');

class MainCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);
    this.usage = 'Usage: ghost-to-typlog --input [file]';

    // load entire command directory
    this.load(path.join(__dirname, 'command'));
    this.yargs.version(pkg.version);
  }
}

module.exports = MainCommand;
