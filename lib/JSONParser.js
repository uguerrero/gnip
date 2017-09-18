var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var Parser = function(parser, separator) {
    EventEmitter.call(this);

    this.buffer = '';
    this.parser = parser;
    this.separator = separator || "\r\n";
};

util.inherits(Parser, EventEmitter);

Parser.prototype.receive = function(buffer) {
    this.buffer += buffer.toString('utf8');
    var index, jsonStr, json;

    var self = this;

    var emitObject = function(str) {
        try {
            json = self.parser.parse(jsonStr);
            try {
                self.emit('object', json);
            } catch (err) {
                throw err;
            }
        } catch (err) {
            if (err.message.startsWith("Unexpected token") && jsonStr.startsWith("{")) {
                if (jsonStr.split('\r\n').length > 1) {
                    jsonStr.split('\r\n').forEach(jsonStr2 => {
                        emitObject(jsonStr2);
                    });
                } else if (jsonStr.split('\n').length > 1) {
                    jsonStr.split('\n').forEach(jsonStr2 => {
                        emitObject(jsonStr2);
                    });
                }
            } else {
                self.emit('error', new Error('Error parsing JSON: ' + err.message + '.\n' + jsonStr));
            }
        }

    }

    while ((index = this.buffer.indexOf(this.separator)) > -1) {
        jsonStr = this.buffer.slice(0, index);
        this.buffer = this.buffer.slice(index + this.separator.length);
        if (jsonStr.length > 0) {
            emitObject(jsonStr);
        }
    }
};

module.exports.JSONParser = Parser;
