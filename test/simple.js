var should = require('should');
var wrap = require('../index.js');

function a(arg1, arg2){
  return arg1 + arg2;
}

describe('basic test', function(){
  describe('wrap only', function(){
    it('should return arg1 + arg2 after wrapping', function(){
      var b = wrap(a).getProxy();
      b(1,2).should.equal(3);
    });
  });
});