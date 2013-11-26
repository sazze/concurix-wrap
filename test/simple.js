var should = require('should');
var wrap = require('../index.js');

function singleton(arg1, arg2){
  return arg1 + arg2;
}

describe('basic wrapping test', function(){
  describe('wrap only', function(){
    it('should return arg1 + arg2 after wrapping', function(){
      function a(arg1, arg2){
        return arg1 + arg2;
      }      
      var b = wrap(a).getProxy();
      b(1,2).should.equal(3);
    });
  });
  
  describe('test before', function(){
    it('should get before hook called', function(){
      function a(arg1, arg2){
        return arg1 + arg2;
      }      
      //do the tests outside of the hook
      var trace, clientState;
      var b = wrap(a)
        .before(function(traceArg, clientStateArg){ 
          trace = traceArg;
          clientState = clientStateArg;})
        .getProxy();
      b(1,2).should.equal(3);
      trace.args['0'].should.equal(1);
      trace.args['1'].should.equal(2);
      trace.funInfo.name.should.equal('a');
    });
  });
  
  describe('test after', function(){
    it('should get before hook called', function(){
      function a(arg1, arg2){
        return arg1 + arg2;
      }      
      //do the tests outside of the hook
      var trace, clientState;
      var b = wrap(a)
        .after(function(traceArg, clientStateArg){ 
          trace = traceArg;
          clientState = clientStateArg;})
        .getProxy();
      b(1,2).should.equal(3);
      trace.args['0'].should.equal(1);
      trace.args['1'].should.equal(2);
      trace.funInfo.name.should.equal('a');
      trace.ret.should.equal(3);
    });
  }); 
  describe('test client state', function(){
    it('should get before hook called', function(){
      function a(arg1, arg2){
        return arg1 + arg2;
      }      
      //do the tests outside of the hook
      var trace, clientState;
      var b = wrap(a)
        .after(function(traceArg, clientStateArg){ 
          trace = traceArg;
          clientState = clientStateArg;})
        .state('hello')
        .getProxy();
      b(1,2).should.equal(3);
      trace.args['0'].should.equal(1);
      trace.args['1'].should.equal(2);
      trace.funInfo.name.should.equal('a');
      trace.ret.should.equal(3);
      clientState.should.equal('hello');
    });
  });
  describe('test module name', function(){
    it('should get before hook called', function(){
      function a(arg1, arg2){
        return arg1 + arg2;
      }      

      //do the tests outside of the hook
      var trace, clientState;
      var b = wrap(a)
        .after(function(traceArg, clientStateArg){ 
          trace = traceArg;
          clientState = clientStateArg;})
        .state('hello')
        .module('test')
        .getProxy();
      b(1,2).should.equal(3);
      trace.args['0'].should.equal(1);
      trace.args['1'].should.equal(2);
      trace.funInfo.name.should.equal('a');
      trace.ret.should.equal(3);
      clientState.should.equal('hello');
      trace.moduleName.should.equal('test');
    });
  });

  describe('test function name', function(){
    it('should get before hook called for name test', function(){
     
      //do the tests outside of the hook
      var trace, clientState;
      var b = wrap(function(arg1, arg2){ return arg1 + arg2})
        .after(function(traceArg, clientStateArg){ 
          trace = traceArg;
          clientState = clientStateArg;})
        .state('hello')
        .module('test')
        .nameIfNeeded('foobar')
        .getProxy();
      b(1,2).should.equal(3);
      trace.args['0'].should.equal(1);
      trace.args['1'].should.equal(2);
      trace.funInfo.name.should.equal('foobar');
      trace.ret.should.equal(3);
      clientState.should.equal('hello');
      trace.moduleName.should.equal('test');
    });
  });

  describe('test function length', function(){
    it('length of proxy arguments should be 0', function(){
     
      //do the tests outside of the hook
      var b = wrap(function(){ return 0;})
        .module('test')
        .nameIfNeeded('foobar')
        .getProxy();
      b.length.should.equal(0);
    });
    it('length of proxy arguments should be 1', function(){
     
      //do the tests outside of the hook
      var b = wrap(function(arg1){ return arg1;})
        .module('test')
        .nameIfNeeded('foobar')
        .getProxy();
      b.length.should.equal(1);
    });
    it('length of proxy arguments should be 2', function(){
     
      //do the tests outside of the hook
      var b = wrap(function(arg1, arg2){ return arg1 + arg2;})
        .module('test')
        .nameIfNeeded('foobar')
        .getProxy();
      b.length.should.equal(2);
    });    
  });

  describe('test proxy name', function(){
    it('proxy name should be empty', function(){
     
      //do the tests outside of the hook
      var b = wrap(function(){ return 0;})
        .module('test')
        .nameIfNeeded('foobar')
        .getProxy();
      b.name.should.equal('');
    });
    it('proxy name should be barfoo', function(){
     
      //do the tests outside of the hook
      var b = wrap(function barfoo(arg1){ return arg1;})
        .module('test')
        .nameIfNeeded('foobar')
        .getProxy();
      b.name.should.equal('barfoo');
    });
  });

  describe('test isWrapper', function() {
    it('isWrapper should be true', function(){
      function a(arg1, arg2){
        return arg1 + arg2;
      }      

      var b = wrap(a).getProxy();
      wrap.isWrapper(b).should.be.true;
      wrap.isWrapper(a).should.be.false;
    })
  }); 

  describe('test getWrapper', function(){
    it('should get wrapper', function(){
      function a(arg1, arg2){
        return arg1 + arg2;
      }      

      var b = wrap(a).getProxy();
      wrap.getWrapper(a).should.equal(b);
    });
  });

  describe('test extendOriginalToWrapper', function(){
    it('should extend Original', function(){
      function a(arg1, arg2){
        return arg1 + arg2;
      }      

      var b = wrap(a).getProxy();
      a.newField = 'hello';
      b.should.not.have.property('newField');
      wrap.extendOriginalToWrapper(b).newField.should.equal('hello');
    });
  });

  describe('test extendWrapperToOriginal', function(){
    it('should extend Original', function(){
      function a(arg1, arg2){
        return arg1 + arg2;
      }      

      var b = wrap(a).getProxy();
      b.newField2 = 'hello';
      a.should.not.have.property('newField2');
      wrap.extendWrapperToOriginal(b).newField2.should.equal('hello');
    });

  describe('test no double wrap', function(){
    it('should only wrap once', function(){
      function a(arg1, arg2){
        return arg1 + arg2;
      }      
      var b = wrap(a).getProxy();
      var c = wrap(a).getProxy();
      b.should.equal(c);
      });
    });
  });

  describe('test module constructor', function(){
    it('simple constructor (new)', function(){
      function Cat() {}
      Cat.prototype.meow = function () {return 'meow'}

      var captured;
      function a(trace) {
        captured = trace.ret;
      }
      var c = wrap(Cat).after(a).getProxy();
      var instance = new c();
      instance.should.equal(captured);
      instance.meow().should.equal('meow');
    });

    it('constructor w/ args (new)', function(){
      function Cat(name) {this.name = name;}
      Cat.prototype.meow = function () {return 'meow'}

      var captured;
      function a(trace) {
        captured = trace.ret;
      }
      var c = wrap(Cat).after(a).getProxy();
      var instance = new c('felix');
      instance.should.equal(captured);
      instance.meow().should.equal('meow');
      instance.name.should.equal('felix');
    });

    it('constructor as factory', function(){
      function Cat(name) {
        if (!(this instanceof Cat)) return new Cat(name);
        this.name = name;
      }
      Cat.prototype.meow = function () {return 'meow'}

      var captured;
      function a(trace) {
        captured = trace.ret;
      }
      var c = wrap(Cat).after(a).getProxy();
      var instance = c('felix');
      instance.should.equal(captured);
      instance.meow().should.equal('meow');
      instance.name.should.equal('felix');
    });

    it('constructor returns obj', function(){
      function Cat(name) {
        var foo = {name: name};
        return foo;
      }
      // returned object won't get this...
      Cat.prototype.meow = function () {return 'meow'}

      var captured;
      function a(trace) {
        captured = trace.ret;
      }
      var c = wrap(Cat).after(a).getProxy();
      var instance = new c('felix');
      instance.should.equal(captured);
      instance.name.should.equal('felix');
    });

    it('constructor returns obj w/ args', function(){
      function Cat() {
        var foo = {name: 'anon'};
        return foo;
      }
      // returned object won't get this...
      Cat.prototype.meow = function () {return 'meow'}

      var captured;
      function a(trace) {
        captured = trace.ret;
      }
      var c = wrap(Cat).after(a).getProxy();
      var instance = new c();
      instance.should.equal(captured);
      instance.name.should.equal('anon');
    });

    it('ignores bound functions', function (){
      function z() {return true;}
      // actually using bind means we can never wrap -- sees it as [native code]
      var y = Function.prototype.call.bind(z);
      var w = wrap(y).getProxy();
      w().should.be.true;
    });

    it('ignores broken prototypes', function (){
      function z() {return true;}
      z.prototype = undefined;
      var w = wrap(z).getProxy();
      w().should.be.true;
    });
  });
});