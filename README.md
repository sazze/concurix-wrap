concurix-wrap
=============

This is a utility library used by [concurix-monitor](http://npm.im/concurix-monitor). We suggest you check out that library as it will automatically apply this wrapper with logic for integration with the Concurix service.

[![NPM](https://nodei.co/npm/concurix-wrap.png)](https://nodei.co/npm/concurix-wrap/)

[![david-dm](https://david-dm.org/Concurix/concurix-wrap.png)](https://david-dm.org/Concurix/concurix-wrap)
[![david-dm](https://david-dm.org/Concurix/concurix-wrap/dev-status.png)](https://david-dm.org/Concurix/concurix-wrap#info=devDependencies)

[![Build Status](https://travis-ci.org/Concurix/concurix-wrap.png?branch=master)](https://travis-ci.org/Concurix/concurix-wrap)

Javascript wrappers for inserting before and after calls around a function, while preserving as much identity of the wrapped function as possible.

Unlike simple function wrappers, the returned proxy tries to mimic the wrapped function as closely as possible (including properties and name)

To get the most out of this module, you can optionally expose V8's debug as a symbol this module will look for:
```bash
node --expose-debug-as=v8debug app.js
```

```js
var wrap = require("concurix-wrap");

// A silly prime number finder
function findPrimes(n) {
  var primes = [2], j, isPrime, i = 3
  while (primes.length < n) {
    isPrime = true
    for (j = 0; j < primes.length; j++) {
      if (i % primes[j] == 0) {
        isPrime = false
        break;
      }
    }
    if (isPrime) primes.push(i);
    i++;
  }
  return primes;
}

findPrimes = wrap(findPrimes)
  .before(function () {
    console.log("Starting `findPrimes()` at %s", new Date());
  })
  .after(function () {
    console.log("Finished `findPrimes()` at %s", new Date());
  })
  .getProxy();

var result = findPrimes(100000);
console.log(result[result.length - 1]);

/*
Starting `findPrimes()` at Tue Nov 19 2013 12:25:31 GMT-0800 (PST)
Finished `findPrimes()` at Tue Nov 19 2013 12:25:59 GMT-0800 (PST)
1299709
*/

```

API
===

`var wrapped = wrap(fn)`
---

Wrap a function with a proxy that allows you to trigger behavior before or after execution.

`wrapped.getProxy()`
---

Retreive the proxy function that will perform the original task with your added hooks.

`wrapped.before(fn)`
---

Execute `fn` before the wrapped function begins.

`wrapped.after(fn)`
---

Execute `fn` after the wrapped function completes. This does *not* follow asynchronous continuations.

`wrapped.orgFun`
---

Retreive the original function from the wrapper, unmodified.

LICENSE
===

MIT