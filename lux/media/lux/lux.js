//      Lux Library - v0.2.0

//      Compiled 2015-09-28.
//      Copyright (c) 2015 - Luca Sbardella
//      Licensed BSD.
//      For all details and documentation:
//      http://quantmind.github.io/lux
//
(function (factory) {
    var root = this;
    if (typeof module === "object" && module.exports)
        root = module.exports;
    //
    if (typeof define === 'function' && define.amd) {
        // Support AMD. Register as an anonymous module.
        // NOTE: List all dependencies in AMD style
        define(['angular'], function (angular) {
            root.lux = factory(angular, root);
            return root.lux;
        });
    } else {
        // No AMD. Set module as a global variable
        // NOTE: Pass dependencies to factory function
        // (assume that angular is also global.)
        root.lux = factory(angular, root);
    }
}(
function(angular, root) {
    "use strict";

    var lux = root.lux || {};
    lux.version = '0.1.0';

    var forEach = angular.forEach,
        extend = angular.extend,
        angular_bootstrapped = false,
        isArray = angular.isArray,
        isString = angular.isString,
        $ = angular.element,
        slice = Array.prototype.slice,
        lazyApplications = {},
        defaults = {
            url: '',    // base url for the web site
            MEDIA_URL: '',  // default url for media content
            hashPrefix: '',
            ngModules: []
        };
    //
    lux.$ = $;
    lux.angular = angular;
    lux.forEach = angular.forEach;
    lux.context = extend({}, defaults, lux.context);
    lux.messages = {};

    // Extend lux context with additional data
    lux.extend = function (context) {
        lux.context = extend(lux.context, context);
        return lux;
    };

    lux.media = function (url, ctx) {
        if (!ctx)
            ctx = lux.context;
        return joinUrl(ctx.url, ctx.MEDIA_URL, url);
    };

    lux.luxApp = function (name, App) {
        lazyApplications[name] = App;
    };

    angular.module('lux.applications', ['lux.services'])

        .directive('luxApp', ['$lux', function ($lux) {
            return {
                restrict: 'AE',
                //
                link: function (scope, element, attrs) {
                    var options = getOptions(attrs),
                        appName = options.luxApp;
                    if (appName) {
                        var App = lazyApplications[appName];
                        if (App) {
                            options.scope = scope;
                            var app = new App(element[0], options);
                            scope.$emit('lux-app', app);
                        } else {
                            $lux.log.error('Application ' + appName + ' not registered');
                        }
                    } else {
                        $lux.log.error('Application name not available');
                    }
                }
            };
        }]);

    lux.context.ngModules.push('lux.applications');

    var _ = lux._ = {},

    pick = _.pick = function (obj, callback) {
        var picked = {},
            val;
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                val = callback(obj[key], key);
                if (val !== undefined)
                    picked[key] = val;
            }
        }
        return picked;
    };
    var
    //
    ostring = Object.prototype.toString,
    //
    generateCallbacks = function () {
        var callbackFunctions = [],
            callFunctions = function () {
                var self = this,
                    args = slice.call(arguments, 0);
                callbackFunctions.forEach(function (f) {
                    f.apply(self, args);
                });
            };
        //
        callFunctions.add = function (f) {
            callbackFunctions.push(f);
        };
        return callFunctions;
    },
    //
    // Add a callback for an event to an element
    addEvent = lux.addEvent = function (element, event, callback) {
        var handler = element[event];
        if (!handler)
            element[event] = handler = generateCallbacks();
        if (handler.add)
            handler.add(callback);
    },
    //
    windowResize = lux.windowResize = function (callback) {
        addEvent(window, 'onresize', callback);
    },
    //
    windowHeight = lux.windowHeight = function () {
        return window.innerHeight > 0 ? window.innerHeight : screen.availHeight;
    },
    //
    isAbsolute = lux.isAbsolute = new RegExp('^([a-z]+://|//)'),
    //
    // Check if element has tagName tag
    isTag = function (element, tag) {
        element = $(element);
        return element.length === 1 && element[0].tagName === tag.toUpperCase();
    },
    //
    joinUrl = lux.joinUrl = function () {
        var bit, url = '';
        for (var i=0; i<arguments.length; ++i) {
            bit = arguments[i];
            if (bit) {
                var cbit = bit,
                    slash = false;
                // remove front slashes if cbit has some
                while (url && cbit.substring(0, 1) === '/')
                    cbit = cbit.substring(1);
                // remove end slashes
                while (cbit.substring(cbit.length-1) === '/') {
                    slash = true;
                    cbit = cbit.substring(0, cbit.length-1);
                }
                if (cbit) {
                    if (url && url.substring(url.length-1) !== '/')
                        url += '/';
                    url += cbit;
                    if (slash)
                        url += '/';
                }
            }
        }
        return url;
    },
    //
    isObject = function (o) {
        return ostring.call(o) === '[object Object]';
    },
    //
    //  getOPtions
    //  ===============
    //
    //  Retrive options for the ``options`` string in ``attrs`` if available.
    //  Used by directive when needing to specify options in javascript rather
    //  than html data attributes.
    getOptions = lux.getOptions = function (attrs) {
        var options;
        if (attrs && typeof attrs.options === 'string') {
            options = getAttribute(root, attrs.options);
            if (typeof options === 'function')
                options = options();
        } else {
            options = {};
        }
        if (isObject(options))
            forEach(attrs, function (value, name) {
                if (name.substring(0, 1) !== '$' && name !== 'options')
                    options[name] = value;
            });
        return options;
    },
    //
    // random generated numbers for a uuid
    s4 = function () {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
    },
    //
    // Extend the initial array with values for other arrays
    extendArray = lux.extendArray = function () {
        if (!arguments.length) return;
        var value = arguments[0],
            push = function (v) {
                value.push(v);
            };
        if (typeof(value.push) === 'function') {
            for (var i=1; i<arguments.length; ++i)
                forEach(arguments[i], push);
        }
        return value;
    },
    //
    //  querySelector
    //  ===================
    //
    //  Simple wrapper for a querySelector
    querySelector = lux.querySelector = function (elem, query) {
        elem = $(elem);
        if (elem.length && query)
            return $(elem[0].querySelector(query));
        else
            return elem;
    },
    //
    //    LoadCss
    //  =======================
    //
    //  Load a style sheet link
    loadedCss = {},
    //
    loadCss = lux.loadCss = function (filename) {
        if (!loadedCss[filename]) {
            loadedCss[filename] = true;
            var fileref = document.createElement("link");
            fileref.setAttribute("rel", "stylesheet");
            fileref.setAttribute("type", "text/css");
            fileref.setAttribute("href", filename);
            document.getElementsByTagName("head")[0].appendChild(fileref);
        }
    },
    //
    //
    globalEval = lux.globalEval = function(data) {
        if (data) {
            // We use execScript on Internet Explorer
            // We use an anonymous function so that context is window
            // rather than jQuery in Firefox
            (root.execScript || function(data) {
                root["eval"].call(root, data );
            })(data);
        }
    },
    //
    // Simple Slugify function
    slugify = lux.slugify = function (str) {
        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();

        // remove accents, swap ñ for n, etc
        var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
        var to   = "aaaaeeeeiiiioooouuuunc------";
        for (var i=0, l=from.length ; i<l ; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
            .replace(/\s+/g, '-') // collapse whitespace and replace by -
            .replace(/-+/g, '-'); // collapse dashes

        return str;
    },
    //
    now = lux.now = function () {
        return Date.now ? Date.now() : new Date().getTime();
    },
    //
    size = lux.size = function (o) {
        if (!o) return 0;
        if (o.length !== undefined) return o.length;
        var n = 0;
        forEach(o, function () {
            ++n;
        });
        return n;
    },
    //
    // Used by the getObject function
    getAttribute = function (obj, name) {
        var bits= name.split('.');

        for (var i=0; i<bits.length; ++i) {
            obj = obj[bits[i]];
            if (!obj) break;
        }
        if (typeof obj === 'function')
            obj = obj();

        return obj;
    },
    //
    //
    //  Get Options
    //  ==============================================
    //
    //  Obtain an object from scope (if available) with fallback to
    //  the global javascript object
    getObject = lux.getObject = function (attrs, name, scope) {
        var key = attrs[name],
            exclude = [name, 'class', 'style'],
            options;

        if (key) {
            // Try the scope first
            if (scope) options = getAttribute(scope, key);

            if (!options) options = getAttribute(root, key);
        }
        if (!options) options = {};

        forEach(attrs, function (value, name) {
            if (name.substring(0, 1) !== '$' && exclude.indexOf(name) === -1)
                options[name] = value;
        });
        return options;
    },

    /**
    * Formats a string (using simple substitution)
    * @param   {String}    str         e.g. "Hello {name}!"
    * @param   {Object}    values      e.g. {name: "King George III"}
    * @returns {String}                e.g. "Hello King George III!"
    */
    formatString = function (str, values) {
        return str.replace(/{(\w+)}/g, function (match, placeholder) {
            return values.hasOwnProperty(placeholder) ? values[placeholder] : '';
        });
    },
    //
    //  Capitalize the first letter of string
    capitalize = function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    lux.messages.no_api = function (url) {
        return {
            text: 'Api client for "' + url + '" is not available',
            icon: 'fa fa-exclamation-triangle'
        };
    };

    //  Lux Api service
    //	===================
    //
    //	A factory of javascript clients to web services
    angular.module('lux.services', [])
        //
        .value('ApiTypes', {})
        //
        .value('AuthApis', {})
        //
        .run(['$lux', function ($lux) {
            //
            var name = $(document.querySelector("meta[name=csrf-param]")).attr('content'),
                csrf_token = $(document.querySelector("meta[name=csrf-token]")).attr('content');

            if (name && csrf_token) {
                $lux.csrf = {};
                $lux.csrf[name] = csrf_token;
            }
        }])
        //
        .service('$lux', ['$location', '$window', '$q', '$http', '$log',
                          '$timeout', 'ApiTypes', 'AuthApis', '$templateCache',
                          '$compile',
                          function ($location, $window, $q, $http, $log, $timeout,
                                      ApiTypes, AuthApis, $templateCache, $compile) {
            var $lux = this;

            this.location = $location;
            this.window = $window;
            this.log = $log;
            this.http = $http;
            this.q = $q;
            this.timeout = $timeout;
            this.apiUrls = {};
            this.$log = $log;
            this.messages = extend({}, lux.messageService, {
                pushMessage: function (message) {
                    this.log($log, message);
                }
            });
            //  Create a client api
            //  -------------------------
            //
            //  context: an api name or an object containing, name, url and type.
            //
            //  name: the api name
            //  url: the api base url
            //  type: optional api type (default is ``lux``)
            this.api = function (url, api) {
                if (arguments.length === 1) {
                    var defaults;
                    if (isObject(url)) {
                        defaults = url;
                        url = url.url;
                    }
                    api = ApiTypes[url];
                    if (!api)
                        $lux.messages.error(lux.messages.no_api(url));
                    else
                        return api(url, this).defaults(defaults);
                } else if (arguments.length === 2) {
                    ApiTypes[url] = api;
                    return api(url, this);
                }
            };

            this.authApi = function (api, auth) {
                if (arguments.length === 1)
                    return AuthApis[api.baseUrl()];
                else if (arguments.length === 2)
                    AuthApis[api.baseUrl()] = auth;
            };

            //
            // Change the form data depending on content type
            this.formData = function (contentType) {

                return function (data) {
                    data = extend(data || {}, $lux.csrf);
                    if (contentType === 'application/x-www-form-urlencoded')
                        return $.param(data);
                    else if (contentType === 'multipart/form-data') {
                        var fd = new FormData();
                        forEach(data, function (value, key) {
                            fd.append(key, value);
                        });
                        return fd;
                    } else {
                        return JSON.stringify(data);
                    }
                };
            };
            //
            // Render a template from a url
            this.renderTemplate = function (url, element, scope, callback) {
                var template = $templateCache.get(url);
                if (!template) {
                    $http.get(url).then(function (resp) {
                        template = resp.data;
                        $templateCache.put(url, template);
                        _render(element, template, scope, callback);
                    }, function (resp) {
                        $lux.messages.error('Could not load template from ' + url);
                    });
                } else
                    _render(element, template, scope, callback);
            };

            function _render(element, template, scope, callback) {
                var elem = $compile(template)(scope);
                element.append(elem);
                if (callback) callback(elem);
            }
        }]);
    //
    function wrapPromise (promise) {

        promise.success = function(fn) {

            return wrapPromise(this.then(function(response) {
                var r = fn(response.data, response.status, response.headers);
                return r === undefined ? response : r;
            }));
        };

        promise.error = function(fn) {

            return wrapPromise(this.then(null, function(response) {
                var r = fn(response.data, response.status, response.headers);
                return r === undefined ? response : r;
            }));
        };

        return promise;
    }

    var ENCODE_URL_METHODS = ['delete', 'get', 'head', 'options'];
    //
    //  Lux API Interface for REST
    //
    var baseapi = function (url, $lux) {
        //
        //  Object containing the urls for the api.
        var api = {},
            defaults = {};

        api.toString = function () {
            if (defaults.name)
                return joinUrl(api.baseUrl(), defaults.name);
            else
                return api.baseUrl();
        };
        //
        // Get/Set defaults options for requests
        api.defaults = function (_) {
            if (!arguments.length) return defaults;
            if (_)
                defaults = _;
            return api;
        };

        api.formReady = function (model, formScope) {
            $ux.log.error('Cannot handle form ready');
        };
        //
        // API base url
        api.baseUrl  = function () {
            return url;
        };
        //
        api.get = function (opts, data) {
            return api.request('get', opts, data);
        };
        //
        api.post = function (opts, data) {
            return api.request('post', opts, data);
        };
        //
        api.put = function (opts, data) {
            return api.request('put', opts, data);
        };
        //
        api.delete = function (opts, data) {
            return api.request('delete', opts, data);
        };
        //
        //  Add additional Http options to the request
        api.httpOptions = function (request) {};
        //
        //  This function can be used to add authentication
        api.authentication = function (request) {};
        //
        //  Return the current user
        //  ---------------------------
        //
        //  Only implemented by apis managing authentication
        api.user = function () {};
        //
        // Perform the actual request and return a promise
        //	method: HTTP method
        //  opts: request options to override defaults
        //	data: body or url data
        api.request = function (method, opts, data) {
            // handle urlparams when not an object
            var o = extend({}, api.defaults());
            o.method = method.toLowerCase();
            if (ENCODE_URL_METHODS.indexOf(o.method) === -1) o.data = data;
            else o.params = data;

            opts = extend(o, opts);

            var d = $lux.q.defer(),
                //
                request = extend({
                    name: opts.name,
                    //
                    deferred: d,
                    //
                    on: wrapPromise(d.promise),
                    //
                    options: opts,
                    //
                    error: function (response) {
                        if (isString(response.data))
                            response.data = {error: true, message: data};
                        d.reject(response);
                    },
                    //
                    success: function (response) {
                        if (isString(response.data))
                            response.data = {message: data};

                        if (!response.data || response.data.error)
                            d.reject(response);
                        else
                            d.resolve(response);
                    }
                });
            //
            delete opts.name;
            if (opts.url === api.baseUrl())
                delete opts.url;
            //
            api.call(request);
            //
            return request.on;
        };

        //
        //  Execute an API call for a given request
        //  This method is hardly used directly,
        //	the ``request`` method is normally used.
        //
        //      request: a request object obtained from the ``request`` method
        api.call = function (request) {
            //
            if (!request.baseUrl && request.name) {
                var apiUrls = $lux.apiUrls[url];

                if (apiUrls) {
                    request.baseUrl = apiUrls[request.name];
                    //
                    // No api url!
                    if (!request.baseUrl)
                        return request.error('Could not find a valid url for ' + request.name);

                    //
                } else {
                    // Fetch the api urls
                    $lux.log.info('Fetching api info');
                    return $lux.http.get(api.baseUrl()).then(function (resp) {
                        $lux.apiUrls[url] = resp.data;
                        api.call(request);
                    }, request.error);
                    //
                }
            }

            if (!request.baseUrl)
                request.baseUrl = api.baseUrl();

            var opts = request.options;

            if (!opts.url) {
                var href = request.baseUrl;
                if (opts.path)
                    href = joinUrl(request.baseUrl, opts.path);
                opts.url = href;
            }

            api.httpOptions(request);

            //
            // Fetch authentication token?
            var r = api.authentication(request);
            if (r) return r;
            //
            var options = request.options;

            if (options.url) {
                $lux.log.info('Executing HTTP ' + options.method + ' request @ ' + options.url);
                $lux.http(options).then(request.success, request.error);
            }
            else
                request.error('Api url not available');
        };

        return api;
    };

    //
    //  CMS api for dynamic web apps
    //  -------------------------------
    //
    angular.module('lux.cms.api', ['lux.services'])

        .run(['$lux', '$window', function ($lux, $window) {
            var pageCache = {};

            $lux.registerApi('cms', {
                //
                url: function (urlparams) {
                    var url = this._url,
                        name = urlparams ? urlparams.slug : null;
                    if (url.substring(url.length-5) === '.json')
                        return url;
                    if (url.substring(url.length-1) !== '/')
                        url += '/';
                    url += name || 'index';
                    if (url.substring(url.length-5) === '.html')
                        url = url.substring(0, url.length-5);
                    else if (url.substring(url.length-1) === '/')
                        url += 'index';
                    if (url.substring(url.length-5) !== '.json')
                        url += '.json';
                    return url;
                },
                //
                getPage: function (page, state, stateParams) {
                    var href = lux.stateHref(state, page.name, stateParams),
                        data = pageCache[href];
                    if (data)
                        return data;
                    //
                    return this.get(stateParams).then(function (response) {
                        var data = response.data;
                        pageCache[href] = data;
                        forEach(data.require_css, function (css) {
                            loadCss(css);
                        });
                        if (data.require_js) {
                            var defer = $lux.q.defer();
                            require(rcfg.min(data.require_js), function () {
                                // let angular resolve its queue if it needs to
                                defer.resolve(data);
                            });
                            return defer.promise;
                        } else
                            return data;
                    }, function (response) {
                        if (response.status === 404) {
                            $window.location.reload();
                        }
                    });
                },
                //
                getItems: function (page, state, stateParams) {}
            });
        }]);

    //
    //	Angular Module for JS clients of Lux Rest APIs
    //	====================================================
    //
    //	If the ``API_URL`` is defined at root scope, register the
    //	javascript client with the $lux service and add functions to the root
    //	scope to retrieve the api client handler and user informations
    angular.module('lux.restapi', ['lux.services'])

        .run(['$rootScope', '$lux', function ($scope, $lux) {

            // If the root scope has an API_URL register the luxrest client
            if ($scope.API_URL) {
                var web = $lux.api('', luxweb);
                //
                $lux.api($scope.API_URL, luxrest).scopeApi($scope, web);
            }

        }]);

    //
    //  API handler for lux rest api
    //
    //  This handler connects to lux-based rest apis and
    //
    //  * Perform authentication using username/email & password
    //  * After authentication a JWT is received and stored in the localStorage or sessionStorage
    //  * Optional second factor authentication
    //  --------------------------------------------------
    var luxrest = function (url, $lux) {

        var api = luxweb(url, $lux);

        api.httpOptions = function (request) {
            var options = request.options,
                headers = options.headers;
            if (!headers)
                options.headers = headers = {};
            headers['Content-Type'] = 'application/json';
        };

        // Add authentication token if available
        api.authentication = function (request) {
            //
            // If the call is for the authorizations_url api, add callback to store the token
            if (request.name === 'authorizations_url' &&
                    request.options.url === request.baseUrl &&
                    request.options.method === 'post') {

                request.on.success(function(data, status) {
                    api.token(data.token);
                });

            } else {
                var jwt = api.token();

                if (jwt) {
                    var headers = request.options.headers;
                    if (!headers)
                        request.options.headers = headers = {};

                    headers.Authorization = 'Bearer ' + jwt;
                }
            }
        };

        return api;
    };



    //
    //	LUX API
    //	===================
    //
    //  Angular module for interacting with lux-based REST APIs
    angular.module('lux.webapi', ['lux.services'])

        .run(['$rootScope', '$lux', function ($scope, $lux) {
            //
            if ($scope.API_URL) {
                $lux.api($scope.API_URL, luxweb).scopeApi($scope);
            }
        }]);


    var //
        //  HTTP verbs which don't send a csrf token in their requests
        CSRFset = ['get', 'head', 'options'],
        //
        luxweb = function (url, $lux) {

            var api = baseapi(url, $lux),
                request = api.request,
                auth_name = 'authorizations_url',
                web;

            // Set the name of the authentication endpoints
            api.authName = function (name) {
                if (arguments.length === 1) {
                    auth_name = name;
                    return api;
                } else
                    return auth_name;
            };

            // Set/Get the JWT token
            api.token = function (token) {
                var auth = $lux.authApi(api);
                if (auth) return auth.token();

                var key = 'luxtoken-' + api.baseUrl();

                if (arguments.length) {
                    if (token) {
                        // Set the token
                        var decoded = lux.decodeJWToken(token);
                        if (decoded.storage === 'session')
                            sessionStorage.setItem(key, token);
                        else
                            localStorage.setItem(key, token);
                    } else {
                        sessionStorage.removeItem(key);
                        localStorage.removeItem(key);
                    }
                    return api;
                } else {
                    // Obtain the token
                    token = localStorage.getItem(key);
                    if (!token) token = sessionStorage.getItem(key);
                    return token;
                }
            };

            // Perform Logout
            api.logout = function (scope) {
                var auth = $lux.authApi(api);
                if (auth) return auth.logout(scope);

                scope.$emit('pre-logout');
                api.post({
                    name: api.authName(),
                    path: '/logout'
                }).then(function () {
                    scope.$emit('after-logout');
                    api.token(undefined);
                    $lux.window.location.reload();
                }, function (response) {
                    $lux.messages.error('Error while logging out');
                });
            };

            // Get the user fro the JWT
            api.user = function () {
                var token = api.token();
                if (token) {
                    var u = lux.decodeJWToken(token);
                    u.token = token;
                    return u;
                }
            };

            // Redirect to the LOGIN_URL
            api.login = function () {
                $lux.window.location.href = lux.context.LOGIN_URL;
                $lux.window.reload();
            };

            //
            //  Fired when a lux form uses this api to post data
            //
            //  Check the run method in the "lux.services" module for more information
            api.formReady = function (model, formScope) {
                var resolve = api.defaults().get;
                if (resolve) {
                    api.get().success(function (data) {
                        forEach(data, function (value, key) {
                            // TODO: do we need a callback for JSON fields?
                            // or shall we leave it here?
                            if (isObject(value)) value = JSON.stringify(value, null, 4);
                            model[key] = value;
                        });
                    });
                }
            };

            //  override request and attach error callbacks
            api.request = function (method, opts, data) {
                var promise = request.call(api, method, opts, data);
                promise.error(function (data, status) {
                    if (status === 401)
                        api.login();
                    else if (!status)
                        $lux.log.error('Server down, could not complete request');
                    else if (status === 404)
                        $lux.log.info('Endpoint not found' + ((opts.path) ? ' @ ' + opts.path : ''));
                });
                return promise;
            };

            api.httpOptions = function (request) {
                var options = request.options;

                if ($lux.csrf && CSRFset.indexOf(options.method === -1)) {
                    options.data = extend(options.data || {}, $lux.csrf);
                }

                if (!options.headers)
                    options.headers = {};
                options.headers['Content-Type'] = 'application/json';
            };

            //
            // Initialise a scope with this api
            api.scopeApi = function (scope, auth) {
                //  Get the api client
                if (auth) {
                    // Register auth as the authentication client of this api
                    $lux.authApi(api, auth);
                    auth.authName(null);
                }

                scope.api = function () {
                    return $lux.api(url);
                };

                //  Get the current user
                scope.getUser = function () {
                    return api.user();
                };

                //  Logout the current user
                scope.logout = function (e) {
                    if (e && e.preventDefault) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    if (api.user()) {
                        api.logout(scope);
                    }
                };
            };

            return api;
        };

    //
    //  Hash scrolling service
    angular.module('lux.scroll', [])
        //
        // Switch off scrolling managed by angular
        //.value('$anchorScroll', angular.noop)
        //
        .value('scrollDefaults', {
            // Time to complete the scrolling (seconds)
            time: 1,
            // Offset relative to hash links
            offset: 0,
            // Number of frames to use in the scroll transition
            frames: 25,
            // If true, scroll to top of the page when hash is empty
            topPage: true,
            //
            scrollTargetClass: 'scroll-target',
            //
            scrollTargetClassFinish: 'finished'
        })
        //
        // Switch off scrolling managed by angular
        .config(['$anchorScrollProvider', function ($anchorScrollProvider) {
            $anchorScrollProvider.disableAutoScrolling();
        }])
        //
        .run(['$rootScope', '$location', '$log', '$timeout', 'scrollDefaults',
                function(scope, location, log, timer, scrollDefaults) {
            //
            var target = null,
                scroll = scope.scroll = extend({}, scrollDefaults, scope.scroll);
            //
            scroll.browser = true;
            scroll.path = false;
            //
            scope.$location = location;
            //
            // This is the first event triggered when the path location changes
            scope.$on('$locationChangeSuccess', function() {
                if (!scroll.path) {
                    scroll.browser = true;
                    _clear();
                }
            });

            // Watch for path changes and check if back browser button was used
            scope.$watch(function () {
                return location.path();
            }, function (newLocation, oldLocation) {
                if (!scroll.browser) {
                    scroll.path = newLocation !== oldLocation;
                    if (!scroll.path)
                        scroll.browser = true;
                } else
                    scroll.path = false;
            });

            // Watch for hash changes
            scope.$watch(function () {
                return location.hash();
            }, function (hash) {
                if (!(scroll.path || scroll.browser))
                    toHash(hash);
            });

            scope.$on('$viewContentLoaded', function () {
                var hash = location.hash();
                if (!scroll.browser)
                    toHash(hash, 0);
            });
            //
            function toHash (hash, delay) {
                timer(function () {
                    _toHash(hash, delay);
                });
            }
            //
            function _toHash (hash, delay) {
                if (target)
                    return;
                if (!hash && !scroll.topPage)
                    return;
                // set the location.hash to the id of
                // the element you wish to scroll to.
                if (typeof(hash) === 'string') {
                    var highlight = true;
                    if (hash.substring(0, 1) === '#')
                        hash = hash.substring(1);
                    if (hash)
                        target = document.getElementById(hash);
                    else {
                        highlight = false;
                        target = document.getElementsByTagName('body');
                        target = target.length ? target[0] : null;
                    }
                    if (target) {
                        _clearTargets();
                        target = $(target);
                        if (highlight)
                            target.addClass(scroll.scrollTargetClass)
                                  .removeClass(scroll.scrollTargetClassFinish);
                        log.info('Scrolling to target #' + hash);
                        _scrollTo(delay);
                    }
                }
            }

            function _clearTargets () {
                forEach(document.querySelectorAll('.' + scroll.scrollTargetClass), function (el) {
                    $(el).removeClass(scroll.scrollTargetClass);
                });
            }

            function _scrollTo (delay) {
                var stopY = elmYPosition(target[0]) - scroll.offset;

                if (delay === 0) {
                    window.scrollTo(0, stopY);
                    _finished();
                } else {
                    var startY = currentYPosition(),
                        distance = stopY > startY ? stopY - startY : startY - stopY,
                        step = Math.round(distance / scroll.frames);

                    if (delay === null || delay === undefined) {
                        delay = 1000*scroll.time/scroll.frames;
                        if (distance < 200)
                            delay = 0;
                    }
                    _nextScroll(startY, delay, step, stopY);
                }
            }

            function _nextScroll (y, delay, stepY, stopY) {
                var more = true,
                    y2, d;
                if (y < stopY) {
                    y2 = y + stepY;
                    if (y2 >= stopY) {
                        more = false;
                        y2 = stopY;
                    }
                    d = y2 - y;
                } else {
                    y2 = y - stepY;
                    if (y2 <= stopY) {
                        more = false;
                        y2 = stopY;
                    }
                    d = y - y2;
                }
                timer(function () {
                    window.scrollTo(0, y2);
                    if (more)
                        _nextScroll(y2, delay, stepY, stopY);
                    else {
                        _finished();
                    }
                }, delay);
            }

            function _finished () {
                // Done with it - set the hash in the location
                // location.hash(target.attr('id'));
                if (target.hasClass(scroll.scrollTargetClass))
                    target.addClass(scroll.scrollTargetClassFinish);
                target = null;
                _clear();
            }

            function _clear (delay) {
                if (delay === undefined) delay = 0;
                timer(function () {
                    log.info('Reset scrolling');
                    scroll.browser = false;
                    scroll.path = false;
                }, delay);
            }

            function currentYPosition() {
                // Firefox, Chrome, Opera, Safari
                if (window.pageYOffset) {
                    return window.pageYOffset;
                }
                // Internet Explorer 6 - standards mode
                if (document.documentElement && document.documentElement.scrollTop) {
                    return document.documentElement.scrollTop;
                }
                // Internet Explorer 6, 7 and 8
                if (document.body.scrollTop) {
                    return document.body.scrollTop;
                }
                return 0;
            }

            /* scrollTo -
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            function elmYPosition(node) {
                var y = node.offsetTop;
                while (node.offsetParent && node.offsetParent != document.body) {
                    node = node.offsetParent;
                    y += node.offsetTop;
                }
                return y;
            }

        }]);
    //
    //  Lux Static site JSON API
    //  ------------------------
    //
    //  Api used by static sites
    angular.module('lux.static.api', ['lux.services'])

        .run(['$lux', '$window', function ($lux, $window) {
            var pageCache = {};

            $lux.$window = $window;
            //
            if (scope.API_URL)
                $lux.api(scope.API_URL, luxstatic);
        }]);


    var luxstatic = function (url, $lux) {

        var api = baseapi(url, $lux);

        api.url = function (urlparams) {
            var url = this._url,
                name = urlparams ? urlparams.slug : null;
            if (url.substring(url.length-5) === '.json')
                return url;
            if (url.substring(url.length-1) !== '/')
                url += '/';
            url += name || 'index';
            if (url.substring(url.length-5) === '.html')
                url = url.substring(0, url.length-5);
            else if (url.substring(url.length-1) === '/')
                url += 'index';
            if (url.substring(url.length-5) !== '.json')
                url += '.json';
            return url;
        };

        api.getPage = function (page, state, stateParams) {
            var href = lux.stateHref(state, page.name, stateParams),
                data = pageCache[href];
            if (data)
                return data;
            //
            return this.get(stateParams).then(function (response) {
                var data = response.data;
                pageCache[href] = data;
                forEach(data.require_css, function (css) {
                    loadCss(css);
                });
                if (data.require_js) {
                    var defer = $lux.q.defer();
                    require(rcfg.min(data.require_js), function () {
                        // let angular resolve its queue if it needs to
                        defer.resolve(data);
                    });
                    return defer.promise;
                } else
                    return data;
            }, function (response) {
                if (response.status === 404) {
                    $window.location.reload();
                }
            });
        };

        api.getItems = function (page, state, stateParams) {
            if (page.apiItems)
                return this.getList({url: this._url + '.json'});
        };

        return api;
    };



    //
    //	Decode JWT
    //	================
    //
    //	Decode a JASON Web Token and return the decoded object
    lux.decodeJWToken = function (token) {
        var parts = token.split('.');

        if (parts.length !== 3) {
            throw new Error('JWT must have 3 parts');
        }

        var decoded = urlBase64Decode(parts[1]);
        if (!decoded) {
            throw new Error('Cannot decode the token');
        }

        return JSON.parse(decoded);
    };


    function urlBase64Decode (str) {
        var output = str.replace('-', '+').replace('_', '/');
        switch (output.length % 4) {

            case 0: { break; }
        case 2: { output += '=='; break; }
        case 3: { output += '='; break; }
        default: {
                throw 'Illegal base64url string!';
            }
        }
        //polifyll https://github.com/davidchambers/Base64.js
        return decodeURIComponent(escape(window.atob(output)));
    }

    //
    //  SockJS Module
    //  ==================
    //
    //
    //
    angular.module('lux.sockjs', [])

        .run(['$rootScope', '$log', function (scope, log) {

            var websockets = {},
                websocketChannels = {};

            scope.websocketListener = function (channel, callback) {
                var callbacks = websocketChannels[channel];
                if (!callbacks) {
                    callbacks = [];
                    websocketChannels[channel] = callbacks;
                }
                callbacks.push(callback);
            };

            scope.sendMessage = function (url, msg, forceEncode) {
                var sock = websockets[url];
                if (!sock) {
                    log.error('Attempted to send message to disconnected WebSocket: ' + url);
                } else {
                    if (typeof msg !== 'string' || forceEncode) {
                        msg = JSON.stringify(msg);
                    }
                    sock.send(msg);
                }
            };

            scope.disconnectSockJs = function(url) {
                if (websockets[url])
                    websockets[url].close();
            };

            scope.connectSockJs = function (url) {
                if (websockets[url]) {
                    log.warn('Already connected with ' + url);
                    return;
                }

                require(['sockjs'], function (SockJs) {
                    var sock = new SockJs(url);

                    websockets[url] = sock;

                    sock.onopen = function() {
                        websockets[url] = sock;
                        log.info('New connection with ' + url);
                    };

                    sock.onmessage = function (e) {
                        var msg = angular.fromJson(e.data),
                            listeners;
                        log.info('event', msg.event);
                        if (msg.channel)
                            listeners = websocketChannels[msg.channel];
                        if (msg.data)
                            msg.data = angular.fromJson(msg.data);
                        angular.forEach(listeners, function (listener) {
                            listener(sock, msg);
                        });

                    };

                    sock.onclose = function() {
                        delete websockets[url];
                        log.warn('Connection with ' + url + ' CLOSED');
                    };
                });
            };

            if (scope.STREAM_URL)
                scope.connectSockJs(scope.STREAM_URL);
        }]);

    angular.module('lux.cms', [
        'lux.cms.core',
        'lux.cms.component.text'])

    .run(['$rootScope', 'CMS', function(scope, CMS) {

        scope.cms = new CMS();
    }])

    .factory('CMS', ['Component', function(Component) {

        var CMS = function CMS() {
            var self = this;

            self.components = new Component(self);
        };

        return CMS;
    }]);

angular.module('lux.cms.component', ['lux.services', 'templates-cms'])
    //
    // Defaults for cms components
    .value('cmsDefaults', {
    })
    //
    .factory('Component', ['$q', '$rootScope', function($q, $rootScope) {
        /**
         * Component provides the ability to register public methods events inside an app and allow
         * for other components to use the component via featureName.raise.methodName and featureName.on.eventName(function(args){}).
         *
         * @appInstance: App which the API is for
         * @compnentId: Unique id in case multiple API instances do exist inside the same Angular environment
         */
        var Component = function Component(appInstance, componentId) {
            this.gantt = appInstance;
            this.componentId = componentId;
            this.eventListeners = [];
        };

        /**
         * Registers a new event for the given feature.
         *
         * @featureName: Name of the feature that raises the event
         * @eventName: Name of the event
         *
         * To trigger the event call:
         * .raise.eventName()
         *
         * To register a event listener call:
         * .on.eventName(scope, callBackFn, _this)
         * scope: A scope reference to add a deregister call to the scopes .$on('destroy')
         * callBackFn: The function to call
         * _this: Optional this context variable for callbackFn. If omitted, gantt.api will be used for the context
         *
         * .on.eventName returns a de-register funtion that will remove the listener. It's not necessary to use it as the listener
         * will be removed when the scope is destroyed.
         */
        Component.prototype.registerEvent = function(featureName, eventName) {
            var self = this;
            if (!self[featureName]) {
                self[featureName] = {};
            }

            var feature = self[featureName];
            if (!feature.on) {
                feature.on = {};
                feature.raise = {};
            }

            var eventId = 'event:component:' + this.componentId + ':' + featureName + ':' + eventName;

            // Creating raise event method: featureName.raise.eventName
            feature.raise[eventName] = function() {
                $rootScope.$emit.apply($rootScope, [eventId].concat(Array.prototype.slice.call(arguments)));
            };

            // Creating on event method: featureName.oneventName
            feature.on[eventName] = function(scope, handler, _this) {
                var deregAngularOn = registerEventWithAngular(eventId, handler, self.gantt, _this);

                var listener = {
                    handler: handler,
                    dereg: deregAngularOn,
                    eventId: eventId,
                    scope: scope,
                    _this: _this
                };
                self.eventListeners.push(listener);

                var removeListener = function() {
                    listener.dereg();
                    var index = self.eventListeners.indexOf(listener);
                    self.eventListeners.splice(index, 1);
                };

                scope.$on('$destroy', function() {
                    removeListener();
                });

                return removeListener;
            };
        };

        /**
         * @ngdoc function
         * @name registerEventsFromObject
         * @description Registers features and events from a simple objectMap.
         * eventObjectMap must be in this format (multiple features allowed)
         * <pre>
         * {featureName:
         *        {
         *          eventNameOne:function(args){},
         *          eventNameTwo:function(args){}
         *        }
         *  }
         * </pre>
         * @param {object} eventObjectMap map of feature/event names
         */
        Component.prototype.registerEventsFromObject = function (eventObjectMap) {
          var self = this;
          var features = [];
          angular.forEach(eventObjectMap, function (featProp, featPropName) {
            var feature = {name: featPropName, events: []};
            angular.forEach(featProp, function (prop, propName) {
              feature.events.push(propName);
            });
            features.push(feature);
          });

          features.forEach(function (feature) {
            feature.events.forEach(function (event) {
              self.registerEvent(feature.name, event);
            });
          });

        };


        function registerEventWithAngular(eventId, handler, app, _this) {
            return $rootScope.$on(eventId, function() {
                var args = Array.prototype.slice.call(arguments);
                args.splice(0, 1); // Remove evt argument
                handler.apply(_this ? _this : app, args);
            });
        }

        /**
         * Registers a new event for the given feature
         *
         * @featureName: Name of the feature
         * @methodName: Name of the method
         * @callBackFn: Function to execute
         * @_this: Binds callBackFn 'this' to _this. Defaults to Api.app
         */
        Component.prototype.registerMethod = function(featureName, methodName, callBackFn, _this) {
            var self = this;

            if (!this[featureName]) {
                this[featureName] = {};
            }

            var feature = this[featureName];
            feature[methodName] = function() {
                callBackFn.apply(_this || this.app, arguments);
            };
        };

        /**
         * @ngdoc function
         * @name registerMethodsFromObject
         * @description Registers features and methods from a simple objectMap.
         * eventObjectMap must be in this format (multiple features allowed)
         * <br>
         * {featureName:
         *        {
         *          methodNameOne:function(args){},
         *          methodNameTwo:function(args){}
         *        }
         * @param {object} eventObjectMap map of feature/event names
         * @param {object} _this binds this to _this for all functions.  Defaults to gridApi.grid
         */
        Component.prototype.registerMethodsFromObject = function (methodMap, _this) {
          var self = this;
          var features = [];
          angular.forEach(methodMap, function (featProp, featPropName) {
            var feature = {name: featPropName, methods: []};
            angular.forEach(featProp, function (prop, propName) {
              feature.methods.push({name: propName, fn: prop});
            });
            features.push(feature);
          });

          features.forEach(function (feature) {
            feature.methods.forEach(function (method) {
              self.registerMethod(feature.name, method.name, method.fn, _this);
            });
          });

        };

        return Component;
    }]);


angular.module('lux.cms.component.text', ['lux.cms.component'])

    .run(['cmsDefaults', function (cmsDefaults) {

        // Add cms text defaults to cmsDefaults
        angular.extend(cmsDefaults, {
            linksTemplate: 'cms/templates/list-group.tpl.html'
        });
    }])

    .factory('textComponent', ['$rootScope', '$lux', function($rootScope, $lux) {

        return {
            componentId: null,
            //
            element: null,
            //
            api: {
                path: 'cms/components/text',
            },
            //
            getData: function(componentId) {
                // TODO: change it to fetch data from api.lux
                return testData.getComponents()[componentId].content;
            },
            initialize: function(componentId, element) {
                var self = this;

                self.element = element;
                self.componentId = componentId;

                var component = {
                    events: {
                        text: {

                        }
                    },
                    methods: {
                        text: {
                            render: function() {
                                self.element.html(self.getData(self.componentId));
                            }
                        }
                    }
                };

                $rootScope.cms.components.registerEventsFromObject(component.events);
                $rootScope.cms.components.registerMethodsFromObject(component.methods);
            }
        };
    }])

    .directive('text', ['textComponent', function(textComponent) {
        return {
            priority: -200,
            scope: false,
            require: 'renderComponent',
            link: {
                pre: function(scope, element, attrs) {
                    var componentId = attrs.id;
                    textComponent.initialize(componentId, element);
                    scope.cms.components.text.render();
                }
            }
        };
    }])
    //
    // Display a div with links to content
    .directive('cmsLinks', ['$lux', 'cmsDefaults', '$scrollspy',
                            function ($lux, cmsDefaults, $scrollspy) {

        return {
            restrict: 'AE',
            link: function (scope, element, attrs) {
                var config = lux.getObject(attrs, 'config', scope),
                    http = $lux.http;

                if (config.url) {
                    http.get(config.url).then(function (response) {
                        scope.links = response.data.result;
                        $lux.renderTemplate(cmsDefaults.linksTemplate, element, scope, function (elem) {
                            if (config.hasOwnProperty('scrollspy'))
                                $scrollspy(element);
                        });
                    }, function (response) {
                        $lux.messages.error('Could not load links');
                    });
                }
            }
        };
    }]);

angular.module('lux.cms.core', [])
    //
    .constant('cmsDefaults', {})
    //
    .service('pageBuilder', ['$http', '$document', '$filter', '$compile', 'orderByFilter', 'cmsDefaults', function($http, $document, $filter, $compile, orderByFilter, cmsDefaults) {
        var self = this;

        extend(this, {
            layout: {},
            //
            scope: null,
            //
            element: null,
            //
            init: function(scope, element, layout) {
                self.scope = scope;
                self.element = element;
                self.layout = layout;
            },
            // Add columns to row
            addColumns: function(row, rowIdx, columns) {
                var components,
                    column,
                    colIdx = 0;

                forEach(columns, function(col) {
                    components = orderByFilter($filter('filter')(self.layout.components, {row: rowIdx, col: colIdx}, true), '+pos');
                    column = angular.element($document[0].createElement('div'))
                                .addClass(col);

                    if (components.length == 1)
                        column.append('<render-component id="' + components[0].id + '" ' + components[0].type + '></render-component>');
                    else if (components.length > 1) {
                        forEach(components, function(component) {
                            column.append('<render-component id="' + component.id + '" ' + component.type + '></render-component>');
                        });
                    }

                    row.append(column);
                    ++colIdx;
                });

                row = $compile(row)(self.scope);
            },
            //
            buildLayout: function() {
                var row,
                    rowIdx = 0;

                forEach(self.layout.rows, function(columns) {
                    row = angular.element($document[0].createElement('div')).addClass('row');
                    self.addColumns(row, rowIdx, columns);
                    self.element.append(row);
                    ++rowIdx;
                });
            }
        });
    }])
    //
    .controller('pageController', [function() {
        var self = this;
    }])
    //
    .directive('renderPage', ['pageBuilder', 'testData', function(pageBuilder, testData) {
        return {
            replace: true,
            link: {
                post: function(scope, element, attrs) {
                    var layout = testData.getLayout();

                    pageBuilder.init(scope, element, layout);
                    pageBuilder.buildLayout();

                    scope.$on('$viewContentLoaded', function(){
                        console.log(scope);
                    });
                }
            }
        };
    }])
    //
    .directive('renderComponent', ['cmsDefaults', function(cmsDefaults) {
        return {
            replace: true,
            transclude: true,
            controller: 'pageController',
            scope: {
                componentId: '@id'
            },
            compile: function() {
                return {
                    post: function(scope, element, attrs, ctrl) {}
                };
            }
        };
    }]);




    //  Lux Page
    //  ==============
    //
    //  Design to work with the ``lux.extension.angular``
    angular.module('lux.page', ['lux.form', 'lux.scroll', 'templates-page'])
        //
        .service('pageService', ['$lux', 'dateFilter', function ($lux, dateFilter) {

            this.addInfo = function (page, $scope) {
                if (!page)
                    return $lux.log.error('No page, cannot add page information');
                if (page.head && page.head.title) {
                    document.title = page.head.title;
                }
                if (page.author) {
                    if (page.author instanceof Array)
                        page.authors = page.author.join(', ');
                    else
                        page.authors = page.author;
                }
                var date;
                if (page.date) {
                    try {
                        date = new Date(page.date);
                    } catch (e) {
                        $lux.log.error('Could not parse date');
                    }
                    page.date = date;
                    page.dateText = dateFilter(date, $scope.dateFormat);
                }
                page.toString = function () {
                    return this.name || this.url || '<noname>';
                };

                return page;
            };

            this.formatDate = function (dt, format) {
                if (!dt)
                    dt = new Date();
                return dateFilter(dt, format || 'yyyy-MM-ddTHH:mm:ss');
            };
        }])
        //
        .controller('Page', ['$scope', '$log', '$lux', 'pageService', function ($scope, log, $lux, pageService) {
            //
            $lux.log.info('Setting up angular page');
            //
            var page = $scope.page;
            // If the page is a string, retrieve it from the pages object
            if (typeof page === 'string')
                page = $scope.pages ? $scope.pages[page] : null;
            $scope.page = pageService.addInfo(page, $scope);
            //
            $scope.togglePage = function ($event) {
                $event.preventDefault();
                $event.stopPropagation();
                this.link.active = !this.link.active;
            };

            $scope.loadPage = function ($event) {
                $scope.page = this.link;
            };

            $scope.activeLink = function (url) {
                var loc;
                if (isAbsolute.test(url))
                    loc = $lux.location.absUrl();
                else
                    loc = window.location.pathname;
                var rest = loc.substring(url.length),
                    base = loc.substring(0, url.length),
                    folder = url.substring(url.length-1) === '/';
                return base === url && (folder || (rest === '' || rest.substring(0, 1) === '/'));
            };

            //
            $scope.$on('animIn', function() {
                log.info('Page ' + page.toString() + ' animation in');
            });
            $scope.$on('animOut', function() {
                log.info('Page ' + page.toString() + ' animation out');
            });
        }])

        .service('$breadcrumbs', [function () {

            this.crumbs = function () {
                var loc = window.location,
                    path = loc.pathname,
                    steps = [],
                    last = {
                        href: loc.origin
                    };
                if (last.href.length >= lux.context.url.length)
                    steps.push(last);

                path.split('/').forEach(function (name) {
                    if (name) {
                        last = {
                            label: name.split('-').map(capitalize).join(' '),
                            href: joinUrl(last.href, name+'/')
                        };
                        if (last.href.length >= lux.context.url.length)
                            steps.push(last);
                    }
                });
                if (steps.length) {
                    last = steps[steps.length-1];
                    if (path.substring(path.length-1) !== '/' && last.href.substring(last.href.length-1) === '/')
                        last.href = last.href.substring(0, last.href.length-1);
                    last.last = true;
                    steps[0].label = 'Home';
                }
                return steps;
            };
        }])
        //
        //  Directive for displaying breadcrumbs navigation
        .directive('breadcrumbs', ['$breadcrumbs', '$rootScope', function ($breadcrumbs, $rootScope) {
            return {
                restrict: 'AE',
                replace: true,
                templateUrl: "page/breadcrumbs.tpl.html",
                link: {
                    post: function (scope) {
                        var renderBreadcrumb = function() {
                            scope.steps = $breadcrumbs.crumbs();
                        };

                        $rootScope.$on('$viewContentLoaded', function () {
                            renderBreadcrumb();
                        });

                        renderBreadcrumb();
                    }
                }
            };
        }])
        //
        //  Simply display the current yeat
        .directive('year', function () {
            return {
                restrict: 'AE',
                link: function (scope, element) {
                    var dt = new Date();
                    element.html(dt.getFullYear()+'');
                }
            };
        });

    //
    //	Lux.router
    //	===================
    //
    //	Drop in replacement for lux.ui.router when HTML5_NAVIGATION is off.
    //
    angular.module('lux.router', ['lux.page'])
        //
        .config(['$locationProvider', function ($locationProvider) {
            //
            // Enable html5mode but set the hash prefix to something different from #
            $locationProvider.html5Mode({
                enabled: true,
                requireBase: false,
                rewriteLinks: false
            }).hashPrefix(lux.context.hashPrefix);
        }]);

    //
    //  UI-Routing
    //
    //  Configure ui-Router using lux routing objects
    //  Only when context.html5mode is true
    //  Python implementation in the lux.extensions.angular Extension
    //

    // Hack for delaying with ui-router state.href
    // TODO: fix this!
    var stateHref = lux.stateHref = function (state, State, Params) {
        if (Params) {
            var url = state.href(State, Params);
            return url.replace(/%2F/g, '/');
        } else {
            return state.href(State);
        }
    };

    //
    //  Lux State Provider
    //	========================
    //
    //	Complements the lux server and angular ui.router
    function LuxStateProvider ($stateProvider, $urlRouterProvider) {

        var states = lux.context.states,
            pages = lux.context.pages;

        //
        //  Use this function to add/override the state
        //  configuration of state ``name``.
        //  * name, name of the state to add/update
        //  * config, object or function returning an object.
        this.state = function (name, config) {
            if (pages) {
                var page = pages[name];

                page || (page = {});

                if (angular.isFunction(config))
                    config = config(page);

                pages[name] = angular.extend(page, config);
            }

            return this;
        };

        //
        //  Setup $stateProvider
        //  =========================
        //
        //  This method should be called by the application, once it has setup
        //  all the states via the ``state`` method.
        this.setup = function () {
            //
            if (pages) {
                forEach(states, function (name) {
                    var page = pages[name];
                    // Redirection
                    if (page.redirectTo)
                        $urlRouterProvider.when(page.url, page.redirectTo);
                    else {
                        if (!name) name = 'home';

                        if (page.resolveTemplate) {
                            delete page.resolveTemplate;
                            var templateUrl = page.templateUrl;

                            page.templateUrl = function ($stateParams){
                                var url = templateUrl;
                                forEach($stateParams, function (value, name) {
                                    url = url.replace(':' + name, value);
                                });
                                return url;
                            };
                        }

                        $stateProvider.state(name, page);
                    }
                });
            }
        };

        this.$get = function () {

            return {};
        };
    }


    angular.module('lux.ui.router', ['lux.page', 'ui.router'])
        //
        .run(['$rootScope', '$state', '$stateParams', function (scope, $state, $stateParams) {
            //
            // It's very handy to add references to $state and $stateParams to the $rootScope
            scope.$state = $state;
            scope.$stateParams = $stateParams;
        }])
        //
        .provider('luxState', ["$stateProvider", "$urlRouterProvider", LuxStateProvider])
        //
        .config(['$locationProvider', function ($locationProvider) {
            //
            $locationProvider.html5Mode(true).hashPrefix(lux.context.hashPrefix);
            $(document.querySelector('#seo-view')).remove();
            lux.context.uiRouterEnabled = true;
        }])
        //
        // Default controller for an Html5 page loaded via the ui router
        .controller('Html5', ['$scope', '$state', 'pageService', 'page', 'items',
            function ($scope, $state, pageService, page, items) {
                $scope.items = items ? items.data : null;
                $scope.page = pageService.addInfo(page, $scope);
            }])
        //
        // A directive to compile Html received from the server
        // A page that returns html should use the following template
        //  <div data-compile-html></div>
        .directive('compileHtml', ['$compile', function ($compile) {

            return {
                link: function (scope, element) {
                    scope.$on('$stateChangeSuccess', function () {
                        var page = scope.page;
                        if (page && page.html) {
                            var html = page.html;
                            if (html.main) html = html.main;
                            element.html(html);
                            var scripts= element[0].getElementsByTagName('script');
                            // Execute scripts in the loaded html
                            forEach(scripts, function (js) {
                                globalEval(js.innerHTML);
                            });
                            $compile(element.contents())(scope);
                            // load required scripts if necessary
                            lux.loadRequire();
                        }
                    });
                }
            };
        }]);

    //
    // Form module for lux
    //
    //  Forms are created form a JSON object
    //
    //  Forms layouts:
    //
    //      - default
    //      - inline
    //      - horizontal
    //
    //  Events:
    //
    //      formReady: triggered once the form has rendered
    //          arguments: formmodel, formscope
    //
    //      formFieldChange: triggered when a form field changes:
    //          arguments: formmodel, field (changed)
    //
    angular.module('lux.form', ['lux.form.utils'])
        //
        .constant('formDefaults', {
            // Default layout
            layout: 'default',
            // for horizontal layout
            labelSpan: 2,
            showLabels: true,
            novalidate: true,
            //
            formErrorClass: 'form-error',
            FORMKEY: 'm__form'
        })
        //
        .constant('defaultFormElements', function () {
            return {
                'text': {element: 'input', type: 'text', editable: true, textBased: true},
                'date': {element: 'input', type: 'date', editable: true, textBased: true},
                'datetime': {element: 'input', type: 'datetime', editable: true, textBased: true},
                'datetime-local': {element: 'input', type: 'datetime-local', editable: true, textBased: true},
                'email': {element: 'input', type: 'email', editable: true, textBased: true},
                'month': {element: 'input', type: 'month', editable: true, textBased: true},
                'number': {element: 'input', type: 'number', editable: true, textBased: true},
                'password': {element: 'input', type: 'password', editable: true, textBased: true},
                'search': {element: 'input', type: 'search', editable: true, textBased: true},
                'tel': {element: 'input', type: 'tel', editable: true, textBased: true},
                'textarea': {element: 'textarea', editable: true, textBased: true},
                'time': {element: 'input', type: 'time', editable: true, textBased: true},
                'url': {element: 'input', type: 'url', editable: true, textBased: true},
                'week': {element: 'input', type: 'week', editable: true, textBased: true},
                //  Specialized editables
                'checkbox': {element: 'input', type: 'checkbox', editable: true, textBased: false},
                'color': {element: 'input', type: 'color', editable: true, textBased: false},
                'file': {element: 'input', type: 'file', editable: true, textBased: false},
                'range': {element: 'input', type: 'range', editable: true, textBased: false},
                'select': {element: 'select', editable: true, textBased: false},
                //  Pseudo-non-editables (containers)
                'checklist': {element: 'div', editable: false, textBased: false},
                'fieldset': {element: 'fieldset', editable: false, textBased: false},
                'div': {element: 'div', editable: false, textBased: false},
                'form': {element: 'form', editable: false, textBased: false},
                'radio': {element: 'div', editable: false, textBased: false},
                //  Non-editables (mostly buttons)
                'button': {element: 'button', type: 'button', editable: false, textBased: false},
                'hidden': {element: 'input', type: 'hidden', editable: false, textBased: false},
                'image': {element: 'input', type: 'image', editable: false, textBased: false},
                'legend': {element: 'legend', editable: false, textBased: false},
                'reset': {element: 'button', type: 'reset', editable: false, textBased: false},
                'submit': {element: 'button', type: 'submit', editable: false, textBased: false}
            };
        })
        //
        .factory('formElements', ['defaultFormElements', function (defaultFormElements) {
            return defaultFormElements;
        }])
        //
        .run(['$rootScope', '$lux', function (scope, $lux) {
            var formHandlers = {};
            $lux.formHandlers = formHandlers;

            formHandlers.reload = function () {
                $lux.window.location.reload();
            };

            formHandlers.redirectHome = function (response, scope) {
                var href = scope.formAttrs.redirectTo || '/';
                $lux.window.location.href = href;
                $lux.window.location.reload();
            };

            formHandlers.login = function (response, scope) {
                var target = scope.formAttrs.action,
                    api = $lux.api(target);
                if (api)
                    api.token(response.data.token);
                $lux.window.location.reload();
            };

            //  Listen for a Lux form to be available
            //  If it uses the api for posting, register with it
            scope.$on('formReady', function (e, model, formScope) {
                var attrs = formScope.formAttrs,
                    action = attrs ? attrs.action : null,
                    actionType = attrs ? attrs.actionType : null;

                if (isObject(action) && actionType !== 'create') {
                    var api = $lux.api(action);
                    if (api) {
                        $lux.log.info('Form ' + formScope.formModelName + ' registered with "' +
                            api.toString() + '" api');
                        api.formReady(model, formScope);
                    }
                }
            });
        }])

        //
        // The formService is a reusable component for redering form fields
        .service('standardForm', ['$log', '$http', '$document', '$templateCache', 'formDefaults', 'formElements',
                                  function (log, $http, $document, $templateCache, formDefaults, formElements) {
            //
            var baseAttributes = ['id', 'name', 'title', 'style'],
                inputAttributes = extendArray([], baseAttributes, ['disabled', 'readonly', 'type', 'value', 'placeholder']),
                textareaAttributes = extendArray([], baseAttributes, ['disabled', 'readonly', 'placeholder', 'rows', 'cols']),
                buttonAttributes = extendArray([], baseAttributes, ['disabled']),
                // Don't include action in the form attributes
                formAttributes = extendArray([], baseAttributes, ['accept-charset','autocomplete',
                                                                  'enctype', 'method', 'novalidate', 'target']),
                validationAttributes = ['minlength', 'maxlength', 'min', 'max', 'required'],
                ngAttributes = ['disabled', 'minlength', 'maxlength', 'required'],
                elements = formElements();

            extend(this, {
                name: 'default',
                //
                className: '',
                //
                inputGroupClass: 'form-group',
                //
                inputHiddenClass: 'form-hidden',
                //
                inputClass: 'form-control',
                //
                buttonClass: 'btn btn-default',
                //
                template: function (url) {
                    return $http.get(url, {cache: $templateCache}).then(function (result) {
                        return result.data;
                    });
                },
                //
                // Create a form element
                createElement: function (driver, scope) {
                    var self = this,
                        thisField = scope.field,
                        tc = thisField.type.split('.'),
                        info = elements[tc.splice(0, 1)[0]],
                        renderer;

                    scope.extraClasses = tc.join(' ');
                    scope.info = info;

                    if (info) {
                        // Pick the renderer by checking `type`
                        if (info.hasOwnProperty('type'))
                            renderer = this[info.type];

                        // If no element type, use the `element`
                        if (!renderer)
                            renderer = this[info.element];
                    }

                    if (!renderer)
                        renderer = this.renderNotElements;

                    var element = renderer.call(this, scope);

                    forEach(scope.children, function (child) {
                        var field = child.field;

                        if (field) {

                            // extend child.field with options
                            forEach(formDefaults, function (_, name) {
                                if (field[name] === undefined)
                                    field[name] = scope.field[name];
                            });
                            //
                            // Make sure children is defined, otherwise it will be inherited from the parent scope
                            if (child.children === undefined)
                                child.children = null;
                            child = driver.createElement(extend(scope, child));

                            if (isArray(child))
                                forEach(child, function (c) {
                                    element.append(c);
                                });
                            else if (child)
                                element.append(child);
                        } else {
                            log.error('form child without field');
                        }
                    });
                    // Reinstate the field
                    scope.field = thisField;
                    return element;
                },
                //
                addAttrs: function (scope, element, attributes) {
                    forEach(scope.field, function (value, name) {
                        if (attributes.indexOf(name) > -1) {
                            if (ngAttributes.indexOf(name) > -1)
                                element.attr('ng-' + name, value);
                            else
                                element.attr(name, value);
                        } else if (name.substring(0, 5) === 'data-') {
                            element.attr(name, value);
                        }
                    });
                    return element;
                },
                //
                addDirectives: function(scope, element) {
                    // lux-codemirror directive
                    if (scope.field.hasOwnProperty('text_edit'))
                        element.attr('lux-codemirror', scope.field.text_edit);
                    return element;
                },
                //
                renderNotForm: function (scope) {
                    return $($document[0].createElement('span')).html(field.label || '');
                },
                //
                fillDefaults: function (scope) {
                    var field = scope.field;
                    field.label = field.label || field.name;
                    scope.formCount++;
                    if (!field.id)
                        field.id = field.name + '-' + scope.formid + '-' + scope.formCount;
                },
                //
                form: function (scope) {
                    var field = scope.field,
                        info = scope.info,
                        form = $($document[0].createElement(info.element))
                                    .attr('role', 'form').addClass(this.className)
                                    .attr('ng-model', field.model);
                    this.formMessages(scope, form);
                    return this.addAttrs(scope, form, formAttributes);
                },
                //
                'ng-form': function (scope) {
                    return this.form(scope);
                },
                //
                // Render a fieldset
                fieldset: function (scope) {
                    var field = scope.field,
                        info = scope.info,
                        element = $($document[0].createElement(info.element));
                    if (field.label)
                        element.append($($document[0].createElement('legend')).html(field.label));
                    return element;
                },
                //
                div: function (scope) {
                    var info = scope.info,
                        element = $($document[0].createElement(info.element)).addClass(scope.extraClasses);
                    return element;
                },
                //
                radio: function (scope) {
                    this.fillDefaults(scope);

                    var field = scope.field,
                        info = scope.info,
                        input = angular.element($document[0].createElement(info.element)),
                        label = angular.element($document[0].createElement('label')).attr('for', field.id),
                        span = angular.element($document[0].createElement('span'))
                                    .css('margin-left', '5px')
                                    .css('position', 'relative')
                                    .css('bottom', '2px')
                                    .html(field.label),
                        element = angular.element($document[0].createElement('div')).addClass(this.element);

                    input.attr('ng-model', scope.formModelName + '["' + field.name + '"]');

                    forEach(inputAttributes, function (name) {
                        if (field[name]) input.attr(name, field[name]);
                    });

                    label.append(input).append(span);
                    element.append(label);
                    return this.onChange(scope, this.inputError(scope, element));
                },
                //
                checkbox: function (scope) {
                    return this.radio(scope);
                },
                //
                input: function (scope, attributes) {
                    this.fillDefaults(scope);

                    var field = scope.field,
                        info = scope.info,
                        input = angular.element($document[0].createElement(info.element)).addClass(this.inputClass),
                        label = angular.element($document[0].createElement('label')).attr('for', field.id).html(field.label),
                        element;

                    // Add model attribute
                    input.attr('ng-model', scope.formModelName + '["' + field.name + '"]');

                    if (!field.showLabels || field.type === 'hidden') {
                        label.addClass('sr-only');
                        // Add placeholder if not defined
                        if (field.placeholder === undefined)
                            field.placeholder = field.label;
                    }

                    this.addAttrs(scope, input, attributes || inputAttributes);
                    if (field.value !== undefined) {
                        scope[scope.formModelName][field.name] = field.value;
                        if (info.textBased)
                            input.attr('value', field.value);
                    }

                    // Add directive to element
                    input = this.addDirectives(scope, input);

                    if (this.inputGroupClass) {
                        element = angular.element($document[0].createElement('div'));
                        if (field.type === 'hidden') element.addClass(this.inputHiddenClass);
                        else element.addClass(this.inputGroupClass);
                        element.append(label).append(input);
                    } else {
                        element = [label, input];
                    }
                    return this.onChange(scope, this.inputError(scope, element));
                },
                //
                textarea: function (scope) {
                    return this.input(scope, textareaAttributes);
                },
                //
                // Create a select element
                select: function (scope) {
                    var field = scope.field,
                        groups = {},
                        groupList = [],
                        options = [],
                        group;

                    forEach(field.options, function (opt) {
                        if (typeof(opt) === 'string') {
                            opt = {'value': opt};
                        } else if (isArray(opt)) {
                            opt = {'value': opt[0], 'repr': opt[1] || opt[0]};
                        }
                        if (opt.group) {
                            group = groups[opt.group];
                            if (!group) {
                                group = {name: opt.group, options: []};
                                groups[opt.group] = group;
                                groupList.push(group);
                            }
                            group.options.push(opt);
                        } else
                            options.push(opt);
                        // Set the default value if not available
                        if (!field.value) field.value = opt.value;
                    });

                    var info = scope.info,
                        element = this.input(scope);

                    if (elements.select.hasOwnProperty('widget') && elements.select.widget.name === 'selectUI')
                        // UI-Select widget
                        this.selectUI(scope, element, field, groupList, options);
                    else
                        // Standard select
                        this.selectStandard(scope, element, field, groupList, options);

                    return this.onChange(scope, element);
                },
                //
                // Standard select widget
                selectStandard: function(scope, element, field, groupList, options) {
                    var groups = {},
                        group, grp,
                        select = this._select(scope.info.element, element);

                    if (groupList.length) {
                        if (options.length)
                            groupList.push({name: 'other', options: options});

                        forEach(groupList, function (group) {
                            grp = $($document[0].createElement('optgroup'))
                                    .attr('label', group.name);
                            select.append(grp);
                            forEach(group.options, function (opt) {
                                opt = $($document[0].createElement('option'))
                                        .attr('value', opt.value).html(opt.repr || opt.value);
                                grp.append(opt);
                            });
                        });
                    } else
                        forEach(options, function (opt) {
                            opt = $($document[0].createElement('option'))
                                    .attr('value', opt.value).html(opt.repr || opt.value);
                            select.append(opt);
                        });

                    if (field.multiple)
                        select.attr('multiple', true);
                },
                //
                // UI-Select widget
                selectUI: function(scope, element, field, groupList, options) {
                    //
                    scope.groupBy = function (item) {
                        return item.group;
                    };
                    // Search specified global
                    scope.enableSearch = elements.select.widget.enableSearch;

                    // Search specified for field
                    if (field.hasOwnProperty('search'))
                        scope.enableSearch = field.search;

                    var selectUI = $($document[0].createElement('ui-select'))
                                    .attr('id', field.id)
                                    .attr('name', field.name)
                                    .attr('ng-model', scope.formModelName + '["' + field.name + '"]')
                                    .attr('theme', elements.select.widget.theme)
                                    .attr('search-enabled', 'enableSearch')
                                    .attr('ng-change', 'fireFieldChange("' + field.name + '")'),
                        match = $($document[0].createElement('ui-select-match'))
                                    .attr('placeholder', 'Select or search ' + field.label.toLowerCase()),
                        choices_inner = $($document[0].createElement('div')),
                        choices_inner_small = $($document[0].createElement('small')),
                        choices = $($document[0].createElement('ui-select-choices'))
                                    .append(choices_inner);

                    if (field.multiple)
                        selectUI.attr('multiple', true);

                    if (field.hasOwnProperty('data-remote-options')) {
                        // Remote options
                        selectUI.attr('data-remote-options', field['data-remote-options'])
                                .attr('data-remote-options-id', field['data-remote-options-id'])
                                .attr('data-remote-options-value', field['data-remote-options-value']);

                        if (field.multiple)
                            match.html('{{$item.name}}');
                        else
                            match.html('{{$select.selected.name}}');

                        choices.attr('repeat', field['data-ng-options-ui-select'] + ' | filter: $select.search');
                        choices_inner.html('{{item.name}}');
                    } else {
                        // Local options
                        var optsId = field.name + '_opts',
                            repeatItems = 'opt.value as opt in ' + optsId + ' | filter: $select.search';

                        if (field.multiple)
                            match.html('{{$item.value}}');
                        else
                            match.html('{{$select.selected.value}}');

                        if (groupList.length) {
                            // Groups require raw options
                            scope[optsId] = field.options;
                            choices.attr('group-by', 'groupBy')
                                   .attr('repeat', repeatItems);
                            choices_inner.attr('ng-bind-html', 'opt.repr || opt.value');
                        } else {
                            scope[optsId] = options;
                            choices.attr('repeat', repeatItems);

                            if (options.length > 0) {
                                var attrsNumber = Object.keys(options[0]).length;
                                choices_inner.attr('ng-bind-html', 'opt.repr || opt.value');

                                if (attrsNumber > 1) {
                                    choices_inner_small.attr('ng-bind-html', 'opt.value');
                                    choices.append(choices_inner_small);
                                }
                            }
                        }
                    }

                    selectUI.append(match);
                    selectUI.append(choices);
                    element[0].replaceChild(selectUI[0], element[0].childNodes[1]);
                },
                //
                button: function (scope) {
                    var field = scope.field,
                        info = scope.info,
                        element = $($document[0].createElement(info.element)).addClass(this.buttonClass);
                    field.name = field.name || info.element;
                    field.label = field.label || field.name;
                    element.html(field.label);
                    this.addAttrs(scope, element, buttonAttributes);
                    return this.onClick(scope, element);
                },
                //
                onClick: function (scope, element) {
                    var name = element.attr('name'),
                        field = scope.field,
                        clickname = name + 'Click',
                        self = this;
                    //
                    // scope function
                    scope[clickname] = function (e) {
                        if (scope.$broadcast(clickname, e).defaultPrevented) return;
                        if (scope.$emit(clickname, e).defaultPrevented) return;

                        // Get the form processing function
                        var callback = self.processForm(scope);
                        //
                        if (field.click) {
                            callback = getRootAttribute(field.click);
                            if (!angular.isFunction(callback)) {
                                log.error('Could not locate click function "' + field.click + '" for button');
                                return;
                            }
                        }
                        callback.call(this, e);
                    };
                    element.attr('ng-click', clickname + '($event)');
                    return element;
                },
                //
                //  Add change event
                onChange: function (scope, element) {
                    var field = scope.field,
                        input = $(element[0].querySelector(scope.info.element));
                    input.attr('ng-change', 'fireFieldChange("' + field.name + '")');
                    return element;
                },
                //
                // Add input error elements to the input element.
                // Each input element may have one or more error handler depending
                // on its type and attributes
                inputError: function (scope, element) {
                    var field = scope.field,
                        self = this,
                        // True when the form is submitted
                        submitted = scope.formName + '.submitted',
                        // True if the field is dirty
                        dirty = joinField(scope.formName, field.name, '$dirty'),
                        invalid = joinField(scope.formName, field.name, '$invalid'),
                        error = joinField(scope.formName, field.name, '$error') + '.',
                        input = $(element[0].querySelector(scope.info.element)),
                        p = $($document[0].createElement('p'))
                                .attr('ng-show', '(' + submitted + ' || ' + dirty + ') && ' + invalid)
                                .addClass('text-danger error-block')
                                .addClass(scope.formErrorClass),
                        value,
                        attrname;
                    // Loop through validation attributes
                    forEach(validationAttributes, function (attr) {
                        value = field[attr];
                        attrname = attr;
                        if (value !== undefined && value !== false && value !== null) {
                            if (ngAttributes.indexOf(attr) > -1) attrname = 'ng-' + attr;
                            input.attr(attrname, value);
                            p.append($($document[0].createElement('span'))
                                         .attr('ng-show', error + attr)
                                         .html(self.errorMessage(scope, attr)));
                        }
                    });

                    // Add the invalid handler if not available
                    var errors = p.children().length;
                    if (errors === (field.required ? 1 : 0)) {
                        var nameError = '$invalid';
                        if (errors)
                            nameError += ' && !' + [scope.formName, field.name, '$error.required'].join('.');
                        p.append(this.fieldErrorElement(scope, nameError, self.errorMessage(scope, 'invalid')));
                    }

                    // Add the invalid handler for server side errors
                    var name = '$invalid';
                        name += ' && !' + joinField(scope.formName, field.name, '$error.required');
                        p.append(
                            this.fieldErrorElement(scope, name, self.errorMessage(scope, 'invalid'))
                            .html('{{formErrors["' + field.name + '"]}}')
                        );

                    return element.append(p);
                },
                //
                fieldErrorElement: function (scope, name, msg) {
                    var field = scope.field,
                        value = joinField(scope.formName, field.name, name);

                    return $($document[0].createElement('span'))
                                .attr('ng-show', value)
                                .html(msg);
                },
                //
                // Add element which containes form messages and errors
                formMessages: function (scope, form) {
                    var messages = $($document[0].createElement('p')),
                        a = scope.formAttrs;
                    messages.attr('ng-repeat', 'message in formMessages.' + a.FORMKEY)
                            .attr('ng-bind', 'message.message')
                            .attr('ng-class', "message.error ? 'text-danger' : 'text-info'");
                    return form.append(messages);
                },
                //
                errorMessage: function (scope, attr) {
                    var message = attr + 'Message',
                        field = scope.field,
                        handler = this[attr+'ErrorMessage'] || this.defaultErrorMesage;
                    return field[message] || handler.call(this, scope);
                },
                //
                // Default error Message when the field is invalid
                defaultErrorMesage: function (scope) {
                    var type = scope.field.type;
                    return 'Not a valid ' + type;
                },
                //
                minErrorMessage: function (scope) {
                    return 'Must be greater than ' + scope.field.min;
                },
                //
                maxErrorMessage: function (scope) {
                    return 'Must be less than ' + scope.field.max;
                },
                //
                maxlengthErrorMessage: function (scope) {
                    return 'Too long, must be less than ' + scope.field.maxlength;
                },
                //
                minlengthErrorMessage: function (scope) {
                    return 'Too short, must be more than ' + scope.field.minlength;
                },
                //
                requiredErrorMessage: function (scope) {
                    return scope.field.label + " is required";
                },
                //
                // Return the function to handle form processing
                processForm: function (scope) {
                    return scope.processForm || lux.processForm;
                },
                //
                _select: function (tag, element) {
                    if (isArray(element)) {
                        for (var i=0; i<element.length; ++i) {
                            if (element[0].tagName === tag)
                                return element;
                        }
                    } else {
                        return $(element[0].querySelector(tag));
                    }
                }
            });
        }])
        //
        // Bootstrap Horizontal form renderer
        .service('horizontalForm', ['$document', 'standardForm',
                                    function ($document, standardForm) {
            //
            // extend the standardForm service
            extend(this, standardForm, {

                name: 'horizontal',

                className: 'form-horizontal',

                input: function (scope) {
                    var element = standardForm.input(scope),
                        children = element.children(),
                        labelSpan = scope.field.labelSpan ? +scope.field.labelSpan : 2,
                        wrapper = $($document[0].createElement('div'));
                    labelSpan = Math.max(2, Math.min(labelSpan, 10));
                    $(children[0]).addClass('control-label col-sm-' + labelSpan);
                    wrapper.addClass('col-sm-' + (12-labelSpan));
                    for (var i=1; i<children.length; ++i)
                        wrapper.append($(children[i]));
                    return element.append(wrapper);
                },

                button: function (scope) {
                    var element = standardForm.button(scope),
                        labelSpan = scope.field.labelSpan ? +scope.field.labelSpan : 2,
                        outer = $($document[0].createElement('div')).addClass(this.inputGroupClass),
                        wrapper = $($document[0].createElement('div'));
                    labelSpan = Math.max(2, Math.min(labelSpan, 10));
                    wrapper.addClass('col-sm-offset-' + labelSpan)
                           .addClass('col-sm-' + (12-labelSpan));
                    outer.append(wrapper.append(element));
                    return outer;
                }
            });
        }])
        //
        .service('inlineForm', ['standardForm', function (standardForm) {
            extend(this, standardForm, {

                name: 'inline',

                className: 'form-inline',

                input: function (scope) {
                    var element = standardForm.input(scope);
                    $(element[0].getElementsByTagName('label')).addClass('sr-only');
                    return element;
                }
            });
        }])
        //
        .service('formBaseRenderer', ['$lux', '$compile', 'formDefaults',
                function ($lux, $compile, formDefaults) {
            //
            // Internal function for compiling a scope
            this.createElement = function (scope) {
                var field = scope.field;

                if (this[field.layout])
                    return this[field.layout].createElement(this, scope);
                else
                    $lux.log.error('Layout "' + field.layout + '" not available, cannot render form');
            };
            //
            // Initialise the form scope
            this.initScope = function (scope, element, attrs) {
                var data = getOptions(attrs);

                // No data, maybe this form was loaded via angular ui router
                // try to evaluate internal scripts
                if (!data) {
                    var scripts= element[0].getElementsByTagName('script');
                    forEach(scripts, function (js) {
                        globalEval(js.innerHTML);
                    });
                    data = getOptions(attrs);
                }

                if (data && data.field) {
                    var form = data.field,
                        formmodel = {};

                    // extend with form defaults
                    data.field = extend({}, formDefaults, form);
                    extend(scope, data);
                    form = scope.field;
                    if (form.model) {
                        if (!form.name)
                            form.name = form.model + 'form';
                        scope.$parent[form.model] = formmodel;
                    } else {
                        if (!form.name)
                            form.name = 'form';
                        form.model = form.name + 'Model';
                    }
                    scope.formName = form.name;
                    scope.formModelName = form.model;
                    //
                    scope[scope.formModelName] = formmodel;
                    scope.formAttrs = form;
                    scope.formClasses = {};
                    scope.formErrors = {};
                    scope.formMessages = {};
                    scope.$lux = $lux;
                    if (!form.id)
                        form.id = 'f' + s4();
                    scope.formid = form.id;
                    scope.formCount = 0;

                    scope.addMessages = function (messages, error) {

                        forEach(messages, function (message) {
                            if (isString(message))
                                message = {message: message};

                            var field = message.field;
                            if (field && !scope[scope.formName].hasOwnProperty(field)) {
                                message.message = field + ' ' + message.message;
                                field = formDefaults.FORMKEY;
                            } else if (!field) {
                                field = formDefaults.FORMKEY;
                            }

                            if (error) message.error = error;

                            scope.formMessages[field] = [message];

                            if (message.error && field !== formDefaults.FORMKEY) {
                                scope.formErrors[field] = message.message;
                                scope[scope.formName][field].$invalid = true;
                            }
                        });
                    };

                    scope.fireFieldChange = function (field) {
                        // Triggered every time a form field changes
                        scope.$broadcast('fieldChange', formmodel, field);
                        scope.$emit('formFieldChange', formmodel, field);
                    };
                } else {
                    $lux.log.error('Form data does not contain field entry');
                }
            };
            //
            this.createForm = function (scope, element) {
                var form = scope.field;
                if (form) {
                    var formElement = this.createElement(scope);
                    //  Compile and update DOM
                    if (formElement) {
                        this.preCompile(scope, formElement);
                        $compile(formElement)(scope);
                        element.replaceWith(formElement);
                        this.postCompile(scope, formElement);
                    }
                }
            };

            this.preCompile = function () {};

            this.postCompile = function () {};

            this.checkField = function (name) {
                var checker = this['check_' + name];
                // There may be a custom field checker
                if (checker)
                    checker.call(this);
                else {
                    var field = this.form[name];
                    if (field.$valid)
                        this.formClasses[name] = 'has-success';
                    else if (field.$dirty) {
                        this.formErrors[name] = name + ' is not valid';
                        this.formClasses[name] = 'has-error';
                    }
                }
            };

            this.processForm = function(scope) {
                // Clear form errors and messages
                scope.formMessages = [];
                scope.formErrors = [];

                if (scope.form.$invalid) {
                    return $scope.showErrors();
                }
            };
        }])
        //
        // Default form Renderer, roll your own if you like
        .service('formRenderer', ['formBaseRenderer', 'standardForm', 'horizontalForm', 'inlineForm',
            function (base, stdForm, horForm, inlForm) {
                var renderer = extend(this, base);
                this[stdForm.name] = stdForm;
                this[horForm.name] = horForm;
                this[inlForm.name] = inlForm;

                // Create the directive
                this.directive = function () {

                    return {
                        restrict: "AE",
                        //
                        scope: {},
                        //
                        compile: function () {
                            return {
                                pre: function (scope, element, attr) {
                                    // Initialise the scope from the attributes
                                    renderer.initScope(scope, element, attr);
                                },
                                post: function (scope, element) {
                                    // create the form
                                    renderer.createForm(scope, element);
                                    // Emit the form upwards through the scope hierarchy
                                    scope.$emit('formReady', scope[scope.formModelName], scope);
                                }
                            };
                        }
                    };
                };
            }
        ])
        //
        // Lux form
        .directive('luxForm', ['formRenderer', function (formRenderer) {
            return formRenderer.directive();
        }])
        //
        .directive("checkRepeat", ['$log', function (log) {
            return {
                require: "ngModel",

                restrict: 'A',

                link: function(scope, element, attrs, ctrl) {
                    var other = element.inheritedData("$formController")[attrs.checkRepeat];
                    if (other) {
                        ctrl.$parsers.push(function(value) {
                            if(value === other.$viewValue) {
                                ctrl.$setValidity("repeat", true);
                                return value;
                            }
                            ctrl.$setValidity("repeat", false);
                        });

                        other.$parsers.push(function(value) {
                            ctrl.$setValidity("repeat", value === ctrl.$viewValue);
                            return value;
                        });
                    } else {
                        log.error('Check repeat directive could not find ' + attrs.checkRepeat);
                    }
                 }
            };
        }])
        //
        // A directive which add keyup and change event callaback
        .directive('watchChange', function() {
            return {
                scope: {
                    onchange: '&watchChange'
                },
                //
                link: function(scope, element, attrs) {
                    element.on('keyup', function() {
                        scope.$apply(function () {
                            scope.onchange();
                        });
                    }).on('change', function() {
                        scope.$apply(function () {
                            scope.onchange();
                        });
                    });
                }
            };
        });

    //
    function joinField (model, name, extra) {
        return model + '["' + name + '"].' + extra;
    }

    //
    //	Form processor
    //	=========================
    //
    //	Default Form processing function
    // 	If a submit element (input.submit or button) does not specify
    // 	a ``click`` entry, this function is used
    //
    //  Post Result
    //  -------------------
    //
    //  When a form is processed succesfully, this method will check if the
    //  ``formAttrs`` object contains a ``resultHandler`` parameter which should be
    //  a string.
    //
    //  In the event the ``resultHandler`` exists,
    //  the ``$lux.formHandlers`` object is checked if it contains a function
    //  at the ``resultHandler`` value. If it does, the function is called.
    lux.processForm = function (e) {

        e.preventDefault();
        e.stopPropagation();

        var scope = this,
            $lux = scope.$lux,
            form = this[this.formName],
            model = this[this.formModelName],
            attrs = this.formAttrs,
            target = attrs.action,
            FORMKEY = scope.formAttrs.FORMKEY,
            method = attrs.method || 'post',
            promise,
            api;
        //
        // Flag the form as submitted
        form.submitted = true;
        if (form.$invalid) return;

        // Get the api information if target is an object
        //	target
        //		- name:	api name
        //		- target: api target
        if (isObject(target)) api = $lux.api(target);

        this.formMessages = {};
        //
        if (api) {
            promise = api.request(method, target, model);
        } else if (target) {
            var enctype = attrs.enctype || 'application/json',
                ct = enctype.split(';')[0],
                options = {
                    url: target,
                    method: attrs.method || 'POST',
                    data: model,
                    transformRequest: $lux.formData(ct),
                };
            // Let the browser choose the content type
            if (ct === 'application/x-www-form-urlencoded' || ct === 'multipart/form-data') {
                options.headers = {
                    'content-type': undefined
                };
            } else {
                options.headers = {
                    'content-type': ct
                };
            }
            promise = $lux.http(options);
        } else {
            $lux.log.error('Could not process form. No target or api');
            return;
        }
        //
        promise.then(function (response) {
                var data = response.data;
                var hookName = scope.formAttrs.resultHandler;
                var hook = hookName && $lux.formHandlers[hookName];
                if (hook) {
                    hook(response, scope);
                } else if (data.messages) {
                    scope.addMessages(data.messages);
                } else if (api) {
                    // Created
                    if (response.status === 201) {
                        scope.formMessages[FORMKEY] = [{message: 'Successfully created'}];
                    } else {
                        scope.formMessages[FORMKEY] = [{message: 'Successfully updated'}];
                    }
                }
            },
            function (response) {
                var data = response.data || {},
                    status = response.status,
                    messages = data.errors,
                    msg;
                if (!messages) {
                    msg = data.message;
                    if (!msg) {
                        status = status || data.status || 501;
                        msg = 'Response error (' + data.status + ')';
                    }
                    messages = [{message: msg}];
                }
                scope.addMessages(messages, 'error');
            });
    };

/**
 * Created by Reupen on 02/06/2015.
 */

angular.module('lux.form.utils', ['lux.services'])

    .directive('remoteOptions', ['$lux', function ($lux) {

        function fill(api, target, scope, attrs) {

            var id = attrs.remoteOptionsId || 'id',
                nameOpts = attrs.remoteOptionsValue ? JSON.parse(attrs.remoteOptionsValue) : {
                    type: 'field',
                    source: 'id'
                },
                nameFromFormat = nameOpts.type === 'formatString',
                initialValue = {},
                params = JSON.parse(attrs.remoteOptionsParams || '{}'),
                options = [];

            scope[target.name] = options;

            initialValue.id = '';
            initialValue.name = 'Loading...';

            options.push(initialValue);

            api.get(null, params).then(function (data) {
                if (attrs.multiple) {
                    options.splice(0, 1);
                } else {
                    options[0].name = 'Please select...';
                }
                scope[scope.formModelName][attrs.name] = '';
                angular.forEach(data.data.result, function (val) {
                    var name;
                    if (nameFromFormat) {
                        name = formatString(nameOpts.source, val);
                    } else {
                        name = val[nameOpts.source];
                    }
                    options.push({
                        id: val[id],
                        name: name
                    });

                });
            }, function (data) {
                /** TODO: add error alert */
                options[0] = '(error loading options)';
            });
            scope[scope.formModelName][attrs.name] = '';
        }

        function link(scope, element, attrs) {

            if (attrs.remoteOptions) {
                var target = JSON.parse(attrs.remoteOptions),
                    api = $lux.api(target);

                if (api && target.name)
                    return fill(api, target, scope, attrs);
            }
            // TODO: message
        }

        return {
            link: link
        };
    }])

    .directive('selectOnClick', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.on('click', function () {
                    if (!window.getSelection().toString()) {
                        // Required for mobile Safari
                        this.setSelectionRange(0, this.value.length);
                    }
                });
            }
        };
    });

    function asMessage (level, message) {
        if (isString(message)) message = {text: message};
        message.type = level;
        return message;
    }

    lux.messageService = {
        pushMessage: function () {},

        debug: function (text) {
            this.pushMessage(asMessage('debug', text));
        },

        info: function (text) {
            this.pushMessage(asMessage('info', text));
        },

        success: function (text) {
            this.pushMessage(asMessage('success', text));
        },

        warn: function (text) {
            this.pushMessage(asMessage('warn', text));
        },

        error: function (text) {
            this.pushMessage(asMessage('error', text));
        },

        log: function ($log, message) {
            var type = message.type;
            if (type === 'success') type = 'info';
            $log[type](message.text);
        }
    };

    //
    //  Lux messages
    //  =================
    //
    //  An implementation of the messageService interface
    //
    //  Usage:
    //
    //  html:
    //    limit - maximum number of messages to show, by default 5
    //    <message limit="10"></message>
    //
    //  js:
    //    angular.module('app', ['app.view'])
    //    .controller('AppController', ['$scope', 'luxMessage', function ($scope, luxMessage) {
    //                luxMessage.setDebugMode(true);
    //                luxMessage.debug('debug message');
    //                luxMessage.error('error message');
    //                luxMessage.success('success message');
    //                luxMessage.info('info message');
    //
    //            }])
    angular.module('lux.message', ['lux.services', 'templates-message'])
        //
        //  Service for messages
        //
        .service('luxMessage', ['$lux',  '$rootScope', function ($lux, $scope) {

            var log = lux.messageService.log;

            extend(this, lux.messageService, {

                getMessages: function () {
                    if( ! this.getStorage().getItem('messages') ){
                        return [];
                    }
                    return JSON.parse(this.getStorage().getItem('messages')).reverse();

                },

                setMessages: function (messages) {
                   this.getStorage().messages = JSON.stringify(messages);
                },

                pushMessage: function (message) {
                    if (message.store) {
                        var messages = this.getMessages();
                        messages.push(message);
                        this.setMessages(messages);
                    }
                    log($lux.$log, message);
                    $scope.$broadcast('messageAdded', message);
                },

                removeMessage: function (message) {
                    var messages = this.getMessages();
                    messages = messages.filter(function (value) {
                        return value.id !== message.id;
                    });
                    this.setMessages(messages);
                },

                getDebugMode: function () {
                    return !! JSON.parse(window.localStorage.getItem('debug'));
                },

                setDebugMode: function (value) {
                    window.localStorage.debug = JSON.stringify(value);
                },

                setStorage: function (storage) {
                    window.localStorage.messagesStorage = storage;
                },

                getStorage: function () {
                    if( window.localStorage.getItem('messagesStorage') === 'session' ){
                        return window.sessionStorage;
                    }
                    return window.localStorage;

                }
            });
        }])
        //
        // Directive for displaying messages
        //
        .directive('messages', ['luxMessage', function (luxMessage) {

            function renderMessages (scope) {
                //scope.messages = luxMessage.getMessages();
            }

            function pushMessage(scope, message) {
                if (message.type === 'error')
                    message.type = 'danger';
                scope.messages.push(message);
            }

            return {
                restrict: 'AE',
                replace: true,
                templateUrl: "message/message.tpl.html",
                link: function (scope, element, attrs) {
                    scope.messages = [];

                    scope.limit = !!attrs.limit ? parseInt(attrs.limit) : 5; //5 messages to show by default

                    scope.debug = function(){
                        return luxMessage.getDebugMode();
                    };

                    scope.removeMessage = function (message) {
                        var msgs = scope.messages;
                        for (var i=0; i<msgs.length; ++i) {
                            if (msgs[i].text === message.text) {
                                msgs.splice(i, 1);
                                if (message.store) {
                                    //TODO: remove it from the store
                                }
                            }
                        }
                    };

                    scope.$on('$viewContentLoaded', function () {
                        renderMessages(scope);
                    });

                    scope.$on('messageAdded', function (e, message) {
                        if (!e.defaultPrevented) {
                            pushMessage(scope, message);
                            //scope.$apply();
                        }
                    });

                    renderMessages(scope);
                }
            };
        }]);


    //
    // Grid module for lux
    //
    //  Dependencies:
    //
    //      - use $modal service from angular-strap library
    //
    //
    function dateSorting(column) {

        column.sortingAlgorithm = function(a, b) {
            var dt1 = new Date(a).getTime(),
                dt2 = new Date(b).getTime();
            return dt1 === dt2 ? 0 : (dt1 < dt2 ? -1 : 1);
        };
    }

    angular.module('lux.grid', ['lux.services', 'templates-grid', 'ngTouch', 'ui.grid',
                                'ui.grid.pagination', 'ui.grid.selection', 'ui.grid.autoResize'])
        //
        .constant('gridDefaults', {
            //
            enableFiltering: true,
            enableRowHeaderSelection: false,
            useExternalPagination: true,
            useExternalSorting: true,
            useExternalFiltering: true,
            // Scrollbar display: 0 - never, 1 - always, 2 - when needed
            enableHorizontalScrollbar: 0,
            enableVerticalScrollbar: 0,
            //
            rowHeight: 30,
            minGridHeight: 250,
            offsetGridHeight: 102,
            //
            // request delay in ms
            requestDelay: 100,
            //
            paginationOptions: {
                sizes: [25, 50, 100]
            },
            //
            gridState: {
                page: 1,
                limit: 25,
                offset: 0
            },
            gridFilters: {},
            //
            showMenu: true,
            gridMenu: {
                'create': {
                    title: 'Add',
                    icon: 'fa fa-plus'
                },
                'delete': {
                    title: 'Delete',
                    icon: 'fa fa-trash'
                },
                'columnsVisibility': {
                    title: 'Columns visibility',
                    icon: 'fa fa-eye'
                }
            },
            modal: {
                delete: {
                    templates: {
                        'empty': 'grid/templates/modal.empty.tpl.html',
                        'delete': 'grid/templates/modal.delete.tpl.html',
                    },
                    messages: {
                        'info': 'Are you sure you want to delete',
                        'danger': 'DANGER - THIS CANNOT BE UNDONE',
                        'success': 'Successfully deleted',
                        'error': 'Error while deleting ',
                        'empty': 'Please, select some',
                    }
                },
                columnsVisibility: {
                    templates: {
                        'default': 'grid/templates/modal.columns.tpl.html',
                    },
                    messages: {
                        'info': 'Click button with column name to toggle visibility'
                    }
                }
            },
            // dictionary of call-backs for columns types
            // The function is called with four parameters
            //	* `column` ui-grid object
            //	* `col` object from metadata
            //	* `uiGridConstants` object
            //	* `gridDefaults` object
            columns: {
                date: dateSorting,

                datetime: dateSorting,

                // Font-awesome icon by default
                boolean: function (column, col, uiGridConstants, gridDefaults) {
                    column.cellTemplate = gridDefaults.wrapCell('<i ng-class="grid.appScope.getBooleanFieldIcon(COL_FIELD)"></i>');

                    if (col.hasOwnProperty('filter')) {
                        column.filter = {
                            type: uiGridConstants.filter.SELECT,
                            selectOptions: [{ value: 'true', label: 'True' }, { value: 'false', label: 'False'}]
                        };
                    }
                }
            },
            //
            // default wrapper for grid cells
            wrapCell: function (template) {
                return '<div class="ui-grid-cell-contents">' + template + '</div>';
            }
        })
        //
        .service('GridService', ['$lux', '$q', '$location', '$compile', '$modal', 'uiGridConstants', 'gridDefaults',
            function($lux, $q, $location, $compile, $modal, uiGridConstants, gridDefaults) {

            function parseColumns(columns, metaFields) {
                var columnDefs = [],
                    column;

                angular.forEach(columns, function(col) {
                    column = {
                        field: col.name,
                        displayName: col.displayName,
                        type: getColumnType(col.type),
                        name: col.name
                    };

                    if (col.hasOwnProperty('hidden') && col.hidden)
                        column.visible = false;

                    if (!col.hasOwnProperty('sortable'))
                        column.enableSorting = false;

                    if (!col.hasOwnProperty('filter'))
                        column.enableFiltering = false;

                    var callback = gridDefaults.columns[col.type];
                    if (callback) callback(column, col, uiGridConstants, gridDefaults);

                    if (column.field === metaFields.repr) {
                        column.cellTemplate = gridDefaults.wrapCell('<a ng-href="{{grid.appScope.objectUrl(row.entity)}}">{{COL_FIELD}}</a>');
                        // Set repr column as the first column
                        columnDefs.splice(0, 0, column);
                    }
                    else
                        columnDefs.push(column);
                });

                return columnDefs;
            }

            // Get specified page using params
            function getPage(scope, api) {
                var query = angular.extend({}, scope.gridState);

                // Add filter if available
                if (scope.gridFilters)
                    query = angular.extend(query, scope.gridFilters);

                api.get({}, query).success(function(resp) {
                    scope.gridOptions.totalItems = resp.total;
                    scope.gridOptions.data = resp.result;

                    // Update grid height depending on number of the rows
                    scope.updateGridHeight();
                });
            }

            // Return column type accirding to type
            function getColumnType(type) {
                switch (type) {
                    case 'integer':     return 'number';
                    case 'datetime':    return 'date';
                    default:            return type;
                }
            }

            // Add menu actions to grid
            function addGridMenu(scope, api, gridOptions) {
                var menu = [],
                    stateName = window.location.href.split('/').pop(-1),
                    model = stateName.slice(0, -1),
                    modalScope = scope.$new(true),
                    modal, title, template;

                scope.create = function($event) {
                    // if location path is available then we use ui-router
                    if (lux.context.uiRouterEnabled)
                        $location.path($location.path() + '/add');
                    else
                        $lux.window.location.href += '/add';
                };

                scope.delete = function($event) {
                    modalScope.selected = scope.gridApi.selection.getSelectedRows();

                    var firstField = gridOptions.columnDefs[0].field,
                        subPath = scope.options.target.path || '';

                    // Modal settings
                    angular.extend(modalScope, {
                        'stateName': stateName,
                        'repr_field': scope.gridOptions.metaFields.repr || firstField,
                        'infoMessage': gridDefaults.modal.delete.messages.info + ' ' + stateName + ':',
                        'dangerMessage': gridDefaults.modal.delete.messages.danger,
                        'emptyMessage': gridDefaults.modal.delete.messages.empty + ' ' + stateName + '.',
                    });

                    if (modalScope.selected.length > 0)
                        template = gridDefaults.modal.delete.templates.delete;
                    else
                        template = gridDefaults.modal.delete.templates.empty;

                    modal = $modal({scope: modalScope, template: template, show: true});

                    modalScope.ok = function() {

                        function deleteItem(item) {
                            var defer = $lux.q.defer(),
                                pk = item[scope.gridOptions.metaFields.id];

                            api.delete({path: subPath + '/' + pk})
                                .success(function(resp) {
                                    defer.resolve(gridDefaults.modal.delete.messages.success);
                                })
                                .error(function(error) {
                                    defer.reject(gridDefaults.modal.delete.messages.error);
                                });

                            return defer.promise;
                        }

                        var promises = [];

                        forEach(modalScope.selected, function(item, _) {
                            promises.push(deleteItem(item));
                        });

                        $q.all(promises).then(function(results) {
                            getPage(scope, api);
                            modal.hide();
                            $lux.messages.success(results[0] + ' ' + results.length + ' ' + stateName);
                        }, function(results) {
                            modal.hide();
                            $lux.messages.error(results + ' ' + stateName);
                        });
                    };
                };

                scope.columnsVisibility = function() {
                    modalScope.columns = scope.gridOptions.columnDefs;
                    modalScope.infoMessage = gridDefaults.modal.columnsVisibility.messages.info;

                    modalScope.toggleVisible = function(column) {
                        if (column.hasOwnProperty('visible'))
                            column.visible = !column.visible;
                        else
                            column.visible = false;

                        scope.gridApi.core.refresh();
                    };

                    modalScope.activeClass = function(column) {
                        if (column.hasOwnProperty('visible')) {
                            if (column.visible) return 'btn-success';
                                return 'btn-danger';
                        } else
                            return 'btn-success';
                    };
                    //
                    template = gridDefaults.modal.columnsVisibility.templates.default;
                    modal = $modal({scope: modalScope, template: template, show: true});
                };

                forEach(gridDefaults.gridMenu, function(item, key) {
                    title = item.title;

                    if (key === 'create')
                        title += ' ' + model;

                    menu.push({
                        title: title,
                        icon: item.icon,
                        action: scope[key]
                    });
                });

                extend(gridOptions, {
                    enableGridMenu: true,
                    gridMenuShowHideColumns: false,
                    gridMenuCustomItems: menu
                });
            }

            // Get initial data
            this.getInitialData = function(scope) {
                var api = $lux.api(scope.options.target),
                    sub_path = scope.options.target.path || '';

                api.get({path: sub_path + '/metadata'}).success(function(resp) {
                    scope.gridState.limit = resp['default-limit'];
                    scope.gridOptions.metaFields = {
                        id: resp.id,
                        repr: resp.repr
                    };
                    scope.gridOptions.columnDefs = parseColumns(resp.columns, scope.gridOptions.metaFields);

                    api.get({path: sub_path}, {limit: scope.gridState.limit}).success(function(resp) {
                        scope.gridOptions.totalItems = resp.total;
                        scope.gridOptions.data = resp.result;

                        // Update grid height
                        scope.updateGridHeight();
                    });
                });
            };

            // Builds grid options
            this.buildOptions = function(scope, options) {
                scope.options = options;
                scope.paginationOptions = gridDefaults.paginationOptions;
                scope.gridState = gridDefaults.gridState;
                scope.gridFilters = gridDefaults.gridFilters;

                scope.objectUrl = function(entity) {
                    return $lux.window.location + '/' + entity[scope.gridOptions.metaFields.id];
                };

                scope.getBooleanFieldIcon = function(COL_FIELD) {
                    return ((COL_FIELD) ? 'fa fa-check-circle text-success' : 'fa fa-check-circle text-danger');
                };

                scope.clearData = function() {
                    scope.gridOptions.data = [];
                };

                scope.updateGridHeight = function () {
                    var length = scope.gridOptions.totalItems,
                        element = angular.element(document.getElementsByClassName('grid')[0]),
                        totalPages = scope.gridApi.pagination.getTotalPages(),
                        currentPage = scope.gridState.page,
                        lastPage = scope.gridOptions.totalItems % scope.gridState.limit,
                        gridHeight = 0;

                    // Calculate grid height
                    if (length > 0) {
                        if (currentPage < totalPages || lastPage === 0)
                            gridHeight = scope.gridState.limit * gridDefaults.rowHeight + gridDefaults.offsetGridHeight;
                        else
                            gridHeight = lastPage * gridDefaults.rowHeight + gridDefaults.offsetGridHeight;
                    }

                    if (gridHeight < gridDefaults.minGridHeight)
                        gridHeight = gridDefaults.minGridHeight;

                    element.css('height', gridHeight + 'px');
                };

                var api = scope.options.target ? $lux.api(scope.options.target) : null,
                    gridOptions = {
                        paginationPageSizes: scope.paginationOptions.sizes,
                        paginationPageSize: scope.gridState.limit,
                        enableFiltering: gridDefaults.enableFiltering,
                        enableRowHeaderSelection: gridDefaults.enableRowHeaderSelection,
                        useExternalPagination: gridDefaults.useExternalPagination,
                        useExternalSorting: gridDefaults.useExternalSorting,
                        enableHorizontalScrollbar: gridDefaults.enableHorizontalScrollbar,
                        enableVerticalScrollbar: gridDefaults.enableVerticalScrollbar,
                        rowHeight: gridDefaults.rowHeight,
                        onRegisterApi: function(gridApi) {
                            scope.gridApi = gridApi;

                            require(['lodash'], function(_) {
                                //
                                // Pagination
                                scope.gridApi.pagination.on.paginationChanged(scope, _.debounce(function(pageNumber, pageSize) {
                                    scope.gridState.page = pageNumber;
                                    scope.gridState.limit = pageSize;
                                    scope.gridState.offset = pageSize*(pageNumber - 1);

                                    getPage(scope, api);
                                }, gridDefaults.requestDelay));
                                //
                                // Sorting
                                scope.gridApi.core.on.sortChanged(scope, _.debounce(function(grid, sortColumns) {
                                    if( sortColumns.length === 0) {
                                        delete scope.gridState.sortby;
                                        getPage(scope, api);
                                    } else {
                                        // Build query string for sorting
                                        angular.forEach(sortColumns, function(column) {
                                            scope.gridState.sortby = column.name + ':' + column.sort.direction;
                                        });

                                        switch( sortColumns[0].sort.direction ) {
                                            case uiGridConstants.ASC:
                                                getPage(scope, api);
                                                break;
                                            case uiGridConstants.DESC:
                                                getPage(scope, api);
                                                break;
                                            case undefined:
                                                getPage(scope, api);
                                                break;
                                        }
                                    }
                                }, gridDefaults.requestDelay));
                                //
                                // Filtering
                                scope.gridApi.core.on.filterChanged(scope, _.debounce(function() {
                                    var grid = this.grid;
                                    scope.gridFilters = {};

                                    // Add filters
                                    angular.forEach(grid.columns, function(value, _) {
                                        // Clear data in order to refresh icons
                                        if (value.filter.type === 'select')
                                            scope.clearData();

                                        if (value.filters[0].term)
                                            scope.gridFilters[value.colDef.name] = value.filters[0].term;
                                    });

                                    // Get results
                                    getPage(scope, api);

                                }, gridDefaults.requestDelay));
                            });
                        }
                    };

                if (gridDefaults.showMenu)
                    addGridMenu(scope, api, gridOptions);

                return gridOptions;
            };
        }])
        //
        // Directive to build Angular-UI grid options using Lux REST API
        .directive('restGrid', ['$compile', 'GridService', function ($compile, GridService) {

            return {
                restrict: 'A',
                link: {
                    pre: function (scope, element, attrs) {
                        var scripts= element[0].getElementsByTagName('script');

                        forEach(scripts, function (js) {
                            globalEval(js.innerHTML);
                        });

                        var opts = attrs;
                        if (attrs.restGrid) opts = {options: attrs.restGrid};

                        opts = getOptions(opts);

                        if (opts) {
                            scope.gridOptions = GridService.buildOptions(scope, opts);
                            GridService.getInitialData(scope);
                        }

                        var grid = '<div ui-if="gridOptions.data.length>0" class="grid" ui-grid="gridOptions" ui-grid-pagination ui-grid-selection ui-grid-auto-resize></div>';
                        element.append($compile(grid)(scope));
                    },
                },
            };

        }]);

  // Create all modules and define dependencies to make sure they exist
    // and are loaded in the correct order to satisfy dependency injection
    // before all nested files are concatenated by Grunt

    // Modules
    angular.module('angular-jwt', ['angular-jwt.interceptor', 'angular-jwt.jwt']);

    angular.module('angular-jwt.interceptor', [])
        .provider('jwtInterceptor', function() {

        this.authHeader = 'Authorization';
        this.authPrefix = 'Bearer ';
        this.tokenGetter = function() {
            return null;
        };

        var config = this;

        this.$get = ["$q", "$injector", "$rootScope", function($q, $injector, $rootScope) {
            return {
                request: function(request) {
                    if (request.skipAuthorization) {
                        return request;
                    }

                    request.headers = request.headers || {};
                    // Already has an Authorization header
                    if (request.headers[config.authHeader]) {
                        return request;
                    }

                    var tokenPromise = $q.when($injector.invoke(config.tokenGetter, this, {
                        config: request
                    }));

                    return tokenPromise.then(function(token) {
                        if (token) {
                            request.headers[config.authHeader] = config.authPrefix + token;
                        }
                        return request;
                    });
                },
                responseError: function(response) {
                    // handle the case where the user is not authenticated
                    if (response.status === 401) {
                        $rootScope.$broadcast('unauthenticated', response);
                    }
                    return $q.reject(response);
                }
            };
        }];
    });

    angular.module('angular-jwt.jwt', [])
        .service('jwtHelper', function() {

        this.urlBase64Decode = function(str) {
            var output = str.replace('-', '+').replace('_', '/');
            switch (output.length % 4) {
                case 0:
                    {
                        break;
                    }
                case 2:
                    {
                        output += '==';
                        break;
                    }
                case 3:
                    {
                        output += '=';
                        break;
                    }
                default:
                    {
                        throw 'Illegal base64url string!';
                    }
            }
            // return window.atob(output); //polifyll https://github.com/davidchambers/Base64.js
            return decodeURIComponent(escape(window.atob(output))); //polifyll https://github.com/davidchambers/Base64.js
        };


        this.decodeToken = function(token) {
            var parts = token.split('.');

            if (parts.length !== 3) {
                throw new Error('JWT must have 3 parts');
            }

            var decoded = this.urlBase64Decode(parts[1]);
            if (!decoded) {
                throw new Error('Cannot decode the token');
            }

            return JSON.parse(decoded);
        };

        this.getTokenExpirationDate = function(token) {
            var decoded;
            decoded = this.decodeToken(token);

            if (!decoded.exp) {
                return null;
            }

            var d = new Date(0); // The 0 here is the key, which sets the date to the epoch
            d.setUTCSeconds(decoded.exp);

            return d;
        };

        this.isTokenExpired = function(token) {
            var d = this.getTokenExpirationDate(token);

            if (!d) {
                return false;
            }

            // Token expired?
            return d.valueOf() < new Date().valueOf();
        };
    });


    // Controller for User.
    // This controller can be used by eny element, including forms
    angular.module('lux.users', ['lux.form', 'templates-users'])
        //
        // Directive for displaying page messages
        //
        //  <div data-options='sitemessages' data-page-messages></div>
        //  <script>
        //      sitemessages = {
        //          messages: [...],
        //          dismissUrl: (Optional url to use when dismissing a message)
        //      };
        //  </script>
        .directive('pageMessages', ['$lux', '$sce', function ($lux, $sce) {

            return {
                restrict: 'AE',
                templateUrl: "users/messages.tpl.html",
                scope: {},
                link: function (scope, element, attrs) {
                    scope.messageClass = {
                        info: 'alert-info',
                        success: 'alert-success',
                        warning: 'alert-warning',
                        danger: 'alert-danger',
                        error: 'alert-danger'
                    };
                    //
                    // Dismiss a message
                    scope.dismiss = function (e, m) {
                        var target = e.target;
                        while (target && target.tagName !== 'DIV')
                            target = target.parentNode;
                        $(target).remove();
                        $lux.post('/_dismiss_message', {message: m});
                    };
                    var messages = getOptions(attrs);
                    scope.messages = [];
                    forEach(messages, function (message) {
                        if (message) {
                            if (typeof(message) === 'string')
                                message = {body: message};
                            message.html = $sce.trustAsHtml(message.body);
                        }
                        scope.messages.push(message);
                    });
                }
            };
        }])

        .directive('userForm', ['formRenderer', function (renderer) {
            //
            renderer._createElement = renderer.createElement;

            // Override createElement to add passwordVerify directive in the password_repead input
            renderer.createElement = function (scope) {

                var element = this._createElement(scope),
                    field = scope.field,
                    other = field['data-check-repeat'] || field['check-repeat'];

                if (other) {
                    var msg = field.errorMessage || (other + " doesn't match"),
                        errors = $(element[0].querySelector('.' + scope.formErrorClass));
                    if (errors.length)
                        errors.html('').append(renderer[field.layout].fieldErrorElement(
                            scope, '$error.repeat', msg));
                }
                return element;
            };

            return renderer.directive();
        }])

        .directive('loginHelp', function () {
            return {
                templateUrl: "users/login-help.tpl.html"
            };
        })

        .controller('UserController', ['$scope', '$lux', function (scope, lux) {
            // Model for a user when updating

            // Unlink account for a OAuth provider
            scope.unlink = function(e, name) {
                e.preventDefault();
                e.stopPropagation();
                var url = '/oauth/' + name + '/remove';
                $.post(url).success(function (data) {
                    if (data.success)
                        $route.reload();
                });
            };
        }]);
    lux.loader = angular.module('lux.loader', [])
    	//
        .value('context', lux.context)
        //
        .config(['$controllerProvider', function ($controllerProvider) {
            lux.loader.cp = $controllerProvider;
            lux.loader.controller = $controllerProvider;
        }])
        //
        .run(['$rootScope', '$log', '$timeout', 'context',
              	function (scope, $log, $timeout, context) {
            $log.info('Extend root scope with context');
            extend(scope, context);
            scope.$timeout = $timeout;
            scope.$log = $log;
        }]);
    //
    //  Bootstrap the document
    //  ============================
    //
    //  * ``name``  name of the module
    //  * ``modules`` modules to include
    //
    //  These modules are appended to the modules available in the
    //  lux context object and therefore they will be processed afterwards.
    //
    lux.bootstrap = function (name, modules) {
        //
        // actual bootstrapping function
        function _bootstrap() {
            //
            // Resolve modules to load
            var mods = lux.context.ngModules;
            if(!mods) mods = [];

            // Add all modules from input
            forEach(modules, function (mod) {
                mods.push(mod);
            });
            // Insert the lux loader as first module
            mods.splice(0, 0, 'lux.loader');
            angular.module(name, mods);
            angular.bootstrap(document, [name]);
        }

        if (!angular_bootstrapped) {
            angular_bootstrapped = true;
            //
            $(document).ready(function() {
                _bootstrap();
            });
        }
    };

    //  Blog Module
    //  ===============
    //
    //  Simple blog pagination directives and code highlight with highlight.js
    angular.module('lux.blog', ['lux.page', 'templates-blog', 'highlight'])
        .value('blogDefaults', {
            centerMath: true,
            fallback: true,
            katexCss: 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.3.0/katex.min.css'
        })
        //
        .controller('BlogEntry', ['$scope', 'pageService', '$lux', function ($scope, pageService, $lux) {
            var post = $scope.post;
            if (!post)
                $lux.log.error('post not available in $scope, cannot use pagination controller!');
            else {
                if (!post.date)
                    post.date = post.published || post.last_modified;
                pageService.addInfo(post, $scope);
            }
        }])
        //
        .directive('blogPagination', function () {
            return {
                templateUrl: "blog/templates/pagination.tpl.html",
                restrict: 'AE'
            };
        })
        //
        .directive('blogHeader', function () {
            return {
                templateUrl: "blog/templates/header.tpl.html",
                restrict: 'AE'
            };
        })
        //
        // Compile latex makup with katex and mathjax fallback
        .directive('latex', ['$log', 'blogDefaults', function ($log, blogDefaults) {

            function error (element, err) {
                element.html("<div class='alert alert-danger' role='alert'>" + err + "</div>");
            }

            function configMaxJax (mathjax) {
                mathjax.Hub.Register.MessageHook("TeX Jax - parse error", function (message) {
                    var a = 1;
                });
                mathjax.Hub.Register.MessageHook("Math Processing Error", function (message) {
                    var a = 1;
                });
            }

            //
            //  Render the text using MathJax
            //
            //  Check: http://docs.mathjax.org/en/latest/typeset.html
            function render_mathjax (mathjax, text, element) {
                if (text.substring(0, 15) === '\\displaystyle {')
                    text = text.substring(15, text.length-1);
                element.append(text);
                mathjax.Hub.Queue(["Typeset", mathjax.Hub, element[0]]);
            }

            function render(katex, text, element, fallback) {
                try {
                    katex.render(text, element[0]);
                }
                catch(err) {
                    if (fallback) {
                        require(['mathjax'], function (mathjax) {
                            try {
                                render_mathjax(mathjax, text, element);
                            } catch (e) {
                                error(element, err += ' - ' + e);
                            }
                        });
                    } else
                        error(element, err);
                }
            }

            return {
                restrict: 'AE',

                link: function (scope, element, attrs) {
                    var text = element.html(),
                        fallback = attrs.nofallback !== undefined ? false : blogDefaults.fallback;

                    if (element[0].tagName === 'DIV') {
                        if (blogDefaults.centerMath)
                            element.addClass('text-center');
                        text = '\\displaystyle {' + text + '}';
                        element.addClass('katex-outer');
                    }
                    if (typeof(katex) === 'undefined') {
                        // Load Katex css file first
                        loadCss(blogDefaults.katexCss);
                        require(['katex'], function (katex) {
                            render(katex, text, element, fallback);
                        });
                    }
                    else
                        render(katex, text, element);
                }
            };
        }]);

    //
    //  Code highlighting with highlight.js
    //
    //  This module is added to the blog module so that the highlight
    //  directive can be used. Alternatively, include the module in the
    //  module to be bootstrapped.
    //
    //  Note:
    //      MAKE SURE THE lux.extensions.code EXTENSIONS IS INCLUDED IN
    //      YOUR CONFIG FILE
    angular.module('highlight', [])
        .directive('highlight', ['$rootScope', '$log', function ($rootScope, log) {
            return {
                link: function link(scope, element, attrs) {
                    log.info('Highlighting code');
                    highlight(element);
                }
            };
        }]);

    var highlight = function (elem) {
        require(['highlight'], function () {
            forEach($(elem)[0].querySelectorAll('code'), function(block) {
                var elem = $(block),
                    parent = elem.parent();
                if (isTag(parent, 'pre')) {
                    root.hljs.highlightBlock(block);
                    parent.addClass('hljs');
                } else {
                    elem.addClass('hljs inline');
                }
            });
            // Handle sphinx highlight
            forEach($(elem)[0].querySelectorAll('.highlight pre'), function(block) {
                var elem = $(block).addClass('hljs'),
                    div = elem.parent(),
                    p = div.parent();
                if (p.length && p[0].className.substring(0, 10) === 'highlight-')
                    div[0].className = 'language-' + p[0].className.substring(10);
                root.hljs.highlightBlock(block);
            });

        });
    };


    angular.module('lux.bs', ['mgcrea.ngStrap', 'templates-bs'])

        .config(['$tooltipProvider', function($tooltipProvider) {

            extend($tooltipProvider.defaults, {
                template: "bs/tooltip.tpl.html"
            });
        }]);

    //
    //  Lux Navigation module
    //  ============================
    //
    //  * Requires ``lux.bs`` for the collapsable directives
    //
    //  Html:
    //
    //      <navbar data-options="lux.context.navbar"></navbar>
    //
    //  Js:
    //
    //      lux.context.navbar = {
    //          id: null,           //  id attribute of the nav tag
    //          brand: null,        //  brand text to be displayed
    //          brandImage: null    //  brand image to be displayed rather than text. If available
    //                              //  the `brand` text is placed in the `alt` attribute
    //          url: "/",           //  href of the brand (if brand is defined)
    //      };
    //
    var navBarDefaults = {
        collapseWidth: 768,
        theme: 'default',
        search_text: '',
        collapse: '',
        // Navigation place on top of the page (add navbar-static-top class to navbar)
        // nabar2 it is always placed on top
        top: false,
        // Fixed navbar
        fixed: false,
        search: false,
        url: lux.context.url,
        target: '_self',
        toggle: true,
        fluid: true
    };

    angular.module('lux.nav', ['templates-nav', 'lux.bs'])
        //
        .service('linkService', ['$location', function ($location) {

            this.initScope = function (scope, opts) {

                scope.clickLink = function (e, link) {
                    if (link.action) {
                        var func = scope[link.action];
                        if (func)
                            func(e, link.href, link);
                    }
                };

                // Check if a url is active
                scope.activeLink = function (url) {
                    var loc;
                    if (url)
                        url = typeof(url) === 'string' ? url : url.href || url.url;
                    if (!url) return;
                    if (isAbsolute.test(url))
                        loc = $location.absUrl();
                    else
                        loc = $location.path();
                    var rest = loc.substring(url.length),
                        base = loc.substring(0, url.length),
                        folder = url.substring(url.length-1) === '/';
                    return base === url && (folder || (rest === '' || rest.substring(0, 1) === '/'));
                };
            };
        }])

        .service('navService', ['linkService', function (linkService) {

            this.initScope = function (scope, opts) {

                var navbar = extend({}, navBarDefaults, scope.navbar, getOptions(opts));
                if (!navbar.url)
                    navbar.url = '/';
                if (!navbar.themeTop)
                    navbar.themeTop = navbar.theme;
                navbar.container = navbar.fluid ? 'container-fluid' : 'container';

                this.maybeCollapse(navbar);

                linkService.initScope(scope);

                scope.navbar = navbar;

                return navbar;
            };

            this.maybeCollapse = function (navbar) {
                var width = window.innerWidth > 0 ? window.innerWidth : screen.width,
                    c = navbar.collapse;

                if (width < navbar.collapseWidth)
                    navbar.collapse = 'collapse';
                else
                    navbar.collapse = '';
                return c !== navbar.collapse;
            };

            this.collapseForWide = function(navbar, element) {
                var width = window.innerWidth > 0 ? window.innerWidth : screen.width,
                    c = navbar.collapse;

                if (width > navbar.collapseWidth || navbar.collapse === '') {
                    // If dropdown was opened then collapse
                    if (element.find('nav')[1].classList.contains('in'))
                        navbar.collapse = 'collapse';
                }
                return c !== navbar.collapse;
            };
        }])
        //
        .directive('fullPage', ['$window', function ($window) {

            return {
                restrict: 'AE',

                link: function (scope, element, attrs) {
                    element.css('min-height', $window.innerHeight+'px');

                    scope.$watch(function(){
                        return $window.innerHeight;
                    }, function(value) {
                        element.css('min-height', value+'px');
                    });
                }
            };
        }])
        //
        .directive('navbarLink', function () {
            return {
                templateUrl: "nav/templates/link.tpl.html",
                restrict: 'A'
            };
        })
        //
        //  Directive for the simple navbar
        //  This directive does not require the Navigation controller
        //      - items         -> Top left navigation
        //      - itemsRight    -> Top right navigation
        .directive('navbar', ['navService', function (navService) {
            //
            return {
                templateUrl: "nav/templates/navbar.tpl.html",
                restrict: 'AE',
                // Link function
                link: function (scope, element, attrs) {
                    navService.initScope(scope, attrs);
                    //
                    windowResize(function () {
                        if (navService.collapseForWide(scope.navbar, element))
                            scope.$apply();
                    });
                    //
                    // When using ui-router, and a view changes collapse the
                    //  navigation if needed
                    scope.$on('$locationChangeSuccess', function () {
                        navService.maybeCollapse(scope.navbar);
                        //scope.$apply();
                    });
                }
            };
        }])
        //
        //  Directive for the navbar with sidebar (nivebar2 template)
        //      - items         -> Top left navigation
        //      - itemsRight    -> Top right navigation
        //      - items2        -> side navigation
        .directive('navbar2', ['navService', '$compile', function (navService, $compile) {
            return {
                restrict: 'AE',
                //
                scope: {},
                // We need to use the compile function so that we remove the
                // before it is included in the bootstraping algorithm
                compile: function compile(element) {
                    var inner = element.html(),
                        className = element[0].className;
                    //
                    element.html('');

                    return {
                        post: function (scope, element, attrs) {
                            scope.navbar2Content = inner;
                            navService.initScope(scope, attrs);

                            inner = $compile('<div data-nav-side-bar></div>')(scope);
                            element.replaceWith(inner.addClass(className));
                            //
                            windowResize(function () {
                                if (navService.maybeCollapse(scope.navbar))
                                    scope.$apply();
                            });
                        }
                    };
                }
            };
        }])
        //
        //  Directive for the navbar with sidebar (nivebar2 template)
        .directive('navSideBar', ['$compile', '$document', function ($compile, $document) {
            return {
                templateUrl: "nav/navbar2.tpl.html",

                restrict: 'A',

                link: function (scope, element, attrs) {
                    var navbar = scope.navbar;
                    element.addClass('navbar2-wrapper');
                    if (navbar && navbar.theme)
                        element.addClass('navbar-' + navbar.theme);
                    var inner = $($document[0].createElement('div')).addClass('navbar2-page')
                                    .append(scope.navbar2Content);
                    // compile
                    $compile(inner)(scope);
                    // and append
                    element.append(inner);
                    //
                    function resize() {
                        inner.attr('style', 'min-height: ' + windowHeight() + 'px');
                    }
                    //
                    windowResize(resize);
                    //
                    resize();
                }
            };
        }]);

    //
    //  Sidebar module
    //
    //  Include this module to render bootstrap sidebar templates
    //  The sidebar should be available as the ``sidebar`` object within
    //  the ``luxContext`` object:
    //
    //      luxContext.sidebar = {
    //          sections: [{
    //              name: 'Sec1',
    //              items: [{
    //                      name: 'i1',
    //                      icon: 'fa fa-dashboard',
    //                      subitems: []
    //               }]
    //          }]
    //      };
    //
    angular.module('lux.sidebar', ['lux.nav'])
        //
        .value('sidebarDefaults', {
            collapse: true,
            toggle: 'Menu',
            url: lux.context.url || '/',
            infoText: 'Signed in as'
        })
        //
        .value('sidebarTemplate', "nav/templates/sidebar.tpl.html")
        //
        .value('navbarTemplate', "nav/templates/navbar.tpl.html")
        //
        .service('sidebarService', ['linkService', 'navService', 'sidebarDefaults',
                function (linkService, navService, sidebarDefaults) {

            function initSideBar (sidebars, element, sidebar, position) {
                sidebar = angular.extend({}, sidebarDefaults, sidebar);
                sidebar.position = position;
                if (!sidebar.collapse)
                    element.addClass('sidebar-open-' + position);
                if (sidebar.sections) {
                    sidebars.push(sidebar);
                    return sidebar;
                }
            }

            // Initialise scope and build left and right sidebar if available
            this.initScope = function (scope, opts, element) {

                var sidebar = angular.extend({}, scope.sidebar, lux.getOptions(opts)),
                    sidebars = [],
                    left = sidebar.left,
                    right = sidebar.right;

                if (left) initSideBar(sidebars, element, left, 'left');
                if (right) initSideBar(sidebars, element, right, 'right');
                if (!sidebars.length) initSideBar(sidebars, element, sidebar, 'left');

                scope.container = sidebar.fluid ? 'container-fluid' : 'container';

                // Add link service functionality
                linkService.initScope(scope);

                // Close sidebars
                scope.closeSideBar = function () {
                    element.removeClass('sidebar-open-left sidebar-open-right');
                };

                // Toggle the sidebar
                scope.toggleSidebar = function(e, position) {
                    e.preventDefault();
                    element.toggleClass('sidebar-open-' + position);
                };

                scope.menuCollapse = function($event) {
                    // Get the clicked link, the submenu and sidebar menu
                    var item = angular.element($event.currentTarget || $event.srcElement),
                        submenu = item.next();

                    // If the menu is not visible then close all open menus
                    if (submenu.hasClass('active')) {
                        item.removeClass('active');
                        submenu.removeClass('active');
                    } else {
                        var itemRoot = item.parent().parent();
                        itemRoot.find('ul').removeClass('active');
                        itemRoot.find('li').removeClass('active');

                        item.parent().addClass('active');
                        submenu.addClass('active');
                    }
                };

                scope.navbar = initNavbar(sidebar.navbar, sidebars);
                navService.initScope(scope);
                return sidebars;
            };

            // Initialise top navigation bar
            function initNavbar (navbar, sidebars) {
                // No navbar, add an object
                if (!navbar)
                    navbar = {};
                navbar.fixed = false;
                navbar.top = true;
                //
                // Add toggle to the navbar
                forEach(sidebars, function (sidebar) {
                    if (sidebar.toggle) {
                        if (!navbar.itemsLeft) navbar.itemsLeft = [];

                        navbar.itemsLeft.splice(0, 0, {
                            href: sidebar.position,
                            title: sidebar.toggle,
                            name: sidebar.toggle,
                            klass: 'sidebar-toggle',
                            icon: 'fa fa-bars',
                            action: 'toggleSidebar',
                            right: 'vert-divider'
                        });
                    }
                });

                return navbar;
            }
        }])
        //
        .directive('navSidebarLink', ['sidebarService', function (sidebarService) {
            return {
                templateUrl: "nav/templates/nav-link.tpl.html",
                restrict: 'A',
            };
        }])
        //
        //  Directive for the sidebar
        .directive('sidebar', ['$compile', 'sidebarService', 'sidebarTemplate',
                               'navbarTemplate', '$templateCache',
                        function ($compile, sidebarService, sidebarTemplate, navbarTemplate,
                                  $templateCache, $sce) {
            //
            return {
                restrict: 'AE',

                // We need to use the compile function so that we remove the
                // content before it is included in the bootstraping algorithm
                compile: function compile(element) {
                    var inner = element.html();
                    //
                    element.html('');

                    return {
                        pre: function (scope, element, attrs) {
                            var sidebars = sidebarService.initScope(scope, attrs, element),
                                template;

                            if (sidebars.length) {
                                scope.sidebars = sidebars;
                                template = $templateCache.get(sidebarTemplate);
                            } else
                                template = $templateCache.get(navbarTemplate);

                            //element.replaceWith($compile(template)(scope));
                            element.append($compile(template)(scope));
                            inner = $compile(inner)(scope);

                            if (sidebars.length)
                                lux.querySelector(element, '.content-wrapper').append(inner);
                            else
                                element.after(inner);
                        }
                    };
                }
            };
        }]);

    //
    //  Lux Codemirror module
    //  ============================
    //  Directive allows to add CodeMirror to the textarea elements
    //
    //  Html:
    //
    //      <textarea lux-codemirror="{'mode': 'html'}"></div>
    //
    //
    //  Supported modes:
    //
    //      html, markdown, json
    //
    //
    //  ============================
    //
    angular.module('lux.codemirror', ['lux.services'])
        //
        .constant('luxCodemirrorDefaults', {
            lineWrapping : true,
            lineNumbers: true,
            mode: "markdown",
            theme: lux.context.CODEMIRROR_THEME || "monokai",
            reindentOnLoad: true,
            indentUnit: 4,
            indentWithTabs: true,
            htmlModes: ['javascript', 'xml', 'css', 'htmlmixed'],
        })
        //
        .directive('luxCodemirror', ['$lux', 'luxCodemirrorDefaults', function ($lux, luxCodemirrorDefaults) {
            //
            // Initialize codemirror, load css.
            function loadCSS() {
                loadCss('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.3.0/codemirror.css');
                loadCss('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.3.0/theme/' + luxCodemirrorDefaults.theme + '.css');
            }
            //
            // Creates a new instance of the editor
            function newEditor(element, options) {
                var cm;

                if (element[0].tagName === 'TEXTAREA') {
                    cm = window.CodeMirror.fromTextArea(element[0], options);
                } else {
                    element.html('');
                    cm = new window.CodeMirror(function(cm_el) {
                        element.append(cm_el);
                    }, options);
                }

                return cm;
            }
            //
            // Allows play with ng-model
            function ngModelLink(cm, ngModel, scope) {
                if (!ngModel) return;

                // CodeMirror expects a string, so make sure it gets one.
                // This does not change the model.
                ngModel.$formatters.push(function(value) {
                    if (angular.isUndefined(value) || value === null)
                        return '';
                    else if (angular.isObject(value) || angular.isArray(value))
                        throw new Error('codemirror cannot use an object or an array as a model');
                    return value;
                });

                // Override the ngModelController $render method, which is what gets called when the model is updated.
                // This takes care of the synchronizing the codeMirror element with the underlying model, in the case that it is changed by something else.
                ngModel.$render = function() {
                    var safeViewValue = ngModel.$viewValue || '';
                    cm.setValue(safeViewValue);
                };

                // Keep the ngModel in sync with changes from CodeMirror
                cm.on('change', function(instance) {
                    var newValue = instance.getValue();
                    if (newValue !== ngModel.$viewValue) {
                        scope.$evalAsync(function() {
                            ngModel.$setViewValue(newValue);
                        });
                    }
                });
            }
            //
            // Set specified mode
            function setMode(options) {
                switch (options.mode) {
                    case 'json':
                        options.mode = 'javascript';
                        break;
                    case 'html':
                        options.mode = 'htmlmixed';
                        break;
                    case 'python':
                        options.mode = 'python';
                        break;
                    default:
                        options.mode = luxCodemirrorDefaults.mode;
                        break;
                }
                return options;
            }
            //
            // Returns suffix of the js module name to load depending on the editor mode
            function getJSModuleSuffix(modeName) {
                if (luxCodemirrorDefaults.htmlModes.indexOf(modeName) >= 0) {
                    return 'htmlmixed';
                } else if (modeName === 'python') {
                    return 'python';
                } else {
                    return 'markdown';
                }
            }
            //
            return {
                restrict: 'EA',
                require: '?ngModel',
                //
                compile: function () {
                    loadCSS();
                    return {
                        post: function(scope, element, attrs, ngModel) {
                            var jsModuleSuffix,
                                options = angular.extend(
                                    { value: element.text() },
                                    luxCodemirrorDefaults || {},
                                    scope.$eval(attrs.luxCodemirror) || {}
                                );

                            options = setMode(options);
                            jsModuleSuffix = getJSModuleSuffix(options.mode);

                            require(['codemirror-' + jsModuleSuffix], function() {
                                // Require CodeMirror
                                if (angular.isUndefined(window.CodeMirror)) {
                                    throw new Error('lux-codemirror needs CodeMirror to work!');
                                }

                                var cm = newEditor(element, options);

                                ngModelLink(cm, ngModel, scope);

                                // Allow access to the CodeMirror instance through a broadcasted event
                                // eg: $broadcast('CodeMirror', function(cm){...});
                                scope.$on('CodeMirror', function(event, callback) {
                                    if (angular.isFunction(callback))
                                        callback(cm);
                                    else
                                        throw new Error('the CodeMirror event requires a callback function');
                                });

                                scope.$on('$viewContentLoaded', function () {
                                    cm.refresh();
                                });
                            });
                        }
                    };
                }
            };
        }]);

    //
    //  Angular module for photos
    //  ============================
    //
    angular.module('photos', ['lux.services'])
        .directive('flickr', ['$lux', function ($lux) {
            //
            var endpoint = 'https://api.flickr.com/services/feeds/photos_faves.gne';
            //
            function display (data) {

            }
            //
            return {
                restrict: 'AE',
                //
                link: function (scope, element, attrs) {
                    var id = attrs.id;
                    $lux.http({
                        method: 'get',
                        data: {'id': id, format: 'json'}
                    }).success(function (data) {
                        display(data);
                    });
                }
            };
        }]);

    var
    //
    lorem_defaults = {
        paragraphs: 3,
        // number of words per paragraph
        words: null,
        ptags: true
    },
    //
    lorem_text = [
         "Nam quis nulla. Integer malesuada. In in enim a arcu imperdiet malesuada. Sed vel lectus. Donec odio urna, tempus molestie, porttitor ut, iaculis quis, sem. Phasellus rhoncus. Aenean id metus id velit ullamcorper pulvinar. Vestibulum fermentum tortor id mi. Pellentesque ipsum. Nulla non arcu lacinia neque faucibus fringilla. Nulla non lectus sed nisl molestie malesuada. Proin in tellus sit amet nibh dignissim sagittis. Vivamus luctus egestas leo. Maecenas sollicitudin. Nullam rhoncus aliquam metus. Etiam egestas wisi a erat.",
         "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Nullam feugiat, turpis at pulvinar vulputate, erat libero tristique tellus, nec bibendum odio risus sit amet ante. Aliquam erat volutpat. Nunc auctor. Mauris pretium quam et urna. Fusce nibh. Duis risus. Curabitur sagittis hendrerit ante. Aliquam erat volutpat. Vestibulum erat nulla, ullamcorper nec, rutrum non, nonummy ac, erat. Duis condimentum augue id magna semper rutrum. Nullam justo enim, consectetuer nec, ullamcorper ac, vestibulum in, elit. Proin pede metus, vulputate nec, fermentum fringilla, vehicula vitae, justo. Fusce consectetuer risus a nunc. Aliquam ornare wisi eu metus. Integer pellentesque quam vel velit. Duis pulvinar.",
         "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Morbi gravida libero nec velit. Morbi scelerisque luctus velit. Etiam dui sem, fermentum vitae, sagittis id, malesuada in, quam. Proin mattis lacinia justo. Vestibulum facilisis auctor urna. Aliquam in lorem sit amet leo accumsan lacinia. Integer rutrum, orci vestibulum ullamcorper ultricies, lacus quam ultricies odio, vitae placerat pede sem sit amet enim. Phasellus et lorem id felis nonummy placerat. Fusce dui leo, imperdiet in, aliquam sit amet, feugiat eu, orci. Aenean vel massa quis mauris vehicula lacinia. Quisque tincidunt scelerisque libero. Maecenas libero. Etiam dictum tincidunt diam. Donec ipsum massa, ullamcorper in, auctor et, scelerisque sed, est. Suspendisse nisl. Sed convallis magna eu sem. Cras pede libero, dapibus nec, pretium sit amet, tempor quis, urna.",
         "Etiam posuere quam ac quam. Maecenas aliquet accumsan leo. Nullam dapibus fermentum ipsum. Etiam quis quam. Integer lacinia. Nulla est. Nulla turpis magna, cursus sit amet, suscipit a, interdum id, felis. Integer vulputate sem a nibh rutrum consequat. Maecenas lorem. Pellentesque pretium lectus id turpis. Etiam sapien elit, consequat eget, tristique non, venenatis quis, ante. Fusce wisi. Phasellus faucibus molestie nisl. Fusce eget urna. Curabitur vitae diam non enim vestibulum interdum. Nulla quis diam. Ut tempus purus at lorem.",
         "In sem justo, commodo ut, suscipit at, pharetra vitae, orci. Duis sapien nunc, commodo et, interdum suscipit, sollicitudin et, dolor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aliquam id dolor. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos. Mauris dictum facilisis augue. Fusce tellus. Pellentesque arcu. Maecenas fermentum, sem in pharetra pellentesque, velit turpis volutpat ante, in pharetra metus odio a lectus. Sed elit dui, pellentesque a, faucibus vel, interdum nec, diam. Mauris dolor felis, sagittis at, luctus sed, aliquam non, tellus. Etiam ligula pede, sagittis quis, interdum ultricies, scelerisque eu, urna. Nullam at arcu a est sollicitudin euismod. Praesent dapibus. Duis bibendum, lectus ut viverra rhoncus, dolor nunc faucibus libero, eget facilisis enim ipsum id lacus. Nam sed tellus id magna elementum tincidunt.",
         "Morbi a metus. Phasellus enim erat, vestibulum vel, aliquam a, posuere eu, velit. Nullam sapien sem, ornare ac, nonummy non, lobortis a, enim. Nunc tincidunt ante vitae massa. Duis ante orci, molestie vitae, vehicula venenatis, tincidunt ac, pede. Nulla accumsan, elit sit amet varius semper, nulla mauris mollis quam, tempor suscipit diam nulla vel leo. Etiam commodo dui eget wisi. Donec iaculis gravida nulla. Donec quis nibh at felis congue commodo. Etiam bibendum elit eget erat.",
         "Praesent in mauris eu tortor porttitor accumsan. Mauris suscipit, ligula sit amet pharetra semper, nibh ante cursus purus, vel sagittis velit mauris vel metus. Aenean fermentum risus id tortor. Integer imperdiet lectus quis justo. Integer tempor. Vivamus ac urna vel leo pretium faucibus. Mauris elementum mauris vitae tortor. In dapibus augue non sapien. Aliquam ante. Curabitur bibendum justo non orci.",
         "Morbi leo mi, nonummy eget, tristique non, rhoncus non, leo. Nullam faucibus mi quis velit. Integer in sapien. Fusce tellus odio, dapibus id, fermentum quis, suscipit id, erat. Fusce aliquam vestibulum ipsum. Aliquam erat volutpat. Pellentesque sapien. Cras elementum. Nulla pulvinar eleifend sem. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Quisque porta. Vivamus porttitor turpis ac leo.",
         "Maecenas ipsum velit, consectetuer eu, lobortis ut, dictum at, dui. In rutrum. Sed ac dolor sit amet purus malesuada congue. In laoreet, magna id viverra tincidunt, sem odio bibendum justo, vel imperdiet sapien wisi sed libero. Suspendisse sagittis ultrices augue. Mauris metus. Nunc dapibus tortor vel mi dapibus sollicitudin. Etiam posuere lacus quis dolor. Praesent id justo in neque elementum ultrices. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos. In convallis. Fusce suscipit libero eget elit. Praesent vitae arcu tempor neque lacinia pretium. Morbi imperdiet, mauris ac auctor dictum, nisl ligula egestas nulla, et sollicitudin sem purus in lacus.",
         "Aenean placerat. In vulputate urna eu arcu. Aliquam erat volutpat. Suspendisse potenti. Morbi mattis felis at nunc. Duis viverra diam non justo. In nisl. Nullam sit amet magna in magna gravida vehicula. Mauris tincidunt sem sed arcu. Nunc posuere. Nullam lectus justo, vulputate eget, mollis sed, tempor sed, magna. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Etiam neque. Curabitur ligula sapien, pulvinar a, vestibulum quis, facilisis vel, sapien. Nullam eget nisl. Donec vitae arcu."
    ];

    angular.module('lux.lorem', [])
        .directive('lorem', function () {
            //
            return {
                restrict: 'AE',
                //
                link: function (scope, element, attrs) {
                    var opts = extend({}, lorem_defaults, attrs),
                        howmany = +opts.paragraphs,
                        paragraphs = [],
                        ipsum_text = "";
                    //
                    for (var i = 0; i < howmany; i++){
                        paragraphs.push(lorem_text[Math.floor(Math.random()*lorem_text.length)]);
                    }
                    if (opts.words) {
                        var numOfWords = +opts.words,
                            oldparagraphs = paragraphs;
                        paragraphs = [];
                        oldparagraphs.forEach(function (paragraph) {
                            var words = paragraph.split( ' ' ).splice(0, numOfWords);
                            paragraphs.push(words.join(' '));
                        });
                    }
                    paragraphs.forEach(function (paragraph) {
                        if (opts.tags)
                            element.append($('<p>'+paragraph+'</p>'));
                        else
                            element.append(paragraph+'\n\n');
                    });
                }
            };
        });


    //  Google Spreadsheet API
    //  -----------------------------
    //
    //  Create one by passing the key of the spreadsheeet containing data
    //
    //      var api = $lux.api({name: 'googlesheets', url: sheetkey});
    //

    //
    //
    var GoogleModel = function ($lux, data, opts) {
        var i, j, ilen, jlen;
        this.column_names = [];
        this.name = data.feed.title.$t;
        this.elements = [];
        this.raw = data; // A copy of the sheet's raw data, for accessing minutiae

        if (typeof(data.feed.entry) === 'undefined') {
            $lux.log.warn("Missing data for " + this.name + ", make sure you didn't forget column headers");
            return;
        }

        $lux.log.info('Building models from google sheet');

        for (var key in data.feed.entry[0]) {
            if (/^gsx/.test(key)) this.column_names.push(key.replace("gsx$", ""));
        }

        for (i = 0, ilen = data.feed.entry.length; i < ilen; i++) {
            var source = data.feed.entry[i];
            var element = {};
            for (j = 0, jlen = this.column_names.length; j < jlen; j++) {
                var cell = source["gsx$" + this.column_names[j]];
                if (typeof(cell) !== 'undefined') {
                    if (cell.$t !== '' && !isNaN(cell.$t))
                        element[this.column_names[j]] = +cell.$t;
                    else
                        element[this.column_names[j]] = cell.$t;
                } else {
                    element[this.column_names[j]] = '';
                }
            }
            if (element.rowNumber === undefined)
                element.rowNumber = i + 1;
            this.elements.push(element);
        }
    };

    var GoogleSeries = function ($lux, data, opts) {
        var i, j, ilen, jlen;
        this.column_names = [];
        this.name = data.feed.title.$t;
        this.series = [];
        this.raw = data; // A copy of the sheet's raw data, for accessing minutiae

        if (typeof(data.feed.entry) === 'undefined') {
            $lux.log.warn("Missing data for " + this.name + ", make sure you didn't forget column headers");
            return;
        }
        $lux.log.info('Building series from google sheet');

        for (var key in data.feed.entry[0]) {
            if (/^gsx/.test(key)) {
                var name = key.replace("gsx$", "");
                this.column_names.push(name);
                this.series.push([name]);
            }
        }

        for (i = 0, ilen = data.feed.entry.length; i < ilen; i++) {
            var source = data.feed.entry[i];
            for (j = 0, jlen = this.column_names.length; j < jlen; j++) {
                var cell = source["gsx$" + this.column_names[j]],
                    serie = this.series[j];
                if (typeof(cell) !== 'undefined') {
                    if (cell.$t !== '' && !isNaN(cell.$t))
                        serie.push(+cell.$t);
                    else
                        serie.push(cell.$t);
                } else {
                    serie.push('');
                }
            }
        }
    };

    //
    //  Module for interacting with google API and services
    angular.module('lux.google', ['lux.services'])
        //
        .run(['$rootScope', '$lux', '$log', function (scope, $lux, log) {
            var analytics = scope.google ? scope.google.analytics : null;

            if (analytics && analytics.id) {
                var ga = analytics.ga || 'ga';
                if (typeof ga === 'string')
                    ga = root[ga];
                log.info('Register events for google analytics ' + analytics.id);
                scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
                    var state = scope.$state;
                    //
                    if (state) {
                        var fromHref = stateHref(state, fromState, fromParams),
                            toHref = stateHref(state, toState, toParams);
                        if (fromHref !== 'null') {
                            if (fromHref !== toHref)
                                ga('send', 'pageview', {page: toHref});
                            else
                                ga('send', 'event', 'stateChange', toHref);
                            ga('send', 'event', 'fromState', fromHref, toHref);
                        }
                    }
                });
            }

            // Googlesheet api
            $lux.api('googlesheets', googlesheets);
        }])
        //
        .directive('googleMap', ['$lux', function ($lux) {
            return {
                //
                // Create via element tag
                // <d3-force data-width=300 data-height=200></d3-force>
                restrict: 'AE',
                scope: true,
                controller: function() {
                    var self = this;

                    // Add a marker to the map
                    self.addMarker = function(map, marker, location) {
                        if (marker) {
                            var gmarker = new google.maps.Marker(angular.extend({
                                position: location,
                                map: map,
                            }, marker));
                            return gmarker;
                        }
                    };

                    // Add marker using lat and lng
                    self.addMarkerByLatLng = function(map, marker, lat, lng) {
                        var loc = new google.maps.LatLng(lat, lng);
                        return self.addMarker(map, marker, loc);
                    };

                    // Returns an instance of location for specific lat and lng
                    self.createLocation = function(lat, lng) {
                        return new google.maps.LatLng(lat, lng);
                    };

                    // Returns an instance of InfoWindow for specific content
                    self.createInfoWindow = function(content) {
                        return new google.maps.InfoWindow({content: content});
                    };

                    // Initialize google maps
                    self.initialize = function(scope, element, attrs) {
                        var config = lux.getObject(attrs, 'config', scope),
                            lat = +config.lat,
                            lng = +config.lng,
                            loc = new google.maps.LatLng(lat, lng),
                            opts = {
                                center: loc,
                                zoom: config.zoom ? +config.zoom : 8,
                                mapTypeId: google.maps.MapTypeId.ROADMAP,
                                scrollwheel: config.scrollwheel ? true : false,
                            },
                            map = new google.maps.Map(element[0], opts),
                            marker = config.marker;
                        //
                        self.addMarker(map, marker, loc);

                        // Allow different directives to use this map
                        scope.map = map;
                        //
                        windowResize(function () {
                            google.maps.event.trigger(map, 'resize');
                            map.setCenter(loc);
                            map.setZoom(map.getZoom());
                        }, 500);
                    };
                },
                //
                link: function (scope, element, attrs, controller) {
                    if(!scope.googlemaps) {
                        $lux.log.error('Google maps url not available. Cannot load google maps directive');
                        return;
                    }
                    require([scope.googlemaps], function () {
                        controller.initialize(scope, element, attrs);

                        // Setup map by another directive
                        if (typeof scope.setup === 'function')
                            scope.setup(scope.map);
                    });
                }
            };
        }]);


    var googlesheets = function (url, $lux) {
        url = "https://spreadsheets.google.com";

        var api = baseapi(url, $lux);

        api.httpOptions = function (request) {
            request.options.url = request.baseUrl() + '/feeds/list/' + this._url + '/' + urlparams.id + '/public/values?alt=json';
        };

        api.getList = function (options) {
            var Model = this.Model,
                opts = this.options,
                $lux = this.$lux;
            return api.request('get', null, options).then(function (response) {
                return response;
            });
        };

        api.get = function (urlparams, options) {
            var Model = this.Model,
                opts = this.options,
                $lux = this.$lux;
            return api.request('get', urlparams, options).then(function (response) {
                response.data = opts.orientation === 'columns' ? new GoogleSeries(
                    $lux, response.data) : new GoogleModel($lux, response.data);
                return response;
            });
        };

        return api;
    };
