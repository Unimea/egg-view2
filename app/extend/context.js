'use strict';

const path = require('path');
const {toPromise} = require('./util');

class ContextManager {
  constructor(ctx) {
    this.ctx = ctx;
    this.view = ctx.app.view2;
    this.config = ctx.app.view2.config;
  }
  getEngine(name) {
    const engine = this.view.get(name)
                || this.view.get(this.config.defaultEngine);
    if (engine) return engine;
    else throw new Error('View engine was not found.');
  }
  render(name, locals = {}, options = {}) {
    const engine = this.getEngine(options.engine);
    const rootName = options.root;
    delete options.root;
    delete options.engine;
    locals.ctx = this.ctx;

    return this.view.getView(name, rootName).then(file => {
      if (file) {
        const o = engine.render(file, locals, options);
        return toPromise(o);
      } else {
        this.ctx.status = 404;
        return 'Not Found';
      }
    }).then(html => {
      return this.ctx.body = html;
    });
  }
  renderString(tpl, locals = {}, options = {}) {
    locals.ctx = this.ctx;
    const engine = this.getEngine(options.engine);
    const o = engine.renderString(tpl, locals, options);
    return toPromise(o);
  }
}

module.exports = {
  render() {
    const viewManager = new ContextManager(this);
    return viewManager.render.apply(viewManager, arguments);
  },
  renderString() {
    const viewManager = new ContextManager(this);
    return viewManager.renderString.apply(viewManager, arguments);
  }
};
