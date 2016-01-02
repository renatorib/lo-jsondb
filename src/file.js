'use strict';

var _fs = require("fs");
var _path = require("path");

var file = {
    write: function(path, contents) {
        return _fs.writeFileSync(path, contents);
    },
    read: function(path) {
        return _fs.readFileSync(path, 'utf8');
    },
    exists: function(path){
        try {
            _fs.accessSync(path);
            return true;
        } catch(ex) {
            return false;
        }
    },
    stat: function(path) {
        return _fs.statSync(path);
    }
}

module.exports = file;
