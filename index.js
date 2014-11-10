var through = require('through');
var path = require("path");
var esnext = require('esnext');
var transpiler = require('es6-module-transpiler');
var recast     = require('es6-module-transpiler/node_modules/recast');

function compile(file, content) {
  var
    moduleName = null,
    ext = path.extname(file),
    processed = null,
    container = new transpiler.Container({
      resolvers: [new transpiler.FileResolver([process.cwd()])],
      formatter: new transpiler.formatters.commonjs()
    });

  moduleName = file.slice(0, -ext.length).replace(/\\/g, '/');

  var module = new transpiler.Module(file, file, container);

  module.name = moduleName;
  module.src = content;
  container.addModule(module);

  content = recast.print(container.convert().pop()).code;
  file.contents = new Buffer(content);

  try {
    processed = esnext.compile(content, {bare: true}).code;
  } catch (e) {
    console.error(e);
  }
  return processed;
}

function isEsNext (file, ext) {
  return (new RegExp(ext.replace('.', '\\.') + '$')).test(file);
}

module.exports = function (file, opts) {
  if (!isEsNext(file, opts && opts.fileExt || '.es6')) {
    return through();
  }
  var
    data = '',
    write = function(buf) {
      data += buf;
    },

    end = function() {
      var src;
      try {
        src = compile(file, data);
      } catch (error) {
        this.emit('error', error);
      }
      this.queue(src);
      this.queue(null);
    };

  return through(write, end);
};
