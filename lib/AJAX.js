/**
 * AJAX Object responsible for receiving or posting to the Server.
 *
 * @type { object }
 */
const $AJAX = {

    /**
     * Initialize new XMLHttpRequest.
     *
     * @type { XMLHttpRequest }
     */
    xhr: new XMLHttpRequest(),

    /**
     * HTTP request method.
     *
     * @type { string|null }
     */
    method: null,

    /**
     * HTTP request headers.
     *
     * @type { object }
     */
    headers: {},

    /**
     * Request URL.
     *
     * @type { string }
     */
    url: null,

    /**
     * URL parameters.
     *
     * @type { object }
     */
    params: {},

    /**
     * URL Query String parameters.
     *
     * @type { object }
     */
    query: {},

    /**
     * Request data.
     *
     * @type { object } Request data.
     */
    data: {},

    /**
     * Initializes a newly-created request, or re-initializes an existing one.
     *
     * @param { string } method The HTTP request method to use.
     * @param { object } config Object containing method config.
     */
    request(method, config) {
        this.validateConfig(config);

        this.method = method;

        this.url = config.url ?? this.url;

        this.params = config.params ?? this.params;

        this.query = config.query ?? this.query;

        this.xhr.open(this.method, this.setUrl() + this.setQueryString());

        this.xhr.withCredentials = config.withCredentials ?? this.xhr.withCredentials;

        this.setDefaultHeaders(this.headers);

        this.setCustomHeaders(config.headers);

        this.setRequestData(config.data);

        // If Data is passed is NOT a FormData object, set 'Content-type' header.
        if (this.data && !(this.data instanceof FormData)) {
            this.setHeaders({'Content-Type': 'application/x-www-form-urlencoded'});
        }


        this.xhr.send(this.data);

        this.onStateChangedEvent(config.states);
    },

    /**
     * Load data from the server using an HTTP GET request.
     *
     * @param { { url?: string, params?: object, query?: object, headers?: object, withCredentials?: boolean, data?: object, states?: object } } config Request config.
     *
     * @returns { XMLHttpRequest }
     */
    get(config) {
        this.request('GET', config);

        return this.xhr;
    },

    /**
     * Send data to the server using an HTTP POST request.
     *
     * @param { { url: string, params?: object, query?: object, headers?: object, withCredentials?: boolean, data?: object, states?: object } } config Request config.
     *
     * @returns { XMLHttpRequest }
     */
    post(config) {
        this.request('POST', config);

        return this.xhr;
    },

    /**
     * Send data to the server using an HTTP PATCH request.
     *
     * @param { { url: string, params?: object, query?: object, headers?: object, withCredentials?: boolean, data?: object, states?: object } } config Request config.
     *
     * @returns { XMLHttpRequest }
     */
    patch(config) {
        this.request('PATCH', config);

        return this.xhr;
    },

    /**
     * Send data to the server using an HTTP PUT request.
     *
     * @param { { url: string, params?: object, query?: object, headers?: object, withCredentials?: boolean, data?: object, states?: object } } config Request config.
     *
     * @returns { XMLHttpRequest }
     */
    put(config) {
        this.request('PUT', config);

        return this.xhr;
    },

    /**
     * Delete a resource from the server using an HTTP DELETE request.
     *
     * @param { { url: string, params?: object, query?: object, headers?: object, withCredentials?: boolean, data?: object, states?: object } } config Request config.
     *
     * @returns { XMLHttpRequest }
     */
    delete(config) {
        this.request('DELETE', config);

        return this.xhr;
    },

    /**
     * Fires an Event when the readyState attribute of a document has changed.
     *
     * @param { function } state Event to be fired.
     */
    onStateChangedEvent(state) {
        if (state === undefined) {
            return;
        }

        // A function to be called prior to request being sent.
        if (state && state.before) {
            state.before()
        }

        // Indicates whether the AJAX request was processed.
        let requestProcessed = false;

        this.xhr.onreadystatechange = function () {

            // AJAX request was processed once the operation is complete.
            if (this.readyState === 4) {
                requestProcessed = true;
            }

            // A function to be called prior to request initialization.
            if (state && state.unsent && this.readyState === 0) {
                state.unsent(this);
            }

            // A function to be called when a newly-created request initializes.
            if (state && state.opened && this.readyState === 1) {
                state.opened(this);
            }

            // A function to be called when headers and status are available.
            if (state && state.received && this.readyState === 2) {
                state.received(this);
            }

            // A function to be called when the request succeeds.
            if (state && state.loading && this.readyState === 3) {
                state.loading(this, AJAX.isJson(this.response) ? JSON.parse(this.response) : this.response);
            }

            // A function to be called when the request finishes.
            if (state && state.done && this.readyState === 4) {
                state.done(this, AJAX.isJson(this.response) ? JSON.parse(this.response) : this.response);
            }

            // A function to be called when the request fails.
            if (state && state.error && this.readyState === 4 && this.status !== 200) {
                state.error(this, AJAX.isJson(this.response) ? JSON.parse(this.response) : this.response);
            }

            // A function to be called after the response has been sent from the Server.
            if (state && state.after && requestProcessed) {
                state.after()
            }
        };
    },

    /**
     * Sets URL and its parameters, if any.
     *
     * @returns { string }
     */
    setUrl() {
        const pattern = /[^{}]+(?=})/g;
        const urlParams = this.url.match(pattern)

        if (this.params === undefined || !urlParams) {
            return this.url;
        }

        urlParams.forEach(param => this.url = this.url.replace(`{${param}}`, this.params[param]))

        return this.url
    },

    /**
     * Sets a URL Query String.
     *
     * @returns { string } Serialized query string.
     */
    setQueryString() {
        let queryString = [];

        for (let param in this.query) {
            switch (this.query[param].constructor.name) {
                case 'Array':
                    this.query[param].forEach((item, index) => queryString.push(param + '[]=' + this.query[param][index]))
                    continue;
                case 'Object':
                    for (let key in this.query[param]) {
                        queryString.push(param + '[' + key + ']=' + this.query[param][key])
                    }
                    continue;
                default:
                    queryString.push(param + '=' + this.query[param])
            }
        }

        return queryString.length
            ? '?' + queryString.join('&')
            : '';
    },

    /**
     * Sets the value of a Default HTTP request headers.
     *
     * @param { object } headers HTTP request headers.
     */
    setDefaultHeaders(headers) {
        if (headers === undefined) {
            return;
        }

        this.setHeaders(headers);
    },

    /**
     * Sets the value of a Custom HTTP request headers.
     *
     * @param { object } headers HTTP request headers.
     */
    setCustomHeaders(headers) {
        if (headers === undefined) {
            return;
        }

        this.setHeaders(headers);
    },

    /**
     * Sets request data.
     *
     * @param { object } data Data to serialize.
     *
     * @returns { FormData|URLSearchParams } Serialized data.
     */
    setRequestData(data) {
        switch (this.method) {
            case 'PUT':
            case 'PATCH':
            case 'DELETE': {
                this.data = new URLSearchParams();

                for (let key in data) {
                    this.data.set(key, data[key]);
                }

                break;
            }
            default:
                this.data = new FormData();

                for (let key in data) {
                    this.data.set(key, data[key]);
                }
        }

        return this.data
    },

    /**
     * Checks whether all configs are valid.
     *
     * @param { object } config Settings to validate.
     */
    validateConfig(config) {
        // Validate request URL.
        this.validateURL(config.url ?? this.url);

        // Validate request credentials.
        this.validateCredentials(config.withCredentials ?? this.xhr.withCredentials);

        // Validate request headers.
        this.validateHeaders(config.headers ?? this.headers);

        // Validate request URL parameters.
        this.validateUrlParams(config.params ?? this.params);

        // Validate request URL query parameters.
        this.validateQueryParams(config.query ?? this.query);

        // Validate request data.
        this.validateData(config.data ?? this.data);
    },

    /**
     * Checks whether the URL is valid.
     *
     * @param { string } url URL to validate.
     *
     * @throws { Error }
     *
     * @return { void }
     */
    validateURL(url) {
        if (url === undefined) {
            throw new Error('URL is not defined!');
        }

        if (url.constructor.name !== 'String') {
            throw new Error('URL must be of type String!');
        }
    },

    /**
     * Checks whether the withCredentials is valid.
     *
     * @param { boolean } credentials Property to validate.
     *
     * @throws { Error }
     *
     * @return { void }
     */
    validateCredentials(credentials) {
        if (!credentials) {
            return;
        }

        if (credentials.constructor.name !== 'Boolean') {
            throw new Error('Credentials must be of type Boolean!');
        }
    },

    /**
     * Checks whether all headers are valid.
     *
     * @param { object } headers Headers to validate.
     *
     * @throws { Error }
     *
     * @return { void }
     */
    validateHeaders(headers) {
        if (!headers) {
            return;
        }

        if (headers.constructor.name !== 'Object') {
            throw new Error('Headers must be of type Object!');
        }
    },

    /**
     * Checks whether the URL Params are valid.
     *
     * @param { object } params URL Params to validate.
     *
     * @throws { Error }
     *
     * @return { void }
     */
    validateUrlParams(params) {
        if (!params) {
            return;
        }

        if (params.constructor.name !== 'Object') {
            throw new Error('Param must be of type Object!');
        }
    },

    /**
     * Checks whether the URL Query Params are valid.
     *
     * @param { object } query URL Query Params to validate.
     *
     * @throws { Error }
     *
     * @return { void }
     */
    validateQueryParams(query) {
        if (!query) {
            return;
        }

        if (query.constructor.name !== 'Object') {
            throw new Error('Query must be of type Object!');
        }
    },

    /**
     * Checks whether all data is valid.
     *
     * @param { object } data Data to validate.
     *
     * @throws { Error }
     *
     * @return { void }
     */
    validateData(data) {
        if (!data) {
            return;
        }

        // Throw an error in case the Data is not an Object or a String.
        if (data.constructor.name !== 'Object') {
            throw new Error('Data must be of type Object!');
        }
    },

    /**
     * Sets the value of an HTTP request headers.
     *
     * @param { array|object } headers HTTP request headers.
     *
     * @return { void }
     */
    setHeaders(headers) {
        if (headers.constructor.name === 'Array') {
            headers.forEach(header => {
                for (let key in header) {
                    this.xhr.setRequestHeader(key, header[key]);
                }
            })
        }

        if (headers.constructor.name === 'Object') {
            for (let key in headers) {
                this.xhr.setRequestHeader(key, headers[key]);
            }
        }
    },

    /**
     * Set request defaults.
     *
     * @param { { url?: string, params?: object, query?: object, headers?: object, withCredentials?: boolean } } config Request defaults.
     *
     * @return { void }
     */
    defaults(config) {
        if (config.url) {
            this.validateURL(config.url)

            this.url = config.url;
        }

        if (config.params) {
            this.validateUrlParams(config.params)

            this.params = config.params;
        }

        if (config.query) {
            this.validateQueryParams(config.query)

            this.query = config.query;
        }

        if (config.headers) {
            this.validateHeaders(config.headers)

            for (let header in config.headers) {
                this.headers[header] = config.headers[header]
            }
        }

        if (config.withCredentials) {
            this.validateCredentials(config.withCredentials)

            this.xhr.withCredentials = config.withCredentials;
        }
    },

    /**
     * Determine weather the Serve response is JSON.
     *
     * @param response { string } Server response.
     *
     * @returns { boolean }
     */
    isJson(response) {
        try {
            JSON.parse(response);
        } catch (e) {
            return false;
        }
        return true;
    },
};

if (typeof exports != 'undefined') {
    module.exports = AJAX = $AJAX
} else {
    window.AJAX = $AJAX;
}