angular.module('templates-blog', ['blog/templates/header.tpl.html', 'blog/templates/pagination.tpl.html']);

angular.module("blog/templates/header.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("blog/templates/header.tpl.html",
    "<h1 data-ng-bind=\"page.title\"></h1>\n" +
    "<p class=\"small\">by {{page.authors}} on {{page.dateText}}</p>\n" +
    "<p class=\"lead storyline\">{{page.description}}</p>\n" +
    "");
}]);

angular.module("blog/templates/pagination.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("blog/templates/pagination.tpl.html",
    "<ul class=\"media-list\">\n" +
    "    <li ng-repeat=\"post in items\" class=\"media\" data-ng-controller='BlogEntry'>\n" +
    "        <a href=\"{{post.html_url}}\" ng-attr-target=\"{{postTarget}}\">\n" +
    "            <div class=\"clearfix\">\n" +
    "                <img ng-src=\"{{post.image}}\" class=\"hidden-xs post-image\" alt=\"{{post.title}}\">\n" +
    "                <img ng-src=\"{{post.image}}\" alt=\"{{post.title}}\" class=\"visible-xs post-image-xs center-block\">\n" +
    "                <div class=\"post-body hidden-xs\">\n" +
    "                    <h3 class=\"media-heading\">{{post.title || \"Untitled\"}}</h3>\n" +
    "                    <p data-ng-if=\"post.description\">{{post.description}}</p>\n" +
    "                    <p class=\"text-info small\">by {{post.authors}} on {{post.dateText}}</p>\n" +
    "                </div>\n" +
    "                <div class=\"visible-xs\">\n" +
    "                    <br>\n" +
    "                    <h3 class=\"media-heading text-center\">{{post.title}}</h3>\n" +
    "                    <p data-ng-if=\"post.description\">{{post.description}}</p>\n" +
    "                    <p class=\"text-info small\">by {{post.authors}} on {{post.dateText}}</p>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <hr>\n" +
    "        </a>\n" +
    "    </li>\n" +
    "</ul>");
}]);

