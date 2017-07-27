'use strict';

const request = require('supertest');
const mm = require('egg-mock');

describe('test/view2.test.js', () => {
  let app;
  before(() => {
    app = mm.app({
      baseDir: 'apps/view2-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mm.restore);

  it('should GET /', () => {
    return request(app.callback())
      .get('/')
      .expect('hi, view2')
      .expect(200);
  });
});
