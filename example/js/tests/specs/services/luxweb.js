define(['angular',
        'lux',
        'lux/services',
        'tests/mocks/http'], function (angular) {
    'use strict';

    describe('Test lux.webapi module', function () {
        var context = {
                API_URL: '/api'
            },
            $lux,
            scope,
            $httpBackend;

        angular.module('lux.webapi.test', ['lux.loader', 'lux.restapi', 'lux.restapi.mock'])
            .value('context', context);

        beforeEach(function () {
            angular.module('lux.webapi.test');

            inject(['$lux', '$rootScope', '$httpBackend', function (_$lux_, _$rootScope_, _$httpBackend_) {
                $lux = _$lux_;
                scope = _$rootScope_;
                $httpBackend = _$httpBackend_;
            }]);
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('uses default parameters for GETs', function () {
            var client = $lux.api({
                url: context.API_URL,
                params: {
                    defaultParam: 'defaultValue'
                }
            });

            $httpBackend.expectGET('/api?defaultParam=defaultValue&param=value').respond('');

            client.get('/', {param: 'value'});
            expect($httpBackend.flush).not.toThrow();
        });

        it('works without default parameters for GETs', function () {
            var client = $lux.api({
                url: context.API_URL
            });

            $httpBackend.expectGET('/api?param=value').respond('');

            client.get('/', {param: 'value'});
            expect($httpBackend.flush).not.toThrow();
        });

        it('works without any parameters for GETs', function () {
            var client = $lux.api({
                url: context.API_URL
            });

            $httpBackend.expectGET('/api').respond('');

            client.get('/');
            expect($httpBackend.flush).not.toThrow();
        });

        it('formReady should stringify json array', function () {
            var client = scope.api(),
                mock_data = {
                    'jsonArrayField': [1, 2, 3]
                };

            var model = {},
                formScope = {
                    formModelName: 'TestForm',
                    TestFormType: {
                        jsonArrayField: 'json'
                    }
                };

            $httpBackend.expectGET('').respond(mock_data);
            client.defaults().get = true;
            client.formReady(model, formScope);
            $httpBackend.flush();

            expect(typeof model.jsonArrayField).toBe('string');
        });

        it('formReady should set a set array of items', function () {
            var client = scope.api(),
                mock_data = {
                    arrayField: [1, 2, 3],
                    arrayObjectField: [
                        {id: 5},
                        {id: 6}
                    ]
                };

            var model = {},
                formScope = {
                    formModelName: 'TestForm',
                    TestFormType: {}
                };

            $httpBackend.expectGET('').respond(mock_data);
            client.defaults().get = true;
            client.formReady(model, formScope);
            $httpBackend.flush();

            expect(model.arrayField instanceof Array).toBe(true);
            expect(model.arrayObjectField[0]).toBe(5);
            expect(model.arrayObjectField[1]).toBe(6);
        });

        it('formReady should set string value', function () {
            var client = scope.api(),
                mock_data = {
                    stringField: 'testString',
                    objectField: {id: 'testString'}
                };

            var model = {},
                formScope = {
                    formModelName: 'TestForm',
                    TestFormType: {}
                };

            $httpBackend.expectGET('').respond(mock_data);
            client.defaults().get = true;
            client.formReady(model, formScope);
            $httpBackend.flush();

            expect(model.stringField).toBe('testString');
            expect(model.objectField).toBe('testString');
        });
    });

});
