/**
 * AJAX Object responsible for receiving or posting to the Server.
 */
module.exports = AJAX = {
    // Initialize new XMLHttpRequest.
    xhr: new XMLHttpRequest(),

    // HTTP request method.
    method: '',

    // Object containing Header name-value pairs to be set to every HTTP request.
    headers: [],

    // Array containing Query String parameters.
    query: [],

    // Request data.
    data: [],

    /**
     * Initializes a newly-created request, or re-initializes an existing one.
     *
     * @param { String } method The HTTP request method to use.
     * @param { Object } config Object containing method config.
     */
    request(method, config) {
        // Validate request config.
        this.validateConfig(config);

        // Set HTTP request method.
        this.method = method;

        // Set XHR credentials property.
        this.xhr.withCredentials = config.withCredentials ?? this.xhr.withCredentials;

        // The HTTP request method to use.
        this.xhr.open(this.method, (config.url ?? this.url) + this.setQueryString(config.query));

        // Set Default HTTP request headers.
        this.setDefaultHeaders(this.headers);

        // Set Custom HTTP request headers, if any.
        this.setCustomHeaders(config.headers);

        // Set HTTP request data.
        this.setRequestData(config.data);

        // If Data is passed is NOT a FormData object, set 'Content-type' header.
        if (this.data && this.data.constructor.name !== 'FormData') {
            this.setHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
        }

        // Send the request to the server.
        this.xhr.send(this.data);

        // Execute callback functions depending on the State the request is in.
        this.onStateChangedEvent(config.states);
    },

    /**
     * Load data from the server using an HTTP GET request.
     *
     * @returns { XMLHttpRequest }
     *
     * @param { Object } config Request config.
     */
    get(config) {
        this.request('GET', config);

        return this.xhr;
    },

    /**
     * Send data to the server using an HTTP POST request.
     *
     * @param { Object } config Request config.
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
     * @param { Object } config Request config.
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
     * @param { Object } config Request config.
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
     * @param { Object } config Request config.
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
     * @param { Function } state Event to be fired.
     */
    onStateChangedEvent(state) {
        // A function to be called prior to request being sent.
        if (state && state.before) {
            state.before()
        }

        // Indicates whether the AJAX request was processed.
        let requestProcessed = false;

        this.xhr.onreadystatechange = function () {
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
            if (state && state.done && this.readyState === 4 && this.status === 200) {
                state.done(this, AJAX.isJson(this.response) ? JSON.parse(this.response) : this.response);

                requestProcessed = true;
            }

            // A function to be called when the request fails.
            if (state && state.error && this.readyState === 4 && this.status !== 200) {
                state.error(this, AJAX.isJson(this.response) ? JSON.parse(this.response) : this.response);

                requestProcessed = true;
            }

            // A function to be called after the response has been sent from the Server.
            if (state && state.after && requestProcessed) {
                state.after()
            }
        };
    },

    /**
     * Sets a URL Query String.
     *
     * @param { Object } query HTTP request query parameters.
     *
     * @returns { String } Serialized query string.
     */
    setQueryString(query) {
        for (let param in query) {
            switch (query[param].constructor.name) {
                case 'Array':
                    query[param].forEach((item, index) => this.query.push(param + '[]=' + query[param][index]))
                    continue;
                case 'Object':
                    for (let key in query[param]) {
                        this.query.push(param + '[' + key + ']=' + query[param][key])
                    }
                    continue;
                default:
                    this.query.push(param + '=' + query[param])
            }
        }

        return query
               ? '?' + this.query.join('&')
               : '';
    },

    /**
     * Sets the value of a Default HTTP request headers.
     *
     * @param { Object } headers HTTP request headers.
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
     * @param { Object } headers HTTP request headers.
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
     * @param { Object } data Data to serialize.
     *
     * @returns { FormData|String } Serialized data.
     */
    setRequestData(data) {
        switch (this.method) {
            case 'PUT':
            case 'PATCH':
            case 'DELETE': {
                this.data = [];

                for (let key in data) {
                    this.data.push(key + '=' + data[key]);
                }

                this.data = this.data.join('&');

                break;
            }
            default:
                this.data = new FormData();

                for (let key in data) {
                    this.data.append(key, data[key]);
                }
        }

        return this.data
    },

    /**
     * Checks whether all configs are valid.
     *
     * @param { Object } config Settings to validate.
     */
    validateConfig(config) {
        // Validate request headers.
        this.validateURL(config.url ?? this.url);

        // Validate request credentials.
        this.validateCredentials(config.withCredentials ?? this.xhr.withCredentials);

        // Validate request headers.
        this.validateHeaders(config.headers);

        // Validate request query parameters.
        this.validateQueryParams(config.query);

        // Validate request data.
        this.validateData(config.data);
    },

    /**
     * Checks whether the URL is valid.
     *
     * @param { String } url URL to validate.
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
     * @param { String } credentials Property to validate.
     */
    validateCredentials(credentials) {
        if (! credentials) {
            return;
        }

        if (credentials.constructor.name !== 'Boolean') {
            throw new Error('Credentials must be of type Boolean!');
        }
    },

    /**
     * Checks whether all headers are valid.
     *
     * @param { Object } headers Headers to validate.
     */
    validateHeaders(headers) {
        if (! headers) {
            return;
        }

        if (headers.constructor.name !== 'Object') {
            throw new Error('Headers must be of type Object!');
        }
    },

    /**
     * Checks whether the URL Query Params are valid.
     *
     * @param { Object } query URL Query Params to validate.
     */
    validateQueryParams(query) {
        if (! query) {
            return;
        }

        if (query.constructor.name !== 'Object') {
            throw new Error('Query must be of type Object!');
        }
    },

    /**
     * Checks whether all data is valid.
     *
     * @param { Object } data Data to validate.
     */
    validateData(data) {
        if (! data) {
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
     * @param { Array|Object } headers HTTP request headers.
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
     * @param { Object } config Request defaults.
     */
    defaults(config) {
        if (config.url) {
            this.validateURL(config.url)

            this.url = config.url;
        }

        if (config.withCredentials) {
            this.validateCredentials(config.withCredentials)

            this.xhr.withCredentials = config.withCredentials;
        }

        if (config.headers) {
            this.validateHeaders(config.withCredentials)

            for (let header in config.headers) {
                this.headers.push({ [header]: config.headers[header] })
            }
        }
    },

    /**
     * Determine weather the Serve response is JSON.
     *
     * @param response { String } Server response.
     *
     * @returns { Boolean }
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
