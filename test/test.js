var expect = require("chai").expect;
var assert = require("chai").assert;
var jsondb = require('../index.js');
var file = require('../src/file.js');
var fs = require('fs');

describe("Constructor", function(){

    it("Settings and Data", function(){
        var test = jsondb('test');
        expect(test.get).to.be.an('object');
        expect(test.get.settings).to.be.an('object');
        expect(test.get.data).to.be.an('array');
        fs.unlinkSync('test.json');
    });

});

describe("Create", function(){

    it(".create(Object): One", function(){
        var test = jsondb('test');
        test.create({foo: 'bar', bar: 'foo'});
        expect(test.get.data[0].bar).equal('foo');
        expect(test.get.settings.ai).equal(2);
        fs.unlinkSync('test.json');
    });

    it(".create(Array): Many", function(){
        var test = jsondb('test');
        test.create([{foo: 'bar'}, {foo: 'foo'}]);
        expect(test.get.data[0].foo).equal('bar');
        expect(test.get.data[1].foo).equal('foo');
        fs.unlinkSync('test.json');
    });

    it(".create(Function)", function(){
        var test = jsondb('test');
        test.create(function(){
            return {foo: 'bar'};
        });
        test.create(function(){
            return [{bar: 'foo'}, {far: 'boo'}];
        });
        expect(test.get.data[0].foo).equal('bar');
        expect(test.get.data[1].bar).equal('foo');
        expect(test.get.data[2].far).equal('boo');
        fs.unlinkSync('test.json');
    });


    var test = jsondb('test');
    fs.unlinkSync('test.json');
});

describe("Delete", function(){

    it(".delete(Object): Many", function(){
        var test = jsondb('test');
        test.create([{a: 'b', b: 1}, {a: 'c', b: 1}, {a: 'd', b: 1}, {a: 'e', b: 2}]);
        test.delete({b: 1});
        expect(test.get.data.length).equal(1);
        fs.unlinkSync('test.json');
    });

    it(".delete(Int): One", function(){
        var test = jsondb('test');
        test.create([{a: 'b'}, {a: 'c'}]);
        test.delete(2);
        expect(test.get.data.length).equal(1);
        expect(test.get.data[0].a).equal('b');
        fs.unlinkSync('test.json');
    });

    it(".delete(Array): Many", function(){
        var test = jsondb('test');
        test.create([{a: 'b'}, {a: 'c'}, {a: 'd'}]);
        test.delete([1, 3]);
        expect(test.get.data.length).equal(1);
        expect(test.get.data[0].a).equal('c');
        fs.unlinkSync('test.json');

        var test = jsondb('test');
        test.create([{a: 'b', b: 'a'}, {a: 'c'}, {a: 'd'}]);
        test.delete([{b: 'a'}, {a: 'd'}]);
        expect(test.get.data.length).equal(1);
        expect(test.get.data[0].a).equal('c');
        fs.unlinkSync('test.json');
    });

    it(".delete(Function): Many", function(){
        var test = jsondb('test');
        test.create([{a: 'b'}, {b: 'c'}, {a: 'd'}]);
        test.delete(function(doc){
            return doc.a == 'b' || doc.a == 'd'
        });
        expect(test.get.data.length).equal(1);
        expect(test.get.data[0].b).equal('c');
        fs.unlinkSync('test.json');
    });

});

