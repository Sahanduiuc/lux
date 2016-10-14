import {_, inject, module} from './tools';
import {getOptions} from '../core/utils';


describe('lux core', function() {

    beforeEach(() => {
        module('lux');
    });

    it('Test getOptions', inject(
        function($window) {
            var t = $window._get_options_tests_ = {};
            let a = 1;

            t.v = a;
            expect(getOptions($window, {options: '_get_options_tests_.v', b: 4})).toBe(a);
            a = 'ciao';
            t.v = a;
            expect(getOptions($window, {options: '_get_options_tests_.v', b: 4})).toBe(a);
            a = {};
            t.v = a;
            expect(getOptions($window, {options: '_get_options_tests_.v', b: 4}).b).toBe(4);
        })
    );

    it('Test $lux', inject(
        function($lux) {
            expect(_.isObject($lux.context)).toBe(true);

            var api = $lux.api('');
            expect(api.baseUrl).toBe('');
            expect(api.path).toBe(undefined);

            api = $lux.api('http://bla.com/foo');
            expect(api.baseUrl).toBe('http://bla.com/foo');
            expect(api.path).toBe(undefined);
        })
    );
});
