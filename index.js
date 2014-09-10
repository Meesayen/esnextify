var through = require('through');
// var convert = require('convert-source-map');
var path = require("path");
var esnext = require('esnext');
var Compiler = require('es6-module-transpiler').Compiler;

function compile(file, content) {
  var
    moduleName = null,
    ext = path.extname(file),
    compiler,
    processed = null;

  moduleName = file.slice(0, -ext.length).replace(/\\/g, '/');

  compiler = new Compiler(String(content), moduleName, {});

  content = compiler['toCJS'].call(compiler);
  file.contents = new Buffer(content);

  try {
    processed = esnext.compile(content, {bare: true}).code;
  } catch (e) {
    // log.error('%s\n  at %s', e.message, file.originalPath);
  }
  // var comment = convert
  //     .fromJSON(compiled.v3SourceMap)
  //     .setProperty('sources', [ file ])
  //     .toComment();
  return processed;
}

function isEsNext (file) {
  return /\.es6$/.test(file);
}

module.exports = function (file) {
  if (!isEsNext(file)) {
    return through();
  }
  var data = '';
  return through(write, end);

  function write(buf) {
    data += buf;
  }

  function end() {
    var src;
    try {
      src = compile(file, data);
    } catch (error) {
      this.emit('error', error);
    }
    this.queue(src);
    this.queue(null);
  }
};
