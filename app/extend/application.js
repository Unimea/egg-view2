'use strict';

const path = require('path');
const {toArray, promiseTrue, existFile} = require('./util');
const VIEW_MANAGER = Symbol.for('app#view_manager');

module.exports = {
  get view2() {
    if (!this[VIEW_MANAGER]) {
      this[VIEW_MANAGER] = new ViewManager(this);
    }
    return this[VIEW_MANAGER];
  }
};

class ViewManager extends Map {
  constructor(app) {
    super();
    this.app = app;
    this.env = app.config.env;
    this.config = app.config.view2;
    this.baseDir = this.config.baseDir;
    this.defaultSymbol = Symbol();
    this.roots = this.resolveRoots();
  }
  /*
   * @description: resolve view path in config to absolute one.
   */
  resolveBaseDir(directory) {
    if (path.isAbsolute(directory)) {
      return directory;
    }
    if (this.baseDir) {
      return path.resolve(this.baseDir, directory);
    }
    throw new Error('directory ' + directory + ' is required to be absolute one, '
                    + 'while baseDir was not set.');
  }
  /*
   * @description: sort view roots.
   *
   * @return: object like following one
   *  {
   *    exmapleViewName: [absolute_paths_including_default_ones...]
   *    ...
   *  }
   */
  resolveRoots() {
    const defaultRouteConfig = toArray(this.config.defaultRoots)
          , defaultRoots = []
          , roots = {}
          , config = this.config
          , app = this.app;

    if (config.mapping) {
      // resolve view path to absolute path.
      for (let name in config.mapping) {
        roots[name] = toArray(config.mapping[name].root)
                      .map(dir => this.resolveBaseDir(dir));
        // push default view path.
        if (config.mapping[name].default) {
          defaultRoots.push(...roots[name]);
        }
      }
    }

    // resolve default roots.
    for (let r of defaultRouteConfig) {
      if (path.isAbsolute(r)) {
        defaultRoots.push(r);
      } else if (roots[r]) {
        defaultRoots.push(...roots[r]);
      } else {
        defaultRoots.push(this.resolveBaseDir(r));
      }
    }

    // sort out roots of each mapping for travel.
    for (let name in roots) {
      roots[name].push(...defaultRoots);
      roots[name] = [...new Set(roots[name])];
    }

    // default roots.
    roots[this.defaultSymbol] = [...new Set(defaultRoots)];

    return roots;
  }
  getRoot(name) {
    return this.roots[name] || this.roots[this.defaultSymbol];
  }
  getView(name, rootName) {
    const files = this.getRoot(rootName).map(r => path.join(r, name));
    return promiseTrue(files.map(f => existFile(f))).then(index => {
      if (index > -1) {
        return files[index];
      } else {
        return null;
      }
    });
  }
  use(name, viewEngine) {
    this.set(name, viewEngine);
  }
}
