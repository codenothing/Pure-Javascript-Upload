/*
 * Pure Javascript Upload [VERSION]
 * An adaptation of valums ajaxupload(http://valums.com/ajax-upload/)
 * [DATE]
 * Corey Hart @ http://www.codenothing.com
 */
(function( window, document, undefined ) {


// Defaults (gets converted to Upload.defaults later on)

var Defaults = {
	action: 'upload.php',
	prefix: 'file-'
};


// Gets set later, controls which upload method to use

var handler;


// Quick element addition

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
		return 'PureJavascriptUpload-' + (++id);
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

// Simplified success/complete handler

function success( instance ) {
	var succes = instance.settings.success, complete = instance.settings.complete;

	if ( success ) {
		success.call(
			instance,
			instance.settings.JSON ? toJSON( instance.response ) : instance.response
		);
	}

	if ( complete ) {
		complete.call( instance, instance.response );
	}
}

// Simplified error handler

function error( instance, e ) {
	var err = instance.settings.error, complete = instance.settings.complete;

	if ( err ) {
		err.call( instance, e || instance.response );
	}

	if ( complete ) {
		compete.call( instance, e || instance.response );
	}
}


// JSON Conversion

function toJSON( str ) {
	str = str || '';
	return window.JSON && window.JSON.parse ? window.JSON.parse( str ) : eval( '(' + str + ')' );
}




// Browsers that support native file upload reap the benefits

function NativeUpload ( files, data, action, settings ) {
	var self = this, stack = [];

	// Store arguments
	self.files = files;
	self.data = data;
	self.action = action;
	self.settings = settings;

	// Store Instance Vars
	self.counter = 0;
	self.read = {};
	self.xhr = undefined;
	self.aborting = false;
	self.boundary = '';
	self.response = '';
	self.length = files.length;

	// Create a new stack 
	each( self.files, function( i, file ) {
		if ( file.files && file.files[ 0 ] ) {
			// Handle multiple files in single input
			self.length += file.files.length;

			each( file.files, function( j, entry ) {
				if ( entry && entry.fileName ) {
					self.readFile( entry );
				}
			});
		}
		else if ( file.fileName ) {
			self.readFile( file );
		}
	});

	// Track stack length for source request
	self.length = stack.length;

	// Read each file
	each( stack, self, self.readFile );
}

NativeUpload.prototype = {

	abort: function(){
		each( this.read, function( i, read ) {
			if ( read.complete === false ) {
				read.reader.abort.call( read.reader );
			}
		});
	},

	readFile: function( file ) {
		// Reader Object
		var self = this, reader = new FileReader(), guid = Guid(), 
			// Create a reference
			read = self.read[ guid ] = {
				file: file,
				name: file.fileName,
				reader: reader,
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
				self.aborting = true;
				self.abort();
			}
			// If we are in the process of manually aborting, don't trigger the error handler
			else {
				return;
			}

			// Dispatch error
			error( self, 'Unable to read ' + file.fileName );
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
			source += "Content-Disposition: form-data; name='" + Defaults.prefix + (++self.counter) + "'; filename='" + file.fileName + "'\r\n";
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

		// Setup request headers
		xhr.open( 'POST', self.action, true );
		xhr.setRequestHeader( 'Content-Type', 'multipart/form-data; boundary=' + self.boundary );
		xhr.setRequestHeader( 'Content-Length', source.length );

		// Response
		xhr.onreadystatechange = function(){
			if ( xhr.readyState == 4 ) {
				self.response = xhr.responseText;

				// Anything in the 200's is a successful request, and 304 is a cached successful request
				if ( ( xhr.status >= 200 && xhr.status < 301 ) || xhr.status === 304 ) {
					success( self );
				} else {
					error( self );
				}
			}
		};

		// File reading is finished, transfer the 
		// xhr abort method to xhr abort method
		self.abort = xhr.abort;

		// Start the request
		xhr.sendAsBinary( source );
	}

};



// For chrome 5.x and safari 4.x

function SingleUpload( files, data, action, settings ) {
	var self = this;

	// Store Arguments
	self.files = files;
	self.data = data;
	self.action = action;
	self.settings = settings;
	self.length = files.length;

	// Store specialized instance props
	self.aborting = false;
	self.response = [];
	self.pack = [];
	self.xhr = [];

	// Build the action
	self.params();

	each( self.files, function( i, file ) {
		if ( file.files && file.files.length ) {
			// Handle multiple files in single input
			self.length += file.files.length;

			each( file.files, function( j, f ) {
				if ( f && f.fileName ) {
					self.send( f );
				}
			});
		}
		else if ( file.fileName ) {
			self.send( file );
		}
		else {
			self.length--;
		}
	});
}

SingleUpload.prototype = {

	abort: function( e ) {
		each( this.xhr, function( i, xhr ) {
			if ( xhr.readyState !== 4 ) {
				xhr.abort();
			}
		});
	},

	params: function(){
		var self = this, noq = self.action.indexOf('?') === -1;

		// Add each data pair as GET variables
		each( self.data, function( name, value ) {
			// Add query string notifier/separator based on the current action url
			self.action += noq ? '?' : '&';
			self.action += name + '=' + value;
			noq = true;
		});
	},

	send: function( file ) {
		var self = this, xhr = new XMLHttpRequest();
		self.xhr.push( xhr );

		// Setup request headers
		xhr.open( 'POST', self.action, true );
		xhr.setRequestHeader( 'Content-Type', 'multipart/form-data' );
		xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
		xhr.setRequestHeader( 'X-File-Name', file.fileName );
		xhr.setRequestHeader( 'X-File-Size', file.fileSize );

		// We use the upload onload handler and a timeout to let the full request process
		// via: http://webreflection.blogspot.com/2009/03/safari-4-multiple-upload-with-progress.html
		xhr.upload.onload = function(){
			setTimeout(function(){
				if ( xhr.readyState == 4 ) {
					var response = xhr.responseText;
					self.response += response;

					// Anything in the 200's is a successful request, and 304 is a cached successful request
					if ( ( xhr.status >= 200 && xhr.status < 301 ) || xhr.status === 304 ) {
						// We push the result onto a stack ( where all file responses go )
						self.pack.push(
							self.settings.JSON ? toJSON( response ) : response
						);

						// Trigger success if final request
						if ( --self.length < 1 ) {
							success( self, true );
						}
					}
					// Make sure we aren't in the process of aborting ()
					else if ( self.aborting === false ) {
						self.aborting = true;
						self.abort();
						error( self, response );
					}
				} else {
					setTimeout( arguments.callee, 15 );
				}
			}, 15);
		};

		xhr.upload.onabort = xhr.upload.onerror = function(){
			if ( self.aborting === false ) {
				self.abort( xhr.responseText );
			}
		};

		// Start the request
		xhr.send( file );
	}

};

// Older browsers have to rely on form to iframe submission

function FrameUpload( files, data, action, settings ) {
	var self = this, load = function(){
		self.load();
	};

	// Store arguments
	self.files = files;
	self.data = data;
	self.action = action;
	self.settings = settings;

	// Store Instance Vars
	self.response = '';
	self.blank = false;
	self.guid = Guid();

	// Create the frame and form
	self.frame = Add("<iframe src='javascript:false;' name='" + self.guid + "' id='" + self.guid + "' style='display:none;'></iframe>");
	self.form = Add("<form action='" + self.action + "' method='POST' target='" + self.guid + "' style='display:none;' enctype='multipart/form-data'></form>");

	// Webkit wont let you copy over the file input value, so we need
	// to pull each file out and replace with a copy of the node. This
	// reduces damage to the ui, and only leaves cloned, uncached inputs
	each( self.files, function( i, elem ) {
		var par = elem.parentNode;
		if ( par && elem.value ) {
			par.insertBefore( elem.cloneNode( true ), elem );
			par.removeChild( elem );
			elem.name = Defaults.prefix + (++self.counter);
			self.form.appendChild( elem );
		}
	});

	// Add Data
	each( self.data, function( name, value ) {
		var elem = document.createElement( 'input' );
		elem.setAttribute( 'type', 'hidden' );
		elem.setAttribute( 'name', name );
		elem.setAttribute( 'value', value );
		self.form.appendChild( elem );
	});

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

FrameUpload.prototype = {

	abort: function(){
		var self = this;

		// Cancel the current frame load by loading the blank source
		if ( self.frame ) {
			self.blank = true;
			self.frame.src = "javascript:'<html></html>';";
			error( self, 'Upload canceled' );
		}
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
					if ( self.frame ) {
						self.frame.parentNode.removeChild( self.frame );
					}
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
		if ( window.opera && stalled !== true ) {
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
			}
		}
		else {
			// response is a xml document
			self.response = doc;
		}

		// A successful response is one that returns (headers are ignored)
		success( self );

		// Reload blank page, so that reloading main page
		// does not re-submit the post. 
		self.blank = true;
		self.frame.src = "javascript:'<html></html>';";
	}

};



// Expose Upload function
var Upload = window.Upload = function( files, data, action, settings ) {
	var e;

	// We allow single file uploads, so we must force array object when needed
	if ( files && ! files.length ) {
		files = [ files ];
	}

	// Missing action parameter
	if ( settings === undefined && typeof action == 'object' ) {
		settings = action;
		action = undefined;
	}

	// Missing data parameter
	if ( typeof data == 'string' ) {
		action = data;
		data = undefined;
	}

	// Since there can only be one level of data, we can assume that if the
	// data object is really the settings object if the success method is a function
	if ( typeof data == 'object' && typeof data.success == 'function' ) {
		settings = data;
		data = undefined;
	}
	
	// Clear undefined's
	files = files;
	data = data || {};
	action = action || Defaults.action;
	settings = settings || {};

	// Run quick error check
	if ( ! files || ! files.length ) {
		e = 'No files could be found';
	}
	else if ( typeof action != 'string' || ! action.length ) {
		e = 'Invalid action';
	}

	return e ?
		// Dispatch error if found
		error( { response: '', settings: settings }, e ) :

		// Start upload process
		new handler( files, data, action, settings );
};


// Determine native or frame hack for uploads
// requires FileReader & XHR API

Upload.NativeUpload = !!( 'FileReader' in window );
Upload.DragFiles = Upload.NativeUpload || !!( 'ondrag' in document );


// Global Error Handler

Upload.error = function( msg ) {
	msg = typeof msg == 'string' ? new Error( msg ) : msg;
	if ( fn === undefined ) {
		throw msg;
	}
};


// Since Chrome/Safari upload is difficult in that we can only send 1 file at a time, and forcing data as GET attributes,
// this function is meant to create the same request/response on each of those browsers

Upload.normalize = function(){
	handler = FrameUpload;
};


// Configure the handler based on browser support

Upload.unnormalize = function(){
	handler = Upload.NativeUpload ? NativeUpload :
		Upload.DragFiles ? SingleUpload :
		FrameUpload;
};


// Push defaults onto Upload constructor

Upload.defaults = Defaults;


// Autotrigger handler config for the first time

Upload.unnormalize();


})( this, this.document );
