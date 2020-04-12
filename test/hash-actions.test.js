import { expect } from '@open-wc/testing';
import sinon from 'sinon/pkg/sinon-esm.js';

import '../src/hash-actions.js';

const ha = window.hashActions;

const setTestHash = hash => new Promise(resolve => {
  const listener = () => {
    resolve();
    window.removeEventListener('hashchange', listener);
  };
  window.addEventListener('hashchange', listener);
  window.location.hash = hash;
});

describe('hash-actions', () => {
  afterEach(() => {
    ha.setHash('');
  });

  describe('removeHashSymbol()', () => {
    it('should remove the hash/fragment of given URL string', () => {
      const testCases = [
        { url: 'http://example.com/foo/?query#bar', expected: 'http://example.com/foo/?query' },
        { url: 'http://example.com/foo?query#bar', expected: 'http://example.com/foo?query' },
        { url: 'http://example.com/foo/#bar', expected: 'http://example.com/foo/' },
        { url: 'http://example.com/foo#bar', expected: 'http://example.com/foo' },
        { url: 'http://example.com/#bar', expected: 'http://example.com/' },
        { url: '/foo/?query#bar', expected: '/foo/?query' },
        { url: '/foo?query#bar', expected: '/foo?query' },
        { url: '/foo/#bar', expected: '/foo/' },
        { url: '/foo#bar', expected: '/foo' },
        { url: '/#bar', expected: '/' },
        { url: '#bar', expected: '' },
      ];
      testCases.forEach(o => {
        const result = ha.removeHashSymbol(o.url);
        expect(result).to.equal(o.expected);
      });
    });
  });

  describe('setHash()', () => {
    it('should set the hash', () => {
      ha.setHash('#foo');
      expect(window.location.hash).to.equal('#foo');
      expect(window.location.href.endsWith('#foo')).to.be.true;
    });

    it('should remove the hash', () => {
      ha.setHash('#foo');

      ha.setHash('');
      expect(window.location.hash).to.equal('');
      expect(window.location.href).to.not.include('#');
    });
  });

  describe('hideEmptyHashFromURL', () => {
    after(() => {
      ha.hideEmptyHashFromURL = false;
    });

    it('should not hide the hash by default', async () => {
      await setTestHash('#foo');
      await setTestHash('');

      expect(window.location.href).to.include('#');
    });

    it('should hide the hash when enabled', async () => {
      ha.hideEmptyHashFromURL = true;
      await setTestHash('#foo');
      await setTestHash('');

      expect(window.location.href).to.not.include('#');
    });
  });

  describe('setHashWithoutScrolling()', () => {
    /** @type {HTMLElement} */
    let testElement;

    /** @type {HTMLElement} */
    let hashTarget;

    /** @type {number} */
    let restoreScrollTop;

    /** @type {number} */
    let restoreScrollLeft;

    before(() => {
      restoreScrollTop = document.documentElement.scrollTop;
      restoreScrollLeft = document.documentElement.scrollLeft;
    });

    beforeEach(() => {
      // Create a named anchor outside viewport
      testElement = document.createElement('div');
      testElement.style.border = '1px solid black';
      testElement.style.backgroundColor = 'lightgoldenrodyellow';
      testElement.style.paddingTop = '150vh';
      testElement.style.paddingLeft = '150vw';
      hashTarget = document.createElement('a');
      hashTarget.textContent = 'TARGET';
      hashTarget.setAttribute('name', 'foo-anchor');
      testElement.appendChild(hashTarget);
      document.body.appendChild(testElement);
      // Scroll page to top left
      document.documentElement.scrollTop = 0;
      document.documentElement.scrollLeft = 0;
    });

    afterEach(() => {
      if (testElement && testElement.parentElement) {
        testElement.parentElement.removeChild(testElement);
      }
    });

    after(() => {
      document.documentElement.scrollTop = restoreScrollTop;
      document.documentElement.scrollLeft = restoreScrollLeft;
    });

    it('should set the hash without scrolling', () => {
      ha.setHashWithoutScrolling('#foo-anchor');
      expect(document.documentElement.scrollTop).to.equal(0);
      expect(document.documentElement.scrollLeft).to.equal(0);
    });
  });

  describe('removeHashWithoutReload()', () => {
    it('should remove the hash', () => {
      ha.setHash('#foo');

      ha.removeHashWithoutReload('');
      expect(window.location.hash).to.equal('');
      expect(window.location.href).to.not.include('#');
    });
  });

  describe('isCurrentHash()', () => {
    it('should return true when given hash is current', () => {
      expect(ha.isCurrentHash('')).to.be.true;
      expect(ha.isCurrentHash('#foo')).to.be.false;

      window.location.hash = '#foo';
      expect(ha.isCurrentHash('')).to.be.false;
      expect(ha.isCurrentHash('#foo')).to.be.true;
    });
  });

  describe('Hash registration', () => {
    afterEach(() => {
      ha._clearRegisteredHashes();
    });

    it('should register hash', () => {
      expect(ha.isRegisteredHash('#foo')).to.be.false;
      ha.registerHash('#foo');
      expect(ha.isRegisteredHash('#foo')).to.be.true;
    });

    it('should unregister hash', () => {
      ha.registerHash('#foo');
      ha.unregisterHash('#foo');
      expect(ha.isRegisteredHash('#foo')).to.be.false;
    });

    it('should not throw when trying to register a registered hash', () => {
      expect(() => {
        ha.registerHash('#foo');
        ha.registerHash('#foo');
      }).to.not.throw();
    });

    it('should not throw when trying to unregister a non-registered hash', () => {
      expect(() => {
        ha.unregisterHash('#foo');
        ha.unregisterHash('#foo');
      }).to.not.throw();
    });

    it('should know if current hash is registered', () => {
      expect(ha.isCurrentRegisteredHash()).to.be.false;
      window.location.hash = '#bar';
      expect(ha.isCurrentRegisteredHash()).to.be.false;
      ha.registerHash('#bar');
      expect(ha.isCurrentRegisteredHash()).to.be.true;
      window.location.hash = '#foo';
      expect(ha.isCurrentRegisteredHash()).to.be.false;
    });

    it('should unregister all hashes with _clearRegisteredHashes()', () => {
      ha.registerHash('#foo');
      ha.registerHash('#bar');
      ha._clearRegisteredHashes();
      expect(ha.isRegisteredHash('#foo')).to.be.false;
      expect(ha.isRegisteredHash('#bar')).to.be.false;
    });

    describe('Events', () => {
      const withDocEventSpy = async (eventType, callback) => {
        const spy = sinon.spy();
        document.addEventListener(eventType, spy);
        await callback(spy);
        document.removeEventListener(eventType, spy);
      };

      describe('hashactions:enter:*', () => {
        it('should not trigger enter event for non-registered hash', async () => {
          await withDocEventSpy('hashactions:enter:#sandman', async enterSpy => {
            await setTestHash('#sandman');
            expect(enterSpy).to.not.have.been.called;
          });
        });

        it('should trigger enter event with registerHash() and triggerOnCurrent', async () => {
          await withDocEventSpy('hashactions:enter:#sandman', async enterSpy => {
            await setTestHash('#sandman');
            ha.registerHash('#sandman', true);
            expect(enterSpy).to.have.been.calledOnce;
          });
        });

        it('should trigger enter event once with registerHash() and triggerOnCurrent when registering more than once', async () => {
          await withDocEventSpy('hashactions:enter:#sandman', async enterSpy => {
            await setTestHash('#sandman');
            ha.registerHash('#sandman', true);
            ha.registerHash('#sandman', true);
            expect(enterSpy).to.have.been.calledOnce;
          });
        });

        it('should trigger enter event with triggerHashEnter()', async () => {
          await withDocEventSpy('hashactions:enter:#sandman', enterSpy => {
            ha.triggerHashEnter('#sandman');
            expect(enterSpy).to.have.been.calledOnce;
          });
        });

        it('should trigger enter event with onHashEnter()', async () => {
          await withDocEventSpy('hashactions:enter:#sandman', async enterSpy => {
            const callbackSpy = sinon.spy();
            ha.onHashEnter('#sandman', callbackSpy);

            expect(enterSpy).to.not.have.been.called;
            expect(callbackSpy).to.not.have.been.called;

            await setTestHash('#sandman');

            expect(enterSpy).to.have.been.calledOnce;
            expect(callbackSpy).to.have.been.calledOnce;
          });
        });

        it('should not trigger enter event with onHashEnter() and triggerOnCurrent', async () => {
          await withDocEventSpy('hashactions:enter:#sandman', enterSpy => {
            const callbackSpy = sinon.spy();
            ha.onHashEnter('#sandman', callbackSpy, true);

            expect(enterSpy).to.not.have.been.called;
            expect(callbackSpy).to.not.have.been.called;
          });
        });

        it('should trigger enter event with onHashEnter() and triggerOnCurrent', async () => {
          await withDocEventSpy('hashactions:enter:#sandman', async enterSpy => {
            const callbackSpy = sinon.spy();
            await setTestHash('#sandman');
            ha.onHashEnter('#sandman', callbackSpy, true);

            expect(enterSpy).to.have.been.calledOnce;
            expect(callbackSpy).to.have.been.calledOnce;
          });
        });

        it('should trigger enter event with on()', async () => {
          await withDocEventSpy('hashactions:enter:#sandman', async enterSpy => {
            const callbackSpy = sinon.spy();
            ha.on('#sandman', { enter: callbackSpy });

            expect(enterSpy).to.not.have.been.called;
            expect(callbackSpy).to.not.have.been.called;

            await setTestHash('#sandman');
            expect(enterSpy).to.have.been.calledOnce;
            expect(callbackSpy).to.have.been.calledOnce;
          });
        });

        it('should not trigger enter event with on() and triggerEnterOnCurrent', async () => {
          await withDocEventSpy('hashactions:enter:#sandman', enterSpy => {
            const callbackSpy = sinon.spy();
            ha.on('#sandman', { enter: callbackSpy }, true);

            expect(enterSpy).to.not.have.been.called;
            expect(callbackSpy).to.not.have.been.called;
          });
        });

        it('should trigger enter event with on() and triggerEnterOnCurrent', async () => {
          await withDocEventSpy('hashactions:enter:#sandman', async enterSpy => {
            const callbackSpy = sinon.spy();
            await setTestHash('#sandman');
            ha.on('#sandman', { enter: callbackSpy }, true);

            expect(enterSpy).to.have.been.calledOnce;
            expect(callbackSpy).to.have.been.calledOnce;
          });
        });
      });

      describe('hashactions:exit:*', () => {
        it('should not trigger exit event for non-registered hash', async () => {
          await withDocEventSpy('hashactions:exit:#sandman', async exitSpy => {
            await setTestHash('#sandman');
            await setTestHash('');
            expect(exitSpy).to.not.have.been.called;
          });
        });

        it('should trigger exit event with triggerHashExit()', async () => {
          await withDocEventSpy('hashactions:exit:#sandman', exitSpy => {
            ha.triggerHashExit('#sandman');
            expect(exitSpy).to.have.been.calledOnce;
          });
        });

        it('should trigger exit event with onHashExit()', async () => {
          await withDocEventSpy('hashactions:exit:#sandman', async exitSpy => {
            const callbackSpy = sinon.spy();
            ha.onHashExit('#sandman', callbackSpy);

            await setTestHash('#sandman');
            expect(exitSpy).to.not.have.been.called;
            expect(callbackSpy).to.not.have.been.called;

            await setTestHash('');
            expect(exitSpy).to.have.been.calledOnce;
            expect(callbackSpy).to.have.been.calledOnce;
          });
        });

        it('should trigger exit event with on()', async () => {
          await withDocEventSpy('hashactions:exit:#sandman', async exitSpy => {
            const callbackSpy = sinon.spy();
            ha.on('#sandman', { exit: callbackSpy });

            await setTestHash('#sandman');
            expect(exitSpy).to.not.have.been.called;
            expect(callbackSpy).to.not.have.been.called;

            await setTestHash('');
            expect(exitSpy).to.have.been.calledOnce;
            expect(callbackSpy).to.have.been.calledOnce;
          });
        });

        it('should trigger exit event once with removeHashWithoutReload()', async () => {
          await withDocEventSpy('hashactions:exit:#sandman', async exitSpy => {
            await setTestHash('#sandman');
            ha.registerHash('#sandman');

            ha.removeHashWithoutReload();
            expect(exitSpy).to.have.been.calledOnce;
            ha.removeHashWithoutReload();
            expect(exitSpy).to.have.been.calledOnce;
          });
        });
      });

      describe('on() with enter and exit listeners', () => {
        it('should trigger enter and exit events with on()', async () => {
          const enterCallbackSpy = sinon.spy();
          const exitCallbackSpy = sinon.spy();
          ha.on('#sandman', {
            enter: enterCallbackSpy,
            exit: exitCallbackSpy,
          });
          await withDocEventSpy('hashactions:enter:#sandman', async enterSpy => {
            expect(enterSpy).to.not.have.been.called;
            expect(enterCallbackSpy).to.not.have.been.called;
            await setTestHash('#sandman');
            expect(enterSpy).to.have.been.calledOnce;
            expect(enterCallbackSpy).to.have.been.calledOnce;
          });
          await withDocEventSpy('hashactions:exit:#sandman', async exitSpy => {
            expect(exitSpy).to.not.have.been.called;
            expect(exitCallbackSpy).to.not.have.been.called;
            await setTestHash('');
            expect(exitSpy).to.have.been.calledOnce;
            expect(exitCallbackSpy).to.have.been.calledOnce;
          });
        });
      });

      describe('_triggerCustomEvent()', () => {
        it('should trigger an event', () => {
          const target = document.createElement('div');
          const spy = sinon.spy();
          target.addEventListener('foo-event', spy);

          ha._triggerCustomEvent(target, 'foo-event');

          expect(spy).to.have.been.calledOnce;
        });

        it('should trigger an event with data', () => {
          const target = document.createElement('div');
          const spy = sinon.spy();
          target.addEventListener('foo-event', spy);
          const data = { bar: 'baz' };

          ha._triggerCustomEvent(target, 'foo-event', data);

          expect(spy).to.have.been.calledWithMatch({ detail: data });
        });
      });
    });
  });
});
