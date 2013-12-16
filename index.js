// Copyright Concurix Corporation 2012-2013. All Rights Reserved.
//
// see LICENSE for licensing details
//
// The Software distributed under the License is distributed on an "AS IS"
// basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
//
// General wrapping functions

// to avoid tracing and wrapping itself 'block_tracing' acts as a semaphore 
// which is set to 'true' when it's in concurixjs code and 'false' when in user's code
var block_tracing = false;
var crypto = require('crypto');
var util = require('./util');
var extend = util.extend;
var log = util.log;

// Main wrap function.  For any future contributors, note that we use a number of locally 
// created objects so that we can have very precise control over instances and where the prototype
// points to.
module.exports = function wrap(wrapFun){
  var wrapperState = {
    
    beforeFun: null,
    before: function before(beforeFun){
      this.beforeFun = beforeFun;
      return this;
    },
  
    afterFun: null,
    after: function after(afterFun){
      this.afterFun = afterFun;
      return this;
    },
    
    moduleName: null,
    module: function module(moduleName){
      this.moduleName = moduleName;
      return this;
    },

    functionName: null,
    nameIfNeeded: function nameIfNeeded(functionName){
      this.functionName = functionName;
      return this;
    },
  
    computeFunctionInfo: function computeFunctionInfo(){
      var funInfo = this.funInfo = {};
      funInfo.name = this.orgFun.name || this.functionName ||  'anonymous';
      funInfo.abortWrap = false;

      //first try to get info from the debug object if it's available, as that will be more accurate
      if( typeof v8debug != "undefined" ){
        var script = v8debug.Debug.findScript(this.orgFun);
        if (!script){
          // do not wrap native code or extensions
          funInfo.abortWrap = true;
        } else {
          funInfo.file = script.name;
          funInfo.loc  = v8debug.Debug.findFunctionSourceLocation(this.orgFun);
          funInfo.id   = funInfo.file + ":" + funInfo.loc.position;
          //console.log("found script ", funInfo.file, funInfo.loc.line, this.functionName);
          //console.log("calling it ", funInfo.name, this.clientState.modInfo.top);
          //console.log("source ", this.orgFun.toString());
        }
      } else {
        // do not wrap native code or extensions
        var funSrc = this.orgFun.toString();
        if (funSrc.match(/\{ \[native code\] \}$/)){
          funInfo.abortWrap = true; 
        }
        // if we don't have the v8debug info, then create a hash from the
        // code to do our best to be able to compare the same function
        funInfo.file = this.moduleName;
        funInfo.loc = {position: 0, line: 0};
        funInfo.id = computeHash(this.moduleName + funSrc);
      }  
    },
    
    clientState: null,
    state: function state(clientState){
      this.clientState = clientState;
      return this;
    },
  
    getProxy: function getProxy(){
      //first handle the case where we are wrapping a proxy or wrapping a function that already has a proxy
      //TODO--it might be useful to try to merge clientState if we already have a proxy.
      if (this.orgFun.__concurix_wrapped_by__) {
        if (this.orgFun.__concurix_wrapped_by__.__concurix_proxy_state__.orgFun.toString() === this.orgFun.toString()) {
          extend(this.orgFun.__concurix_wrapped_by__, this.orgFun);
          return this.orgFun.__concurix_wrapped_by__;
        }
      }
      if(this.orgFun.__concurix_wrapper_for__){
        extend(this.orgFun, this.orgFun.__concurix_proxy_state__.orgFun);
        return this.orgFun;
      }

      //otherwise, we are       
      var concurixProxy = function() {
        var self = this;
        var state = arguments.callee.__concurix_proxy_state__;

        var _args = arguments;
        function runOriginal() {
          var ret;
          if (state.orgFun.prototype && Object.getPrototypeOf(self) === state.orgFun.prototype && (!self || !self.__concurix_constructed_obj__)) {
            if (_args.length === 0) {
              ret = new state.orgFun();
              ret.__concurix_constructed_obj__ = true;
              return ret;
            }
            else {
              var obj = Object.create(state.orgFun.prototype);
              var override = state.orgFun.apply(obj, _args);
              ret = (override != null && typeof override === "object") ? override : obj;
              ret.__concurix_constructed_obj__ = true;
              return ret;
            }
          }
          else {
            return state.orgFun.apply(self, _args);
          }
        }

        if (!state ){
          return null;
        }
        if (block_tracing){
          return runOriginal();
        }

        block_tracing = true;
        var trace = {};
        var rethrow = null;
        var doRethrow = false;
        //save caller info and call cxBeforeHook
        try {
          //WEIRD BEHAVIOR ALERT:  the nodejs debug module gives us line numbers that are zero index based; add 1
          trace.moduleName = state.moduleName;
          trace.funInfo = state.funInfo;
          trace.processId = process.pid;
          trace.args = arguments;
          // WARNING: start time is not accurate as it includes cxBeforeHook excecution
          // this is done to have approximate start time required in calculating total_delay in bg process
          trace.startTime = process.hrtime();
          // trace.wrappedThis = this;
          if(state.beforeFun){
            state.beforeFun.call(self, trace, state.clientState);
          }
        } catch(e) {
          log('concurix.wrapper beforeFun: error', e);
        }

        // Re-calculate accurate start time so we get accurate execTime
        var startTime = process.hrtime();
        //re-assign any properties back to the original function
        extend(state.orgFun, arguments.callee);
      
        var startMem = process.memoryUsage().heapUsed;
        try{
          block_tracing = false;
          var ret = runOriginal();
        } catch (e) {
          // it's a bit unfortunate we have to catch and rethrow these, but some nodejs modules like
          // fs use exception handling as flow control for normal cases vs true exceptions.
          rethrow = e;
          doRethrow = true; // Amazon uses null exceptions as part of their normal flow control, handle that case
        }
        block_tracing = true;
        //save return value, exec time and call cxAfterHook
        try {
          trace.memDelta = process.memoryUsage().heapUsed - startMem;
          trace.ret = ret;
          trace.startTime = startTime;
          trace.execTime = process.hrtime(startTime);
          if (state.afterFun){
            state.afterFun.call(self, trace, state.clientState);
          } 
        } catch(e) {
          log('concurix.wrapper afterFun: error', e);
          log(e.stack);
        }
        block_tracing = false;
        if( doRethrow ){
          throw rethrow;
        }
        return trace.ret;      
      };
    
      //now compute various wrapper information
      this.computeFunctionInfo();
    
      // if we've determined a state that we can't wrap, abort and return the original functions
      if( this.funInfo.abortWrap ){
        return this.orgFun;
      }
      // keep the original func name and length using eval
      var orgFuncName = this.orgFun.name;
      var orgFuncLen  = this.orgFun.length;

      var proxyStr = concurixProxy.toString();

      if (orgFuncName) {
        proxyStr = proxyStr.replace(/^function/, 'function ' + orgFuncName);

      }
      if( orgFuncLen ){
        var i = 0;
        var argStr = '';
        for( i ; i< this.orgFun.length -1; i++ ){
          argStr += 'cx_arg_' + i + ' , ';
        }
        if( i === this.orgFun.length -1 ) {
          argStr += 'cx_arg_' + i;
        }        
        proxyStr = proxyStr.replace(/\(\)/, '(' + argStr + ')');
      }
  
      var proxy;
      eval("proxy = " + proxyStr);

      proxy.__proto__ = this.orgFun
      proxy.prototype = this.orgFun.prototype;
      proxy.__concurix_wrapper_for__ = orgFuncName || 'anonymous' ;
      proxy.__concurix_proxy_state__ = this;
      this.orgFun.__concurix_wrapped_by__ = proxy;  
      return proxy;      
    }
  };
    
  wrapperState.orgFun = wrapFun;

  return wrapperState;
};

// additional trace apis that are functions attached to the main function as properties
module.exports.isWrapper = function isWrapper(obj){
  if( obj.__concurix_wrapper_for__ ){
    return true;
  }
  return false;
}

module.exports.getWrapper = function getWrapper(obj){
  var proxy = obj.__concurix_wrapped_by__;
  return proxy;
}

module.exports.extendWrapperToOriginal = function extendWrapperToOriginal(proxy){
  if( proxy && proxy.__concurix_proxy_state__){
    util.extend(proxy.__concurix_proxy_state__.orgFun, proxy);
    proxy.__concurix_proxy_state__.orgFun.prototype = proxy.prototype;
  }
  return proxy;
}

// helper functions

function computeHash(str){
  return crypto.createHash('md5').update(str).digest('hex');
}


