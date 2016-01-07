'use strict';

var _ = require('lodash');
var utils = require('./utils');
var file = require('./file');
var mkdirp = require('mkdirp');
var path = require('path');
var dirname = path.dirname;

module.exports = function(dbname, options){
    return new JsonDB(dbname, options);
}

var JsonDB = function(db, options){
    if(!_.isPlainObject(options)) options = {};
    this.options = _.defaultsDeep(options, {
        pretty: false
    });
    this._ = _;
    this.db = utils.jsonFileName(db || 'index');
    this._init();
    this._open();
}

JsonDB.prototype._init = function(){
    mkdirp.sync(dirname(this.db));

    var object = {settings: {ai: 1}, data: []};
    if(!file.exists(this.db)){
        this._set(object);
    }
}

/**
 * Write and Readers
 */

JsonDB.prototype._get = function(){
        return JSON.parse(file.read(this.db));
}

JsonDB.prototype._set = function(contents){
    if(this.options.pretty)
        return file.write(this.db, JSON.stringify(contents, null, '\t'));
    return file.write(this.db, JSON.stringify(contents));

}

/**
 * Connection to file
 */

JsonDB.prototype._open = function(){
    this.get = this._get();
}

JsonDB.prototype._close = function(){
    this._set(this.get);
}

JsonDB.prototype._reopen = function(){
    this._close();
    this._open();
}
JsonDB.prototype.write = JsonDB.prototype._reopen;

/**
 * Manage data
 */

JsonDB.prototype._pushData = function(obj){
    return this.get.data.push(obj);
}

/**
 * Single functions
 */

JsonDB.prototype._createOne = function(obj, write){
    if(!_.isBoolean(write)) write = true;
    if(!_.isPlainObject(obj)) return false;

    var created = _.assign(obj, {
        id: this.get.settings.ai++
    });
    this._pushData(created);

    if(write) this._reopen();
    return created;
}

JsonDB.prototype._createMany = function(objs, write){
    if(!_.isBoolean(write)) write = true;
    if(!_.isArray(objs)) return false;

    var createdArr = [];
    _.forEach(objs, function(obj){
        var created = this._createOne(obj, false);
        createdArr.push(created);
    }.bind(this));

    if(write) this._reopen();
    return createdArr;
}

JsonDB.prototype._deleteOne = function(query, write){
    if(!_.isBoolean(write)) write = true;
    if(_.isNumber(query)) query = {id: query};

    var deleted = _.findWhere(this.get.data, query);
    if(deleted) _.remove(this.get.data, {id: deleted.id});

    if(write) this._reopen();
    return deleted;
}

JsonDB.prototype._deleteMany = function(query, write){
    if(!_.isBoolean(write)) write = true;

    if(_.isArray(query)){
        _.forEach(query, function(_query){
            if(!_.isPlainObject(_query)) _query = {id: _query};
            _.remove(this.get.data, _query);
        }.bind(this));
    } else {
        _.remove(this.get.data, query);
    }

    if(write) this._reopen();
    return true;
}

JsonDB.prototype._updateOne = function(query, update, identical, write){
    if(!_.isBoolean(write)) write = true;
    if(_.isNumber(query)) query = {id: query};

    var match = _.findWhere(this.get.data, query);
    if(match){
        if(identical){
            var index = _.indexOf(this.get.data, match);
            this.get.data[index] = _.assign(update, {id: match.id});
        } else {
            _.assign(match, update);
        }
    }

    if(write) this._reopen();
    return match || false;
}

JsonDB.prototype._updateMany = function(query, update, identical, write){
    if(!_.isBoolean(write)) write = true;

    if(_.isPlainObject(query)){
        var match = _.where(this.get.data, query);
        if(match){
            _.forEach(match, function(doc){
                if(identical){
                    var index = _.indexOf(this.get.data, doc);
                    this.get.data[index] = _.assign(update, {id: doc.id});
                } else {
                    _.assign(doc, update);
                }
            }.bind(this));
        }
    }

    if(_.isArray(query)){
        _.forEach(query, function(_query){
            if(_.isNumber(_query)) {
                return this._updateOne(_query, update, identical, false);
            } else {
                return this._updateMany(_query, update, identical, false);
            }
        }.bind(this));
    }

    if(_.isFunction(query)){
        var match = _.filter(this.get.data, query);
        return this._updateMany(match, update, identical, false);
    }

    if(write) this._reopen();
    return match || false;
}

JsonDB.prototype._findOne = function(query){
    if(_.isNumber(query)) query = {id: query};

    return _.findWhere(this.get.data, query);
}

JsonDB.prototype._findMany = function(query){
    if(_.isNumber(query)) query = {id: query};

    if(_.isArray(query)){
        var ret = [];
        _.forEach(query, function(_query){
            if(_.isNumber(query)) query = {id: query};
            ret.push(this._findMany(query, false));
        }.bind(this));
        return _.flattenDeep(ret);
    }

    if(_.isFunction(query)){
        return _.filter(this.get.data, query);
    }

    return _.where(this.get.data, query);
}

JsonDB.prototype._findLast = function(){
    return _.last(this.get.data);
}


/**
 * Collection functions
 */

JsonDB.prototype.create = function(objs){
    if(_.isFunction(objs))
        objs = objs();

    if(_.isPlainObject(objs))
        return this._createOne(objs);

    if(_.isArray(objs))
        return this._createMany(objs);

    return false;
}

JsonDB.prototype.delete = function(query){
    if(_.isNumber(query))
        return this._deleteOne(query);

    return this._deleteMany(query);
}

JsonDB.prototype.update = function(query, update, identical){
    if(_.isNumber(query))
        return this._updateOne(query, update, identical);

    return this._updateMany(query, update, identical);
}

JsonDB.prototype.find = function(query){
    return this._findMany(query);
}

JsonDB.prototype.findOne = function(query){
    return this._findOne(query);
}

JsonDB.prototype.save = function(objs, identical, write){
    if(!_.isBoolean(write)) write = true;
    if(!_.isBoolean(identical)) identical = false;


    if(_.isFunction(objs)) objs = objs();
    if(_.isArray(objs)){
        _.forEach(objs, function(obj){
            return this.save(obj, identical, false)
        }, this);
    }
    if(_.isPlainObject(objs)){
        var obj = objs;
        if(obj.id){
            var match = this.findOne(obj.id);
            if(match){
                return this.update(match, obj, identical);
            }
        }
        return this.create(obj);
    }

    if(write) this._reopen();
}

JsonDB.prototype.chain = function(){
    return _(this.get.data).chain();
}

JsonDB.prototype.getLastInsertId = function(){
    return this.get.settings.ai -1;
}

JsonDB.prototype.findLast = function(){
    return this._findLast();
}

