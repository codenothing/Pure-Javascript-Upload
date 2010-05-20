/*
 * Pure Upload [VERSION]
 * Port of valums ajaxupload(http://valums.com/ajax-upload/)
 * [DATE]
 * Corey Hart @ http://www.codenothing.com
 */
(function( window, document, undefined ) {


// Flag IE for special hacks
var IE = !!( 'attachEvent' in document );

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
});

// Unique ID Creation
var Guid = (function(){
	var id = ( new Date() ).getTime();
	return function(){
		return 'PureUpload-' + (++id);
	};
})();

// DRY up event addition
function addEvent( el, type, fn ) {
	if ( IE ) {
		el.attachEvent( 'on' + type, function(){
			fn.call( el );
		});
	} else {
		el.addEventListener( type, fn, false );
	}
}


// Upload Handler
function Upload( files, data, action, callbacks ) {
	var self = this;

	// Force Upload instance
	if ( ! self instanceof Upload ) {
		return new Upload( files, data, action, callbacks );
	}

	// We allow single file uploads, so we must force array object when needed
	if ( files && Object.prototype.toString.call( files ) !== "[object Array]" ) {
		files = [ files ];
	}

	// Organize parameters (only files and action is required)
	if ( callbacks === undefined && typeof action == 'object' ) {
		callbacks = action;
		action = {};
	}

	// Store arguments on Upload object for reuse
	self.files = files;
	self.data = data || {};
	self.action = action || Upload.action;
	self.callbacks = callbacks || {};
	self.guid = Guid();

	// Run quick error check
	if ( ! self.files || ! self.files.length ) {
		Upload.error( 'No files could be found', self.callbacks.error );
	}
	else if ( typeof self.action != 'string' || ! self.action.length ) {
		self.error( 'Invalid action', self.callbacks.error );
	}

	// Start building process
	self.build();
}

// Global Error Handler
Upload.error = function( msg, fn ) {
	msg = typeof msg == 'string' ? new Error( msg ) : msg;
	if ( fn === undefined ) {
		throw msg;
	} else {
		fn( msg );
	}
};

// Browsers that support native file upload reap the benefits
var NativeUpload = {
	aborting: false,
	abort: function(){
	}
};

// Older browsers have to rely on form to iframe submission
var FrameUpload = {
	frame: undefined,
	form: undefined,
	blank: false,
	abort: function(){
		self.blank = true;
		if ( self.frame ) {
			// Curtosy of http://www.extjs.com/forum/showthread.php?38613-File-Upload-Cancel,
			// IE keeps loading the frame even if you remove it, so we need to reset it onto
			// the blank page
			if ( IE ) {
				self.frame.src = '<html></html>';
			}
			self.frame.parentNode.removeChild( self.frame );
		}
	},

	// Webkit wont let you copy over the file input value, so we need
	// to pull each file out and replace with a copy of the node. This
	// reduces damage to the ui, and only leaves blank, uncached inputs
	fileExtraction: function(){
		var self = this, i = self.files.length, form = self.form, stack = [], input, par;
		while ( --i > -1 ) {
			if ( ( input = self.files[ i ] ) && ( par = input.parentNode ) ) {
				par.insertBefore( input.cloneNode( true ) );
				form.appendChild( par.removeChild( input ) );
			}
		}
	},

	// Adds data in the form of hidden inputs
	addData: function(){
		var data = this.data, form = this.form, el, i;
		for ( i in data ) {
			if ( data.hasOwnProperty( i ) ) {
				el = document.createElement( 'input' );
				el.setAttribute( 'type', 'hidden' );
				el.setAttribute( 'name', i );
				el.setAttribute( 'value', data[ i ] );
				form.appendChild( el );
			}
		}
	},

	load: function(){
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

		// Set the response
		if ( doc.XMLDocument ) {
			// response is a xml document Internet Explorer property
			self.response = doc.XMLDocument;
		} else if ( doc.body ) {
			// response is html document or plain text
			self.response = doc.body.innerHTML;

			if ( self.callbacks.JSON === true ) {
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
				self.response = self.response !== '' ? eval( '(' + self.response + ')' ) : {};
			}
		} else {
			// response is a xml document
			self.response = doc;
		}

		// A successful resposne is one that returns (headers are ignored)
		if ( self.callbacks.complete ) {
			self.callbacks.complete.call( self, self.response );
		}

		// Reload blank page, so that reloading main page
		// does not re-submit the post. Also, remember to
		// delete the frame
		self.blank = true;
		self.frame.src = "javascript:'<html></html>';";
	},

	build: function(){
		var self = this;

		// Create the frame and form
		self.frame = Add("<iframe src='javascript:false;' name='" + self.guid + "' id='" + self.guid + "' style='display:none;'></iframe>");
		self.form = Add("<form action='" + self.action + "' method='POST' target='" + self.guid + "' style='display:none;' enctype='multipart/form-data'></form>");

		// Add files and metadata
		self.fileExtraction();
		self.addData();

		// Submit the form and wait for response
		addEvent( self.frame, 'load', function(){
			self.load();
		});
		self.form.submit();

		// Cleanup
		self.form.parentNode.removeChild( self.form );
	}
};


// Runing 
Upload.prototype = !!( 'FileReader' in window && 'XMLHttpRequest' in window ) ? NativeUpload : FrameUpload;

// Setup error Handler seperately, so it can be overwritten

// Expose Upload function
window.Upload = Upload;

})( this, this.document );