describe("Update", function(){

    it(".update(Object): Many", function(){
        var test = jsondb('test');
        test.create([{b: 1, a: 'a'}, {b: 1, a: 'b'}]);
        test.update({b: 1}, {a: 'c'});
        expect(test.get.data[0].a).equal('c');
        expect(test.get.data[1].a).equal('c');
        fs.unlinkSync('test.json');
    });

    it(".update(Object, true): Many - Identical", function(){
        var test = jsondb('test');
        test.create([{b: 1, a: 'a'}, {b: 1, a: 'b'}]);
        test.update({b: 1}, {a: 'c'}, true);
        expect(test.get.data[0].a).equal('c');
        expect(test.get.data[1].b).equal(undefined);
        fs.unlinkSync('test.json');
    });

    it(".update(Id, true): One", function(){
        var test = jsondb('test');
        test.create({b: 1, a: 'a'});
        test.update(1, {a: 'c'});
        expect(test.get.data[0].a).equal('c');
        expect(test.get.data[0].b).equal(1);
        fs.unlinkSync('test.json');
    });

    it(".update(Id, true): One - Identical", function(){
        var test = jsondb('test');
        test.create({b: 1, a: 'a'});
        test.update(1, {a: 'c'}, true);
        expect(test.get.data[0].a).equal('c');
        expect(test.get.data[0].id).equal(1);
        expect(test.get.data[0].b).equal(undefined);
        fs.unlinkSync('test.json');
    });

    it(".update(Function): Many", function(){
        var test = jsondb('test');
        test.create([{b: 1, a: 'a'}, {b: 1, a: 'b'}]);
        test.update(function(doc){
            return doc.b ==1
        }, {a: 'c'});
        expect(test.get.data[0].a).equal('c');
        expect(test.get.data[1].a).equal('c');
        fs.unlinkSync('test.json');
    });

    it(".update(Function, true): Many - Identical", function(){
        var test = jsondb('test');
        test.create([{b: 1, a: 'a'}, {b: 1, a: 'b'}]);
        test.update(function(doc){
            return doc.b ==1
        }, {a: 'c'}, true);
        expect(test.get.data[0].a).equal('c');
        expect(test.get.data[1].b).equal(undefined);
        fs.unlinkSync('test.json');
    });

    it(".update(Array): Many", function(){
        var test = jsondb('test');
        test.create([{b: 1, a: 'a'}, {b: 2, a: 'b'}]);
        test.update([{b: 1}, {b: 2}], {a: 'c'});
        expect(test.get.data[0].a).equal('c');
        expect(test.get.data[1].b).equal(2);
        fs.unlinkSync('test.json');

        var test = jsondb('test');
        test.create([{b: 1, a: 'a'}, {b: 2, a: 'b'}]);
        test.update([1, 2], {a: 'c'});
        expect(test.get.data[0].a).equal('c');
        expect(test.get.data[1].a).equal('c');
        fs.unlinkSync('test.json');
    });

    it(".update(Array): Many - Identical", function(){
        var test = jsondb('test');
        test.create([{b: 1, a: 'a'}, {b: 2, a: 'b'}]);
        test.update([{b: 1}, {b: 2}], {a: 'c'}, true);
        expect(test.get.data[0].b).equal(undefined);
        expect(test.get.data[1].b).equal(undefined);
        fs.unlinkSync('test.json');

        var test = jsondb('test');
        test.create([{b: 1, a: 'a'}, {b: 2, a: 'b'}]);
        test.update([1, 2], {a: 'c'}, true);
        expect(test.get.data[0].a).equal('c');
        expect(test.get.data[1].b).equal(undefined);
        fs.unlinkSync('test.json');
    });

});

describe("Find", function(){

    it(".find(Object): Many", function(){
        var test = jsondb('test');
        test.create([
            {a: 1, b: 1}, {a: 2, b: 1}
        ]);
        var first = test.find({a: 1});
        var second = test.find({b: 1});
        expect(first.length).equal(1);
        expect(second.length).equal(2);
        fs.unlinkSync('test.json');
    });

    it(".find(Function): Many", function(){
        var test = jsondb('test');
        test.create([
            {a: 1, b: 1}, {a: 2, b: 1}
        ]);
        var first = test.find(function(doc){
            return doc.a == 1;
        });
        var second = test.find(function(doc){
            return doc.b == 1;
        });
        expect(first.length).equal(1);
        expect(second.length).equal(2);
        fs.unlinkSync('test.json');
    });

    it(".find(Object): Many", function(){
        var pokes = jsondb('test');
        pokes.create([
            {name: 'Pikachu', types: ['electric']},
            {name: 'Bulbasaur', types: ['grass', 'poison']},
            {name: 'Other', types: ['electric', 'grass']},
        ]);
        var find = pokes.find({types: ['grass']});
        expect(find.length).equal(2);
        fs.unlinkSync('test.json');
    });

});

describe("Save", function(){

    it("Save will create", function(){
        var people = jsondb('test');
        people.save([
            {name: "Henry", age: 22, active: false},
            {name: "Renato", age: 20, active: true},
            {name: "Frank", age: 14, active: true}
        ]);
        expect(people.get.data.length).equal(3);
        var renato = people.findOne({name: 'Renato'});
        expect(renato.age).equal(20);
        fs.unlinkSync('test.json');
    });

    it("Save will update", function(){
        var people = jsondb('test');
        people.save([
            {name: "Henry", age: 22, active: false},
            {name: "Renato", age: 20, active: true},
            {name: "Frank", age: 14, active: true}
        ]);
        people.save([
            {id: 1, name: "Oswald"},
            {id: 2, age: 40},
            {id: 3, active: false}
        ]);

        expect(people.get.data.length).equal(3);
        var renato = people.findOne({name: 'Renato'});
        expect(renato.age).equal(40);

        fs.unlinkSync('test.json');
    });

    it("Save will update identical", function(){
        var people = jsondb('test');
        people.save([
            {name: "Henry", age: 22, active: false},
            {name: "Renato", age: 20, active: true},
            {name: "Frank", age: 14, active: true}
        ]);
        people.save([
            {id: 1, name: "Oswald"},
            {id: 2, age: 40},
            {id: 3, active: false}
        ], true);

        expect(people.get.data.length).equal(3);
        var oswald = people.findOne({name: 'Oswald'});
        expect(oswald.age).equal(undefined);

        fs.unlinkSync('test.json');
    });

});
