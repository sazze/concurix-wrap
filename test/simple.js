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
        .name('foobar')
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
});