angular.module('templates-bs', ['bs/tooltip.tpl.html']);

angular.module("bs/tooltip.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("bs/tooltip.tpl.html",
    "<div class=\"tooltip in\" ng-show=\"title\">\n" +
    "    <div class=\"tooltip-arrow\"></div>\n" +
    "    <div class=\"tooltip-inner\" ng-bind=\"title\"></div>\n" +
    "</div>");
}]);

angular.module('templates-cms', ['cms/templates/list-group.tpl.html']);

angular.module("cms/templates/list-group.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("cms/templates/list-group.tpl.html",
    "<div class=\"list-group\">\n" +
    "  <a ng-repeat=\"link in links\" ng-href=\"{{link.url}}\" class=\"list-group-item\"\n" +
    "  ng-bind=\"link.title\" ng-class=\"{active: link.url === $location.absUrl()}\"></a>\n" +
    "</div>\n" +
    "");
}]);

angular.module('templates-gaeblog', ['templates/blog-actions.tpl.html', 'templates/blog-delete.tpl.html', 'templates/blog-page.tpl.html', 'templates/blog-publish.tpl.html', 'templates/blog-search.tpl.html', 'templates/modal.tpl.html']);

angular.module("templates/blog-actions.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/blog-actions.tpl.html",
    "<ul class=\"blogActions\" ng-class=\"layout\" ng-if=\"page\">\n" +
    "<li ng-if=\"page.id && !page.published\"><a class=\"btn btn-default\" ng-click=\"publishPost()\"> Publish</a></li>\n" +
    "<li ng-if=\"page.preview_url\"><a class=\"btn btn-default\" ng-href=\"{{page.preview_url}}\"> Preview</a></li>\n" +
    "<li ng-if=\"page.edit_url\"><a class=\"btn btn-default\" ng-href=\"{{page.edit_url}}\"> Write</a></li>\n" +
    "<li ng-if=\"page.id\"><a class=\"btn btn-danger\" ng-click=\"deletePost()\"> Delete</a></li>\n" +
    "</ul>");
}]);

