'use strict';

const co = require('co');
const fs = require('fs');

exports.toArray = function(strOrArr) {
  return (typeof strOrArr === 'undefined')
    ? []
    : Array.isArray(strOrArr)
    ? strOrArr
    : [strOrArr];
};

exports.existFile = function(filename) {
  return new Promise((resolve, reject) => {
    fs.access(filename, fs.constants.R_OK, err => {
      resolve(!err);
    });
  });
};

exports.promiseRace = function(elements) {
  return new Promise((resolve, reject) => {
    for (let e of elements) {
      if (e instanceof Promise) {
        e.then(resolve).catch(reject);
      } else {
        return resolve(e);
      }
    }
  });
};

exports.isPromise = function(o) {
  return typeof o === 'object'
    && Object.getPrototypeOf(o).constructor.name === 'Promise';
}

exports.toPromise = function(o) {
  return new Promise((resolve, reject) => {
    co(function* () {
      const r = yield o;
      resolve(r);
    }).catch(reject);
  });
}

exports.promiseTrue = function(elements, isReject = false) {
  return new Promise((resolve, reject) => {
    let count = 0;
    const done = function(isReturn, err, index) {
      count++;
      if (isReturn) {
        if (err) {
          reject(err);
        } else {
          resolve(index);
        }
      } else if (count === elements.length) {
        return resolve(-1);
      }
    };
    for (let i = 0; i < elements.length; i++) {
      const e = elements[i];
      if (exports.isPromise(e)) {
        e.then(s => {
          if (s) {
            done(true, null, i);
          } else {
            done(false);
          }
        }).catch(e => {
          if (isReject) {
            done(true, e);
          } else {
            done(false);
          }
        });
      } else if (e) {
        return done(true, null, i);
      }
    }
  });
};
