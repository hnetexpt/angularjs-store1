import { NgZone, Component, Injectable } from '@angular/core';
import { Action } from 'redux';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/take';

import { WithSubStore } from './with-sub-store';
import { select, select$ } from './select';
import { dispatch } from './dispatch';
import { PathSelector } from '../components/selectors';
import { NgRedux } from '../components/ng-redux';
import { RootStore } from '../components/root-store';

class MockNgZone { run = (fn: Function) => fn() }

describe('@WithSubStore', () => {
  let ngRedux: NgRedux<any>;
  const localReducer = (state: any, action: Action) => state;
  const basePathMethodName = 'getSubStorePath';

  beforeEach(() => {
    const defaultState = {
      foo: 'Root Foo!',
      a: {
        b: { foo: 'Foo!' }
      }
    };

    ngRedux = new RootStore(new MockNgZone() as NgZone);
    NgRedux.instance = ngRedux;
    ngRedux.configureStore(
      (state: any, action: Action) => state,
      defaultState);
  });

  describe('on the class causes @select to', () => {
    it('use a substore for inferred-name selections', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      class TestClass {
        @select() foo: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      };

      const testInstance = new TestClass();
      testInstance.foo
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });

    it('use a substore for inferred-name selections with $ on the end', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      class TestClass {
        @select() foo$: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      };

      const testInstance = new TestClass();
      testInstance.foo$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });

    it('use a substore for a property selector', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      class TestClass {
        @select('foo') obs$: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      };

      const testInstance = new TestClass();
      testInstance.obs$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });

    it('use a substore for a function selector', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      class TestClass {
        @select(s => s.foo) obs$: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      };

      const testInstance = new TestClass();
      testInstance.obs$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });

    it('use a substore for a path selector', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      class TestClass {
        @select(['b', 'foo']) obs$: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a' ];
      };

      const testInstance = new TestClass();
      testInstance.obs$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });

    it('use a substore for a property selector with a comparator', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      class TestClass {
        @select('foo', (x, y) => x !== y) obs$: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      };

      const testInstance = new TestClass();
      testInstance.obs$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });

    it('return a stable reference for the decorated property', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      class TestClass {
        @select('foo') obs$: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      };

      const testInstance = new TestClass();

      // This looks odd, but it's because @select turns the property into a
      // getter. In theory that getter could return a new Observable instance
      // each time, which would be bad because it would leak memory like crazy.
      // This test is just checking that it's a stable reference to the same
      // instance.
      expect(testInstance.obs$ === testInstance.obs$).toEqual(true);
    });
  });

  describe('on the class causes @select$ to', () => {
    it('use a substore for a property selector', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      class TestClass {
        @select$('foo', o$ => o$.map(x => x)) obs$: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      };

      const testInstance = new TestClass();
      testInstance.obs$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });

    it('use a substore for a function selector', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      class TestClass {
        @select$(s => s.foo, o$ => o$.map(x => x)) obs$: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      };

      const testInstance = new TestClass();
      testInstance.obs$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });

    it('use a substore for a path selector', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      class TestClass {
        @select$(['b', 'foo'], o$ => o$.map(x => x)) obs$: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a' ];
      };

      const testInstance = new TestClass();
      testInstance.obs$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });

    it('use a substore for a property selector with a comparator', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      class TestClass {
        @select$(
          'foo',
          o$ => o$.map(x => x),
          (x, y) => x !== y) obs$: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      };

      const testInstance = new TestClass();
      testInstance.obs$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });
  });

  describe('on the class causes @dispatch to', () => {
    it('scope dispatches to substore', () => {
      spyOn(NgRedux.instance, 'dispatch');

      @WithSubStore({ basePathMethodName, localReducer })
      class TestClass {
        @dispatch() createFooAction = () => ({ type: 'FOO' });
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      };

      new TestClass().createFooAction();
      expect(ngRedux.dispatch).toHaveBeenCalledWith({
        type: 'FOO',
        '@angular-redux::fractalkey': JSON.stringify([ 'a', 'b' ]),
      });
    });
  });

  describe('coexists with', () => {
    it('@Component', () => {
      @Component({ template: '<p>Wat</p>' })
      @WithSubStore({ basePathMethodName, localReducer })
      class TestClass {
        @select() foo$: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      };

      const testInstance = new TestClass();
      testInstance.foo$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });

    it('@Component the other way round', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      @Component({ template: '<p>Wat</p>' })
      class TestClass {
        @select() foo$: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      };

      const testInstance = new TestClass();
      testInstance.foo$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });

    it('@Injectable', () => {
      @Injectable()
      @WithSubStore({ basePathMethodName, localReducer })
      class TestClass {
        @select() foo$: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      };

      const testInstance = new TestClass();
      testInstance.foo$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });

    it('@Injectable in the other order', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      @Injectable()
      class TestClass {
        @select() foo$: Observable<string>;
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      };

      const testInstance = new TestClass();
      testInstance.foo$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });
  });

  describe('with inheritance', () => {
    it('lets you select in a super class against a path from the sub class', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      class SuperClass {
        @select() foo$: Observable<string>;
      }

      class SubClass extends SuperClass {
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      }

      const testInstance = new SubClass();
      testInstance.foo$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });

    it('lets you select in a sub class against a path from the super class', () => {
      @WithSubStore({ basePathMethodName, localReducer })
      class SuperClass {
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      }

      class SubClass extends SuperClass {
        @select() foo$: Observable<string>;
      }

      const testInstance = new SubClass();
      testInstance.foo$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));
    });

    it('modifies behaviour of superclass selects in the subclass only', () => {
      class SuperClass {
        @select() foo$: Observable<string>;
      }

      @WithSubStore({ basePathMethodName, localReducer })
      class SubClass extends SuperClass {
        getSubStorePath = (): PathSelector => [ 'a', 'b' ];
      }

      const testSubInstance = new SubClass();
      testSubInstance.foo$
        .take(1)
        .subscribe(v => expect(v).toEqual('Foo!'));

      const testSuperInstance = new SuperClass();
      testSuperInstance.foo$
        .take(1)
        .subscribe(v => expect(v).toEqual('Root Foo!'));
    });
  });
});