angular.module("templates/blog-delete.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/blog-delete.tpl.html",
    "<div class=\"modal-body\">\n" +
    "    Deleted stories are gone forever. Are you sure?\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "  <button type=\"button\" class=\"btn btn-danger\" ng-click=\"deletePost(true)\">Delete</button>\n" +
    "  <button type=\"button\" class=\"btn btn-default\" ng-click=\"$hide()\">Cancel</button>\n" +
    "</div>");
}]);

angular.module("templates/blog-page.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/blog-page.tpl.html",
    "<div class=\"center-block blog-title w800\">\n" +
    "    <h2 data-ng-bind=\"page.title\"></h2>\n" +
    "    <p class=\"small\">by {{page.authors}} on {{page.dateText}}</p>\n" +
    "    <p class=\"lead storyline\">{{page.description}}</p>\n" +
    "</div>\n" +
    "<div class=\"center-block w900\">\n" +
    "    <br>\n" +
    "    <br>\n" +
    "    <section data-highlight data-compile-html>\n" +
    "    </section>\n" +
    "</div>");
}]);

angular.module("templates/blog-publish.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/blog-publish.tpl.html",
    "<div class=\"modal-body\">\n" +
    "    Do you want to publish your story?\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "  <button type=\"button\" class=\"btn btn-default\" ng-click=\"publishPost(true)\">Publish</button>\n" +
    "  <button type=\"button\" class=\"btn btn-default\" ng-click=\"$hide()\">Cancel</button>\n" +
    "</div>");
}]);

angular.module("templates/blog-search.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/blog-search.tpl.html",
    "<div class=\"searchBox\" ng-show=\"page.name == 'search'\">\n" +
    "<input class=\"borderless text-jumbo\" type=\"text\" placeholder=\"Type to search\" ng-change='change($event)' ng-model='text'>\n" +
    "<p class=\"lead text-center\" ng-if=\"message\" ng-bind=\"message\" style=\"margin-top: 20px\"></p>\n" +
    "</div>");
}]);

angular.module("templates/modal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/modal.tpl.html",
    "<div class=\"modal\" tabindex=\"-1\" role=\"dialog\">\n" +
    "  <div class=\"modal-dialog\">\n" +
    "    <h3 class=\"opverlay-title\" ng-show=\"title\" ng-bind=\"title\"></h3>\n" +
    "    <div ng-bind=\"content\"></div>\n" +
    "  </div>\n" +
    "</div>");
}]);

angular.module('templates-grid', ['grid/templates/modal.columns.tpl.html', 'grid/templates/modal.delete.tpl.html', 'grid/templates/modal.empty.tpl.html']);

angular.module("grid/templates/modal.columns.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("grid/templates/modal.columns.tpl.html",
    "<div class=\"modal\" tabindex=\"-1\" role=\"dialog\" aria-hidden=\"true\">\n" +
    "  <div class=\"modal-dialog\">\n" +
    "    <div class=\"modal-content\">\n" +
    "      <div class=\"modal-header\" >\n" +
    "        <button type=\"button\" class=\"close\" aria-label=\"Close\" ng-click=\"$hide()\"><span aria-hidden=\"true\">&times;</span></button>\n" +
    "        <h4 class=\"modal-title\"><i class=\"fa fa-eye\"></i> Change columns visibility</h4>\n" +
    "      </div>\n" +
    "      <div class=\"modal-body\">\n" +
    "        <p class=\"modal-info\">{{infoMessage}}</p>\n" +
    "        <ul class=\"modal-items list-inline\">\n" +
    "          <li ng-repeat=\"col in columns\">\n" +
    "            <a class=\"btn btn-default\" ng-class=\"activeClass(col)\" ng-click=\"toggleVisible(col)\">{{col.displayName}}</a>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "      </div>\n" +
    "      <div class=\"modal-footer\">\n" +
    "        <button type=\"button\" class=\"btn btn-default\" ng-click=\"$hide()\">Close</button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("grid/templates/modal.delete.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("grid/templates/modal.delete.tpl.html",
    "<div class=\"modal\" tabindex=\"-1\" role=\"dialog\" aria-hidden=\"true\">\n" +
    "  <div class=\"modal-dialog\">\n" +
    "    <div class=\"modal-content\">\n" +
    "      <div class=\"modal-header\" >\n" +
    "        <button type=\"button\" class=\"close\" aria-label=\"Close\" ng-click=\"$hide()\"><span aria-hidden=\"true\">&times;</span></button>\n" +
    "        <h4 class=\"modal-title\"><i class=\"fa fa-trash\"></i> Delete {{stateName}}</h4>\n" +
    "      </div>\n" +
    "      <div class=\"modal-body\">\n" +
    "        <p class=\"modal-info\">{{infoMessage}}</p>\n" +
    "        <ul class=\"modal-items\">\n" +
    "          <li ng-repeat=\"item in selected\">{{item[repr_field]}}</li>\n" +
    "        </ul>\n" +
    "        <p class=\"text-danger cannot-undo\">{{dangerMessage}}</p>\n" +
    "      </div>\n" +
    "      <div class=\"modal-footer\">\n" +
    "        <button type=\"button\" class=\"btn btn-default\" ng-click=\"$hide()\">No</button>\n" +
    "        <button type=\"button\" class=\"btn btn-primary\" ng-click=\"ok()\">Yes</button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("grid/templates/modal.empty.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("grid/templates/modal.empty.tpl.html",
    "<div class=\"modal\" tabindex=\"-1\" role=\"dialog\" aria-hidden=\"true\">\n" +
    "  <div class=\"modal-dialog\">\n" +
    "    <div class=\"modal-content\">\n" +
    "      <div class=\"modal-header\">\n" +
    "        <button type=\"button\" class=\"close\" aria-label=\"Close\" ng-click=\"$hide()\"><span aria-hidden=\"true\">&times;</span></button>\n" +
    "        <h4 class=\"modal-title\"><i class=\"fa fa-trash\"></i> Lack of {{stateName}} to delete</h4>\n" +
    "      </div>\n" +
    "      <div class=\"modal-body\">\n" +
    "        <p class=\"modal-info\">{{emptyMessage}}</p>\n" +
    "      </div>\n" +
    "      <div class=\"modal-footer\">\n" +
    "        <button type=\"button\" class=\"btn btn-default\" ng-click=\"$hide()\">Close</button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module('templates-message', ['message/message.tpl.html']);

angular.module("message/message.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("message/message.tpl.html",
    "<div>\n" +
    "    <div class=\"alert alert-{{ message.type }}\" role=\"alert\" ng-repeat=\"message in messages\">\n" +
    "        <a href=\"#\" class=\"close\" ng-click=\"removeMessage(message)\">&times;</a>\n" +
    "        <i ng-if=\"message.icon\" ng-class=\"message.icon\"></i>\n" +
    "        <span>{{ message.text }}</span>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module('templates-nav', ['nav/templates/link.tpl.html', 'nav/templates/navbar.tpl.html', 'nav/templates/navbar2.tpl.html', 'nav/templates/sidebar.tpl.html']);

angular.module("nav/templates/link.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("nav/templates/link.tpl.html",
    "<a ng-if=\"link.title\" ng-href=\"{{link.href}}\" title=\"{{link.title}}\" ng-click=\"clickLink($event, link)\"\n" +
    "ng-attr-target=\"{{link.target}}\" ng-class=\"link.klass\" bs-tooltip=\"tooltip\">\n" +
    "<span ng-if=\"link.left\" class=\"left-divider\"></span>\n" +
    "<i ng-if=\"link.icon\" class=\"{{link.icon}}\"></i>\n" +
    "<span>{{link.label || link.name}}</span>\n" +
    "<span ng-if=\"link.right\" class=\"right-divider\"></span></a>\n" +
    "<a ng-if=\"!link.title\" ng-href=\"{{link.href}}\" title=\"{{link.title}}\" ng-click=\"clickLink($event, link)\"\n" +
    "ng-attr-target=\"{{link.target}}\" ng-class=\"link.klass\" bs-tooltip=\"tooltip\">\n" +
    "<span ng-if=\"link.left\" class=\"left-divider\"></span>\n" +
    "<i ng-if=\"link.icon\" class=\"{{link.icon}}\"></i>\n" +
    "<span>{{link.label || link.name}}</span>\n" +
    "<span ng-if=\"link.right\" class=\"right-divider\"></span></a>");
}]);

angular.module("nav/templates/navbar.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("nav/templates/navbar.tpl.html",
    "<nav ng-attr-id=\"{{navbar.id}}\" class=\"navbar navbar-{{navbar.themeTop}}\"\n" +
    "ng-class=\"{'navbar-fixed-top':navbar.fixed, 'navbar-static-top':navbar.top}\" role=\"navigation\"\n" +
    "ng-model=\"navbar.collapse\" bs-collapse>\n" +
    "    <div class=\"{{navbar.container}}\">\n" +
    "        <div class=\"navbar-header\">\n" +
    "            <button ng-if=\"navbar.toggle\" type=\"button\" class=\"navbar-toggle\" bs-collapse-toggle>\n" +
    "                <span class=\"sr-only\">Toggle navigation</span>\n" +
    "                <span class=\"icon-bar\"></span>\n" +
    "                <span class=\"icon-bar\"></span>\n" +
    "                <span class=\"icon-bar\"></span>\n" +
    "            </button>\n" +
    "            <ul class=\"nav navbar-nav main-nav\">\n" +
    "                <li ng-if=\"navbar.itemsLeft\" ng-repeat=\"link in navbar.itemsLeft\" ng-class=\"{active:activeLink(link)}\" navbar-link>\n" +
    "                </li>\n" +
    "            </ul>\n" +
    "            <a ng-if=\"navbar.brandImage\" href=\"{{navbar.url}}\" class=\"navbar-brand\" target=\"{{navbar.target}}\">\n" +
    "                <img ng-src=\"{{navbar.brandImage}}\" alt=\"{{navbar.brand || 'brand'}}\">\n" +
    "            </a>\n" +
    "            <a ng-if=\"!navbar.brandImage && navbar.brand\" href=\"{{navbar.url}}\" class=\"navbar-brand\" target=\"{{navbar.target}}\">\n" +
    "                {{navbar.brand}}\n" +
    "            </a>\n" +
    "        </div>\n" +
    "        <nav class=\"navbar-collapse\" bs-collapse-target>\n" +
    "            <ul ng-if=\"navbar.items\" class=\"nav navbar-nav navbar-left\">\n" +
    "                <li ng-repeat=\"link in navbar.items\" ng-class=\"{active:activeLink(link)}\" navbar-link></li>\n" +
    "            </ul>\n" +
    "            <ul ng-if=\"navbar.itemsRight\" class=\"nav navbar-nav navbar-right\">\n" +
    "                <li ng-repeat=\"link in navbar.itemsRight\" ng-class=\"{active:activeLink(link)}\" navbar-link>\n" +
    "                </li>\n" +
    "            </ul>\n" +
    "        </nav>\n" +
    "    </div>\n" +
    "</nav>\n" +
    "");
}]);

