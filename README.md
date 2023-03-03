# AJAX

JavaScript AJAX request helper.

## Installation & setup

You can install the package via npm:

    npm install @bjnstnkvc/ajax

## Usage

Once the package has been installed, you can import it
using [import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) declaration:

```js
import AJAX from '@bjnstnkvc/ajax'
```

## Methods

Once imported, you can make an AJAX request using the following methods:

#### Get

Load data from the server using an HTTP GET request:

```js
AJAX.get({ config })
```

#### Post

Send data to the server using an HTTP POST request:

```js
AJAX.post({ config })
```

#### Patch

Send data to the server using an HTTP PATCH request:

```js
AJAX.patch({ config })
```

#### Put

Send data to the server using an HTTP PUT request:

```js
AJAX.put({ config })
```

#### Delete

Delete a resource from the server using an HTTP DELETE request:

```js
AJAX.delete({ config })
```

## Config

In order to send an AJAX request using the methods listed above, you need to pass `config` object. The Config object consists of the following properties:

#### url
A string representing the URL to send the request to:

```js
AJAX.get({
    url: 'posts',
})
````

#### query
An object used to parse and stringify URL query strings:

```js
AJAX.get({
    url: 'posts',
    query: {
        page: 2
    }
})
````

Example above would generate the following URL:

```
https://www.example.com/posts?page=2
```

Sometimes you need to pass a query string as an array, in order to do so, use the following syntax:

```js
AJAX.get({
    url: 'posts',
    query: {
        tag: ['html', 'css'],
        page: 2,
    },
})
````

Example above would generate the following URL:

```
https://www.example.com/posts?tag[]=html&tag[]=css&page=2
```

#### withCredentials

A boolean value that indicates whether cross-site Access-Control requests should be made using credentials.

```js
AJAX.get({
    url: 'posts',
    withCredentials: true,
})
````
#### headers

In case you would like to add headers to AJAX request, you can pass them via `headers` property: 

```js
AJAX.get({
    url: 'posts',
    headers: {
        'Accept': 'application/json',
    }
})
````

#### data

An object containing body of data to be sent in the XHR request.

```js
AJAX.post({
    url: 'posts',
    data: {
        title: 'A Post title',
        description: 'A Post description',
    }
})
````

#### States

Each AJAX request goes through 5 different [states](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/readyState):

| Value | State            | Description                                                   |
|-------|------------------|---------------------------------------------------------------|
| 0     | UNSENT           | Client has been created. open() not called yet.               |
| 1     | OPENED           | open() has been called.                                       |
| 2     | HEADERS_RECEIVED | send() has been called, and headers and status are available. |
| 3     | LOADING          | Downloading; responseText holds partial data.                 |
| 4     | DONE             | The operation is complete.                                    |

Additionally, 3 custom states have been added for more convenience when making AJAX requests:

| State  | Description                                               |
|--------|-----------------------------------------------------------|
| BEFORE | A state prior to request being sent.                      |
| AFTER  | A state after the response has been sent from the server. |
| ERROR  | A state when the request fails.                           |

In order to access each state, you can add `states` property to AJAX config via following syntax:

```js
AJAX.get({
    url   : 'posts',
    states: {
        before() {
            // 
        },
        unsent(xhr) {
            // 
        },
        opened(xhr) {
            // 
        },
        received(xhr) {
            // 
        },
        loading(xhr, response) {
            // 
        },
        done(xhr, response) {
            // 
        },
        error(xhr, response) {
            // 
        },
        after() {
            //
        }
    }
})
```

> **Note:** `loading`, `done` and `error` states return [xhr object](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) as well as already parsed [xhr response](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/response) to JSON.  

## Defaults

AJAX helper gives you an option to set [config](#config) defaults using the following syntax:

```js
AJAX.defaults({
    url: 'posts',
    withCredentials: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept'          : 'application/json',
    }
});

AJAX.post({
    ...
})
```

By doing so, every subsequent AJAX instance would use the config set above.

In case you need to overwrite previously set default config value, you simply need to overwrite them:

```js
AJAX.patch({
    url: 'posts/2',
    withCredentials: false,
    ...
});
```
