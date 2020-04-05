import { expect } from '@open-wc/testing';

import '../src/hash-actions.js';

describe('hash-actions', () => {
  const ha = window.hashActions;

  it('should set hash foo', async () => {
    ha.setHash('#foo');
    expect(window.location.hash).to.equal('#foo');
  });
});