angular.module("nav/templates/navbar2.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("nav/templates/navbar2.tpl.html",
    "<nav class=\"navbar navbar-{{navbar.themeTop}}\"\n" +
    "ng-class=\"{'navbar-fixed-top':navbar.fixed, 'navbar-static-top':navbar.top}\"\n" +
    "role=\"navigation\" ng-model=\"navbar.collapse\" bs-collapse>\n" +
    "    <div class=\"navbar-header\">\n" +
    "        <button ng-if=\"navbar.toggle\" type=\"button\" class=\"navbar-toggle\" bs-collapse-toggle>\n" +
    "            <span class=\"sr-only\">Toggle navigation</span>\n" +
    "            <span class=\"icon-bar\"></span>\n" +
    "            <span class=\"icon-bar\"></span>\n" +
    "            <span class=\"icon-bar\"></span>\n" +
    "        </button>\n" +
    "        <a ng-if=\"navbar.brandImage\" href=\"{{navbar.url}}\" class=\"navbar-brand\" target=\"{{navbar.target}}\">\n" +
    "            <img ng-src=\"{{navbar.brandImage}}\" alt=\"{{navbar.brand || 'brand'}}\">\n" +
    "        </a>\n" +
    "        <a ng-if=\"!navbar.brandImage && navbar.brand\" href=\"{{navbar.url}}\" class=\"navbar-brand\" target=\"{{navbar.target}}\">\n" +
    "            {{navbar.brand}}\n" +
    "        </a>\n" +
    "    </div>\n" +
    "    <ul ng-if=\"navbar.items\" class=\"nav navbar-nav\">\n" +
    "        <li ng-repeat=\"link in navbar.items\" ng-class=\"{active:activeLink(link)}\" navbar-link></li>\n" +
    "    </ul>\n" +
    "    <ul ng-if=\"navbar.itemsRight\" class=\"nav navbar-nav navbar-right\">\n" +
    "        <li ng-repeat=\"link in navbar.itemsRight\" ng-class=\"{active:activeLink(link)}\" navbar-link></li>\n" +
    "    </ul>\n" +
    "    <div class=\"sidebar navbar-{{navbar.theme}}\" role=\"navigation\">\n" +
    "        <div class=\"sidebar-nav sidebar-collapse\" bs-collapse-target>\n" +
    "            <ul id=\"side-menu\" class=\"nav nav-side\">\n" +
    "                <li ng-if=\"navbar.search\" class=\"sidebar-search\">\n" +
    "                    <div class=\"input-group custom-search-form\">\n" +
    "                        <input class=\"form-control\" type=\"text\" placeholder=\"Search...\">\n" +
    "                        <span class=\"input-group-btn\">\n" +
    "                            <button class=\"btn btn-default\" type=\"button\" ng-click=\"search()\">\n" +
    "                                <i class=\"fa fa-search\"></i>\n" +
    "                            </button>\n" +
    "                        </span>\n" +
    "                    </div>\n" +
    "                </li>\n" +
    "                <li ng-repeat=\"link in navbar.items2\">\n" +
    "                    <a ng-if=\"!link.links\" href=\"{{link.href}}\">{{link.label || link.value || link.href}}</a>\n" +
    "                    <a ng-if=\"link.links\" href=\"{{link.href}}\" class=\"with-children\">{{link.label || link.value}}</a>\n" +
    "                    <a ng-if=\"link.links\" href=\"#\" class=\"pull-right toggle\" ng-click=\"togglePage($event)\">\n" +
    "                        <i class=\"fa\" ng-class=\"{'fa-chevron-left': !link.active, 'fa-chevron-down': link.active}\"></i></a>\n" +
    "                    <ul ng-if=\"link.links\" class=\"nav nav-second-level collapse\" ng-class=\"{in: link.active}\">\n" +
    "                        <li ng-repeat=\"link in link.links\">\n" +
    "                            <a ng-if=\"!link.vars\" href=\"{{link.href}}\" ng-click=\"loadPage($event)\">{{link.label || link.value}}</a>\n" +
    "                        </li>\n" +
    "                    </ul>\n" +
    "                </li>\n" +
    "            </ul>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</nav>");
}]);

