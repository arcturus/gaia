'use strict';

/* jshint node: true */

var utils = require('utils');
var importBuild = require('import-config.js');
var DEBUG = false;

var ContactsAppBuilder = function() {
};

// Set destination directory and application directory
ContactsAppBuilder.prototype.setOptions = function(options) {
  this.stageDir = utils.getFile(options.STAGE_APP_DIR);
  this.appDir = utils.getFile(options.APP_DIR);
  this.gaia = utils.gaia.getInstance(options);
  this.gaia.stageDir = this.stageDir;
  this.gaia.gaiaDir = options.GAIA_DIR;
};

ContactsAppBuilder.prototype.generateManifest = function() {
  var manifestObject = importBuild.generateManifest(this.webapp, this.gaia);
  var file = utils.getFile(this.stageDir.path, 'manifest.webapp');
  var args = DEBUG ? [manifestObject, undefined, 2] : [manifestObject];
  utils.writeContent(file, JSON.stringify.apply(JSON, args));
};

ContactsAppBuilder.prototype.generateAll = function() {
  this.generateManifest();
  importBuild.generateConfig('contacts', '/', this.gaia);
};

ContactsAppBuilder.prototype.execute = function(options, webapp) {
  this.webapp = webapp;
  this.setOptions(options);
  this.generateAll();
};

exports.execute = function(options, webapp) {
  utils.copyToStage(options);
  (new ContactsAppBuilder()).execute(options, webapp);
};
