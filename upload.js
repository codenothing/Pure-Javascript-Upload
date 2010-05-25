/*
 * Pure Upload [VERSION]
 * An adaptation of valums ajaxupload(http://valums.com/ajax-upload/)
 * [DATE]
 * Corey Hart @ http://www.codenothing.com
 */
(function( window, document, undefined ) {


// Defaults (gets converted to Upload.defaults later on)
var Defaults = {
	action: '',
	prefix: 'file-'
};


// Quick element creation
var Add = (function(){
	var div = document.createElement('div'), el;
	return function( html ) {
		if ( ! document.body ) {
			Upload.error( "Document isn't ready yet" );
		}
		div.innerHTML = html;
		el = div.removeChild( div.firstChild );
		document.body.appendChild( el );
		return el;
	};
})();


// Unique ID Creation
var Guid = (function(){
	var id = ( new Date() ).getTime();
	return function(){
		return 'PureUpload-' + (++id);
	};
})();


// Looping Utility
function each( items, scope, fn ) {
	var i = -1, l = items.length;

	if ( typeof scope == 'function' ) {
		fn = scope;
		scope = undefined;
	}

	if ( l !== undefined ) {
		for ( ; ++i < l; ) {
			fn.call( scope || items[ i ], i, items[ i ] );
		}
	}
	else {
		for ( i in items ) {
			if ( items.hasOwnProperty( i ) ) {
				fn.call( scope || items[ i ], i, items[ i ] );
			}
		}
	}
}


// JSON Converter
function toJSON( str ) {
	str = str || '';
	return window.JSON && window.JSON.parse ? window.JSON.parse( str ) : eval( '(' + str + ')' );
}


// Upload Handler
function Upload( files, data, action, settings ) {
	var self = this;

	// We allow single file uploads, so we must force array object when needed
	if ( files && ! files.length ) {
		files = [ files ];
	}

	// Organize parameters (only action isn't required, but data and settings are)
	if ( settings === undefined && typeof action == 'object' ) {
		settings = action;
		action = undefined;
	}

	// Store arguments on Upload object for reuse
	self.files = files;
	self.data = data || {};
	self.action = action || Defaults.action;
	self.settings = settings || {};

	// Run quick error check
	if ( ! self.files || ! self.files.length ) {
		( self.settings.error || Upload.error )( 'No files could be found' );
	}
	else if ( typeof self.action != 'string' || ! self.action.length ) {
		( self.settings.error || Upload.error )( 'Invalid action' );
	}
	else {
		// Start building process
		self.build();
	}
}


// Browsers that support native file upload reap the benefits
var NativeUpload = {
	abort: function(){
		this.aborting = true;
		each( this.read, function( i, read ) {
			if ( read.complete === false ) {
				read.abort();
			}
		});
	},

	readFile: function( i, file ) {
		// Reader Object
		var self = this, reader = new FileReader(), guid = Guid(), 
			// Create a reference
			read = self.read[ guid ] = {
				file: file,
				name: file.fileName,
				reader: reader,
				abort: reader.abort,
				guid: guid,
				complete: false,
				content: ''
			};

		// Reader works asynchronously
		reader.onload = function( event ) {
			read.complete = true;
			read.content = event.target.result;
			
			if ( --self.length < 1 ) {
				self.request();
			}
		};

		// Treat errors like aborts, and cancel whole operation
		reader.onerror = reader.onabort = function( event ) {
			// We don't want to run into recursive errors
			read.complete = true;

			// Kill all operations (but make sure we aren't already doing that)
			if ( self.aborting === false ) {
				self.abort();
			}
			// If we are in the process of aborting, don't trigger the error handler multiple time
			else {
				return;
			}

			// Inform Developer
			if ( self.settings.error ) {
				self.settings.error( 'Unable to read ' + file.fileName );
			}
		};


		// Start reading the file
		reader.readAsBinaryString( file );
	},

	source: function(){
		var self = this, boundary = self.boundary = '----------------------------------------' + Guid(), source = '';

		// Add each file
		each( self.read, function( i, read ) {
			var file = read.file;
			source += "--" + self.boundary  + "\r\n";
			source += "Content-Disposition: form-data; name='" + Defaults.prefix + i + "'; filename='" + file.fileName + "'\r\n";
			source += "Content-Type: " + file.type + "\r\n\r\n";
			source += read.content + "\r\n";
		});

		// Add any post-data provided
		each( self.data, function( name, value ) {
			source += "--" + self.boundary + "\r\n";
			source += "Content-Disposition: form-data; name=" + name + "\r\n\r\n";	
			source += value + "\r\n";
		});

		// The final boundary has 2 extra dashes before the line break
		source += "--" + self.boundary + "--\r\n";

		return source;
	},

	request: function(){
		var self = this, source = self.source(), xhr = self.xhr = new XMLHttpRequest();
		xhr.open( 'POST', self.action, true );
		xhr.setRequestHeader( 'Content-Type', 'multipart/form-data; boundary=' + self.boundary );
		xhr.setRequestHeader( 'Content-Length', source.length );

		// Response
		xhr.onreadystatechange = function(){
			if ( xhr.readyState == 4 ) {
				self.response = xhr.responseText;

				// Anything in the 200's is a successful request, and 304 is a cached successful request
				if ( ( xhr.status >= 200 && xhr.status < 301 ) || xhr.status === 304 ) {
					if ( self.settings.success ) {
						self.settings.success(
							self.settings.JSON ? toJSON( self.response ) : self.response
						);
					}
				}
				else if ( self.settings.error ) {
					self.settings.error( self.response );
				}
			}
		};

		// File reading is finished, transfer the xhr abort method
		// to upload abort method
		self.abort = xhr.abort;

		// Start the request
		xhr.sendAsBinary( source );
	},

	build: function(){
		var self = this, stack = [];

		// Define Object Vars
		self.read = {};
		self.xhr = undefined;
		self.aborting = false;

		// Create a new stack 
		each( self.files, function( i, file ) {
			if ( file.files && file.files[ 0 ] ) {
				each( file.files, function( i, entry ) {
					stack.push( entry );
				});
			}
			else if ( file.fileName ) {
				stack.push( file );
			}
		});

		// Track stack length for source request
		self.length = stack.length;

		// Read each file
		each( stack, self, self.readFile );
	}
};


// Older browsers have to rely on form to iframe submission
var FrameUpload = {
	abort: function(){
		self.blank = true;
		// Cancel the current frame load by loading the blank source
		if ( self.frame ) {
			self.frame.src = "javascript:'<html></html>';";
		}
	},

	// Webkit wont let you copy over the file input value, so we need
	// to pull each file out and replace with a copy of the node. This
	// reduces damage to the ui, and only leaves blank, uncached inputs
	fileExtraction: function( i, input ) {
		var par = input.parentNode;
		if ( par && input.value ) {
			par.insertBefore( input.cloneNode( true ), input );
			par.removeChild( input );
			input.name = Defaults.prefix + Guid();
			this.form.appendChild( input );
		}
	},

	// Adds data in the form of hidden inputs
	addData: function( name, value ){
		var elem = document.createElement( 'input' );
		elem.setAttribute( 'type', 'hidden' );
		elem.setAttribute( 'name', name );
		elem.setAttribute( 'value', value );
		this.form.appendChild( elem );
	},

	// Load handler
	load: function( stalled ) {
		var self = this, doc, child;

		// Check for frame submission reset
		if ( self.frame.src == "javascript:'%3Chtml%3E%3C/html%3E';" || self.frame.src == "javascript:'<html></html>';" ) {
			// First time around, do not delete.
			// We reload to blank page, so that reloading main page
			// does not re-submit the post.
			if ( self.blank ) {
				// Fix busy state in FF3
				setTimeout(function(){
					self.frame.parentNode.removeChild( self.frame );
				}, 0);
			}
			return;
		}

		// Set the document element
		doc = self.frame.contentDocument ? self.frame.contentDocument : window.frames[ self.frame.id ].document;

		// fixing Opera 9.26,10.00
		if ( doc.readyState && doc.readyState != 'complete' ) {
			// Opera fires load event multiple times
			// Even when the DOM is not ready yet
			// this fix should not affect other browsers
			return;
		}

		// fixing Opera 9.64
		if ( doc.body && doc.body.innerHTML == "false" ) {
			// In Opera 9.64 event was fired second time
			// when body.innerHTML changed from false 
			// to server response approx. after 1 sec
			return;
		}

		// Delay opera to allow for full frame load
		// TODO: Find out why this is needed
		if ( window.opera && ! stalled ) {
			setTimeout(function(){
				self.load( true );
			}, 100);
			return;
		}

		// Set the response
		if ( doc.XMLDocument ) {
			// response is a xml document Internet Explorer property
			self.response = doc.XMLDocument;
		}
		else if ( doc.body ) {
			// response is html document or plain text
			self.response = doc.body.innerHTML;

			if ( self.settings.JSON === true ) {
				// If the document was sent as 'application/javascript' or
				// 'text/javascript', then the browser wraps the text in a <pre>
				// tag and performs html encoding on the contents.  In this case,
				// we need to pull the original text content from the text node's
				// nodeValue property to retrieve the unmangled content.
				// Note that IE6 only understands text/html
				if ( ( child = doc.body.firstChild ) && child.nodeName.toUpperCase() === 'PRE' && child.firstChild ) {
					self.response = child.firstChild.nodeValue;
				}

				// Turn JSON into object
				self.response = self.settings.JSON ? toJSON( self.response ) : self.response;
			}
		}
		else {
			// response is a xml document
			self.response = doc;
		}

		// A successful response is one that returns (headers are ignored)
		if ( self.settings.success ) {
			self.settings.success( self.response );
		}

		// Reload blank page, so that reloading main page
		// does not re-submit the post. 
		self.blank = true;
		self.frame.src = "javascript:'<html></html>';";
	},

	build: function(){
		var self = this, load = function(){
			self.load();
		};

		// Create the frame and form
		self.blank = false;
		self.guid = Guid();
		self.frame = Add("<iframe src='javascript:false;' name='" + self.guid + "' id='" + self.guid + "' style='display:none;'></iframe>");
		self.form = Add("<form action='" + self.action + "' method='POST' target='" + self.guid + "' style='display:none;' enctype='multipart/form-data'></form>");

		// Add files and metadata
		each( self.files, self, self.fileExtraction );
		each( self.data, self, self.addData );

		// Submit the form and wait for response
		if ( self.frame.attachEvent ) {
			self.frame.attachEvent( 'onload', load );
		} else {
			self.frame.addEventListener( 'load', load, false );
		}
		self.form.submit();

		// Cleanup
		self.form.parentNode.removeChild( self.form );
	}
};



// Expose Upload function
window.Upload = function( files, data, action, settings ) {
	return new Upload( files, data, action, settings );
};


// Global Error Handler
window.Upload.error = Upload.error = function( msg ) {
	msg = typeof msg == 'string' ? new Error( msg ) : msg;
	if ( fn === undefined ) {
		throw msg;
	}
};


// Determine native or frame hack for uploads
window.Upload.NativeUpload = Upload.NativeUpload = !!( 'FileReader' in window && 'XMLHttpRequest' in window );


// Push defaults onto Upload constructor
window.Upload.defaults = Upload.defaults = Defaults;


// Push native/framehack objectives onto the upload prototype
Upload.prototype = Upload.NativeUpload ? NativeUpload : FrameUpload;


})( this, this.document );