angular.module("nav/templates/sidebar.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("nav/templates/sidebar.tpl.html",
    "<navbar class=\"sidebar-navbar\"></navbar>\n" +
    "<aside ng-repeat=\"sidebar in sidebars\" class=\"sidebar sidebar-{{ sidebar.position }}\"\n" +
    "ng-class=\"{'sidebar-fixed':sidebar.fixed}\" bs-collapse>\n" +
    "    <div class=\"nav-panel\">\n" +
    "        <div ng-if=\"sidebar.user\">\n" +
    "            <div ng-if=\"sidebar.user.avatar_url\" class=\"pull-{{ sidebar.position }} image\">\n" +
    "                <img ng-src=\"{{sidebar.user.avatar_url}}\" alt=\"User Image\" />\n" +
    "            </div>\n" +
    "            <div class=\"pull-left info\">\n" +
    "                <p>{{ sidebar.infoText }}</p>\n" +
    "                <a href=\"#\">{{sidebar.user.name}}</a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <ul class=\"sidebar-menu\">\n" +
    "        <li ng-if=\"section.name\" ng-repeat-start=\"section in sidebar.sections\" class=\"header\">\n" +
    "            {{section.name}}\n" +
    "        </li>\n" +
    "        <li ng-repeat-end ng-repeat=\"link in section.items\" class=\"treeview\"\n" +
    "        ng-class=\"{active:activeLink(link)}\" ng-include=\"'subnav'\"></li>\n" +
    "    </ul>\n" +
    "</aside>\n" +
    "<div class=\"sidebar-page\" ng-click=\"closeSideBar()\" full-page>\n" +
    "    <div class=\"content-wrapper\"></div>\n" +
    "    <div class=\"overlay\"></div>\n" +
    "</div>\n" +
    "\n" +
    "<script type=\"text/ng-template\" id=\"subnav\">\n" +
    "    <a ng-href=\"{{link.href}}\" ng-attr-title=\"{{link.title}}\" ng-click=\"menuCollapse($event)\">\n" +
    "        <i ng-if=\"link.icon\" class=\"{{link.icon}}\"></i>\n" +
    "        <span>{{link.name}}</span>\n" +
    "        <i ng-if=\"link.subitems\" class=\"fa fa-angle-left pull-right\"></i>\n" +
    "    </a>\n" +
    "    <ul class=\"treeview-menu\" ng-class=\"link.class\" ng-if=\"link.subitems\">\n" +
    "        <li ng-repeat=\"link in link.subitems\" ng-class=\"{active:activeLink(link)}\" ng-include=\"'subnav'\">\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "</script>");
}]);

