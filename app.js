/*jslint indent: 2, nomen: true, maxlen: 100, white: true, plusplus: true, unparam: true */
/*global require, applicationContext*/

////////////////////////////////////////////////////////////////////////////////
/// @brief A Demo Foxx-Application written for ArangoDB
///
/// @file
///
/// DISCLAIMER
///
/// Copyright 2014 ArangoDB GmbH, Cologne, Germany
/// Copyright 2004-2014 triAGENS GmbH, Cologne, Germany
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///
/// Copyright holder is ArangoDB GmbH, Cologne, Germany
///
/// @author Frank Celler
/// @author Copyright 2014, ArangoDB GmbH, Cologne, Germany
/// @author Copyright 2011-2013, triAGENS GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

(function () {
  'use strict';

  /*
    todo: example using underscore templates
    todo: example on how to properly create CRUD using a repository
    todo: example on format middleware
    todo: POST form example
  */

  var Controller = require("org/arangodb/foxx").Controller,
      Repository = require("org/arangodb/foxx").Repository,
      console = require("console"),
      arangodb = require("org/arangodb"),
      db = arangodb.db,
      actions = require("org/arangodb/actions"),
      inspect = require("org/arangodb").inspect,
      helloworld = require("./lib/a").text,
      controller = new Controller(applicationContext),
      texts = new Repository(applicationContext.collection("texts"));

	//
	// My globals.
	//
	var HTML_header = "<!DOCTYPE html>"
					+ "<html lang=\"en\">"
					+ "<head>"
					+ "<meta charset=\"utf-8\" />"
					+ "<title>Test page</title>"
					+ "<meta name=\"generator\" content=\"BBEdit 11.1\" />"
					+ "</head>"
					+ "<body>";
	var HTML_footer = "</body>"
					+ "</html>";
	var TABLE_header = "<table><tr><th>Parameter</th><th>Value</th></tr>";
	var TABLE_footer = "</table>";


  // this part is here to generate the examples, DO NOT USE in your code!
  var code = {};
  var oldController = controller;

  controller = {
    get: function(a, b) {
      code[a] = String(b);
      return oldController.get(a, b);
    },

    around: function(a, b) {
      code[a] = String(b);
      return oldController.around(a, b);
    }
  };

  // .............................................................................
  // Example: Route without parameters & simple text output with static text
  // .............................................................................

  controller.get('/hello', function (req, res) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.body = "Hello World!\n";
  });

  // .............................................................................
  // Example: Route with parameter & simple text output
  // .............................................................................

  controller.get("/hello_name/:name", function (req, res) {
    res.set("Content-Type", "text/plain");
    res.body = "Hello " + req.params("name");
  });

  // .............................................................................
  // Example: Accessing the query component, return text
  // .............................................................................

  controller.get("/sum", function (req, res) {
    var sum = parseInt(req.params("a"), 10) + parseInt(req.params("b"), 10);
    res.body = "Result is " + sum.toString();
  });

  // .............................................................................
  // Example: getting the application context
  // .............................................................................

  controller.get('/appcontext', function (req, res) {
    res.set("Content-Type", "text/plain");
    res.body = inspect(applicationContext) + " \n";
  });

  // .............................................................................
  // Example: get an entry from the texts-collection in ArangoDB. The collection is
  // set up and populated in scripts/setup.js
  // .............................................................................

  controller.get('/get_from_db', function (req, res) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.body = texts.collection.any().text + "\n";
  });

  // .............................................................................
  // Example: run AQL query from FOXX
  // .............................................................................

  controller.get('/run_aql', function (req, res) {
    res.set("Content-Type", "text/plain; charset=utf-8");

    var stmt = db._createStatement({ "query": "FOR i IN [ 1, 2 ] RETURN i * 2" }),
    c = stmt.execute();

    res.body = c.toArray().toString();
  });

  // .............................................................................
  // Example: Init FoxxModel & use method
  // .............................................................................

  controller.get('/createtiger/:name', function (req, res) {
    var Tiger = require("./models/tiger").Model,

    myTiger = new Tiger({
      name: req.params("name")
    });

    res.set("Content-Type", "text/plain; charset=utf-8");
    res.body = myTiger.growl();
  });

  // .............................................................................
  // Example: Save FoxxModel in DB
  // .............................................................................

  controller.get('/savetiger/:name', function (req, res) {
    var Tiger = require("./models/tiger").Model,
    myTiger = new Tiger({
      name: req.params("name")
    });

    if (myTiger.get('size') === null) {
      myTiger.set('size', Math.floor((Math.random() * 190) + 100));
    }

    texts.collection.save(myTiger.forDB());

    res.set("Content-Type", "text/plain; charset=utf-8");
    res.body = "Converted myTiger with myTiger.forDB() and saved it in texts collection";
  });

  // .............................................................................
  // Example: write to ArangoDB log
  // .............................................................................

  controller.get('/log', function (req, res) {
    try {
      throw new RangeError("[hello-foxx] Division by zero!");
    }
    catch (e) {
      console.warn(e.message);
    }

    res.set("Content-Type", "text/plain; charset=utf-8");
    res.body = "division by zero error was triggered and an "
             + "exception message was logged in arangodb log";
  });

  // .............................................................................
  // Example: Return http status 303 and an error object
  // .............................................................................

  controller.get('/error',function (req, res) {
    throw new RangeError("[hello-foxx] Division by zero!");
  }).errorResponse(RangeError, 303, "This went completely wrong. Sorry!",
                   function (e) {
                     return {
                       code: 123,
                       msg: e.message
                     };
                   });

  // .............................................................................
  // Example: deliver static html file
  // app.js is not involved for this example
  // in this demo app all files in the files folder can be accessed static
  // this is configured in manifest.js in the "files" section
  // .............................................................................

  // .............................................................................
  // Example: Using the assets option
  // app.js is not involved for this example
  // manifest.js contains a definition for "layout.css"
  // assets/css/base.css and assets/css/custom.css are combined and accessible
  // under the name "layout.css"
  // the same works for Javascript, too, you can also use wildcards, see
  // the manual for more information on this
  // .............................................................................

  // .............................................................................
  // Example: convert the response object to text
  // .............................................................................

  controller.get('/response_to_text', function (req, res, options, next) {
    var result = { request: req, options: options };
    res.responseCode = actions.HTTP_OK;
    res.contentType = "text/plain; charset=utf-8";
    res.body = arangodb.inspect(result);
  });

  // .............................................................................
  // Example: convert parameters to text
  // .............................................................................

	controller.get
	(
		'/params_to_text',
		function (req, res, options, next)
		{
			//
			// Init local storage.
			//
			var result = HTML_header;
			
			//
			// Handle parameters.
			//
			if( Object.keys(req.parameters).length != 0 )
			{
				var parameters = req.parameters;
				
				result += TABLE_header;
				for(var property in parameters)
				{
					result += "<tr>";
					result += "<td>";
					result += property;
					result += "</td>";
					result += "<td>";
					result += parameters[ property ];
					result += "</td>";
					result += "</tr>";
				}
				result += TABLE_footer;
				
			} // Has parameters.
			
			//
			// Handle no parameters.
			//
			else
			{
				result += "<i>No parameters...</i>";
			
			} // No parameters.
			
			//
			// Close HTML.
			//
			result += HTML_footer;

			//
			// Set response headers.
			//
			res.responseCode = actions.HTTP_OK;
			res.contentType = "text/html; charset=utf-8";

			//
			// Set response body.
			//
			res.body = result;
		}
	);

  // .............................................................................
  // Example: Accessing global variables
  // .............................................................................

  controller.get('/global_var', function (req, res) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.body = helloworld + " and accessed through a global variable\n";
  });

  // .............................................................................
  // Example: local require
  // .............................................................................

  controller.get('/local_require', function (req, res) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.body = require("./lib/a").text + " and accessed with a local require\n";
    res.statusCode = actions.HTTP_OK;
  });

  // .............................................................................
  // Example: echo the response object
  // .............................................................................

  controller.get('/echo_response', function (req, res, options, next) {
    var result = { request: req, options: options };

    res.responseCode = actions.HTTP_OK;
    res.contentType = "application/json; charset=utf-8";
    res.body = JSON.stringify(result);
  });

  // .............................................................................
  // Example: special conversion to different format
  // .............................................................................

  controller.get('/format/a', function (req, res) {
      var result = { a: 1, b: 2, c: "Hallo World" };

    res.responseCode = actions.HTTP_OK;
    res.body = result;
  });

  controller.around('/format/json/:func', function (req, res, options, next) {
    var s = req.url.split('/');

    s.pop();
    s.pop();
    s.push(req.params("func"));

    req.suffix = s.join('/');

    next(true);

    res.set("Content-Type", "application/json; charset=utf-8");
    res.body = JSON.stringify(res.body);
  });

  // .............................................................................
  // Example: return application context as text
  // .............................................................................

  controller.get('/appcontext_as_txt', function (req, res) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.body = arangodb.inspect(applicationContext) + " \n";
  });

  // .............................................................................
  // Helper function to retrieve the source code of the defined routes
  // .............................................................................

  controller.get('/source', function (req, res) {
    var normalize = function (url) {
      return url.replace(/^\/?([a-zA-Z0-9_]+).*$/, '$1');
    };

    var result = {};
    var key;

    for (key in code) {
      if (code.hasOwnProperty(key)) {
        result[normalize(key)] = code[key];
      }
    }

    res.json(result);
  });
}());

// -----------------------------------------------------------------------------
// --SECTION--                                                       END-OF-FILE
// -----------------------------------------------------------------------------

// Local Variables:
// mode: outline-minor
// outline-regexp: "/// @brief\\|/// {@inheritDoc}\\|/// @page\\|// --SECTION--\\|/// @\\}"
// End:
