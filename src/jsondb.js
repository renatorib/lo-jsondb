'use strict';

var _ = require('lodash');
var utils = require('./utils');
var file = require('./file');
var mkdirp = require('mkdirp');
var path = require('path');
var dirname = path.dirname;

var instance = function(dbname, options){
    return new JsonDB(dbname, options);
}
instance.collection = instance;
instance.pretty = function(dbname, options){
    if(!_.isPlainObject(options)) options = {};
    options = _.defaultsDeep(options, {pretty: true});
    return new JsonDB(dbname, options);
}
instance.single = function(dbname, options){
    if(!_.isPlainObject(options)) options = {};
    options = _.defaultsDeep(options, {single: true});
    return new JsonDB(dbname, options);
}
instance.single.pretty = function(dbname, options){
    if(!_.isPlainObject(options)) options = {};
    options = _.defaultsDeep(options, {pretty: true, single: true});
    return new JsonDB(dbname, options);
}

module.exports = instance;

var JsonDB = function(db, options){
    if(!_.isPlainObject(options)) options = {};
    this.options = _.defaultsDeep(options, {
        pretty: false,
        single: false
    });
    this._ = _;
    this.db = utils.jsonFileName(db || 'index');
    this._init();
    this._open();
}

JsonDB.prototype._init = function(){
    mkdirp.sync(dirname(this.db));
    var object;
    if(this.options.single){
        object = {};
    } else {
        object = {settings: {ai: 1}, data: []};
    }
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
    this.object = this._get();
}

JsonDB.prototype._close = function(){
    this._set(this.object);
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
    if(this.object.data === undefined) return false;
    return this.object.data.push(obj);
}

/**
 * Internal functions
 */

JsonDB.prototype._createOne = function(obj, write){
    if(!_.isBoolean(write)) write = true;
    if(!_.isPlainObject(obj)) return false;

    var toassign = {};
    if(this.object.settings.ai){
        toassign.id = this.object.settings.ai++
    }

    var created = _.assign(obj, toassign);
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
    if(this.object.data === undefined) return false;
    if(!_.isBoolean(write)) write = true;
    if(_.isNumber(query)) query = {id: query};

    var deleted = _.findWhere(this.object.data, query);
    if(deleted) _.remove(this.object.data, {id: deleted.id});

    if(write) this._reopen();
    return deleted;
}

JsonDB.prototype._deleteMany = function(query, write){
    if(this.object.data === undefined) return false;
    if(!_.isBoolean(write)) write = true;

    if(_.isArray(query)){
        _.forEach(query, function(_query){
            if(!_.isPlainObject(_query)) _query = {id: _query};
            _.remove(this.object.data, _query);
        }.bind(this));
    } else {
        _.remove(this.object.data, query);
    }

    if(write) this._reopen();
    return true;
}

JsonDB.prototype._updateOne = function(query, update, identical, write){
    if(this.object.data === undefined) return false;
    if(!_.isBoolean(write)) write = true;
    if(_.isNumber(query)) query = {id: query};

    var match = _.findWhere(this.object.data, query);
    if(match){
        if(identical){
            var index = _.indexOf(this.object.data, match);
            this.object.data[index] = _.assign(update, {id: match.id});
        } else {
            _.assign(match, update);
        }
    }

    if(write) this._reopen();
    return match || false;
}

JsonDB.prototype._updateMany = function(query, update, identical, write){
    if(this.object.data === undefined) return false;
    if(!_.isBoolean(write)) write = true;

    if(_.isPlainObject(query)){
        var match = _.where(this.object.data, query);
        if(match){
            _.forEach(match, function(doc){
                if(identical){
                    var index = _.indexOf(this.object.data, doc);
                    this.object.data[index] = _.assign(update, {id: doc.id});
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
        var match = _.filter(this.object.data, query);
        return this._updateMany(match, update, identical, false);
    }

    if(write) this._reopen();
    return match || false;
}

JsonDB.prototype._findOne = function(query){
    if(this.object.data === undefined) return false;
    if(query === undefined) query = {};
    if(_.isNumber(query)) query = {id: query};

    return _.findWhere(this.object.data, query);
}

JsonDB.prototype._findMany = function(query){
    if(this.object.data === undefined) return false;
    if(query === undefined) query = {};
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
        return _.filter(this.object.data, query);
    }

    return _.where(this.object.data, query);
}

JsonDB.prototype._findManyAnd = function(query, fn){
    var find = this._findMany(query);
    return fn(find);
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

JsonDB.prototype.findAll = function(query){
    return this.find({});
}

JsonDB.prototype.findFirst = function(query){
    return this._findManyAnd(query, _.first);
}

JsonDB.prototype.findLast = function(query){
    return this._findManyAnd(query, _.last);
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
    return _(this.object.data).chain();
}

JsonDB.prototype.getLastInsertId = function(){
    return this.object.settings.ai -1;
}

JsonDB.prototype.setProp = function(prop, value){
    var deepAccess = this.object;
    var propArr = prop.split(".");
    while(propArr.length){
        var deepProp = propArr.shift();
        if(deepAccess[deepProp] === undefined){
            deepAccess[deepProp] = {};
        }
        if(propArr.length == 0){
            deepAccess[deepProp] = value;
        } else {
            deepAccess = deepAccess[deepProp];
        }
    };
    this.write();
}

JsonDB.prototype.getProp = function(prop){
    var deepAccess = this.object;
    var propArr = prop.split(".");
    while(propArr.length){
        deepAccess = deepAccess[propArr.shift()]
    };
    return deepAccess;
}