angular.module('templates-page', ['page/breadcrumbs.tpl.html']);

angular.module("page/breadcrumbs.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("page/breadcrumbs.tpl.html",
    "<ol class=\"breadcrumb\">\n" +
    "    <li ng-repeat=\"step in steps\" ng-class=\"{active: step.last}\">\n" +
    "        <a ng-if=\"!step.last\" href=\"{{step.href}}\">{{step.label}}</a>\n" +
    "        <span ng-if=\"step.last\">{{step.label}}</span>\n" +
    "    </li>\n" +
    "</ol>");
}]);

angular.module('templates-users', ['users/login-help.tpl.html', 'users/messages.tpl.html']);

angular.module("users/login-help.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("users/login-help.tpl.html",
    "<p class=\"text-center\">Don't have an account? <a ng-href=\"{{REGISTER_URL}}\" target=\"_self\">Create one</a></p>\n" +
    "<p class=\"text-center\">{{bla}}<a ng-href=\"{{RESET_PASSWORD_URL}}\" target=\"_self\">Forgot your username or password?</a></p>");
}]);

angular.module("users/messages.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("users/messages.tpl.html",
    "<div ng-repeat=\"message in messages\" class=\"alert alert-dismissible\"\n" +
    "ng-class=\"messageClass[message.level]\">\n" +
    "<button type=\"button\" class=\"close\" data-dismiss=\"alert\" ng-click=\"dismiss($event, message)\">\n" +
    "    <span aria-hidden=\"true\">&times;</span>\n" +
    "    <span class=\"sr-only\">Close</span>\n" +
    "</button>\n" +
    "<span ng-bind-html=\"message.html\"></span>\n" +
    "</div>");
}]);


	return lux;
}));