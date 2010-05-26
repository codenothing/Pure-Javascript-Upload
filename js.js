/*
 * Pure Javascript Upload [VERSION]
 * An adaptation of valums ajaxupload(http://valums.com/ajax-upload/)
 * [DATE]
 * Corey Hart @ http://www.codenothing.com
 */
(function( window, document, Upload, undefined ) {


// Workspace Globals

var serverResponse, serverWrapper, uploadWrapper, json;


// Upload Action Direction

Upload.defaults.action = 'upload.php';


// Utility Functions

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


function trim( str ) {
	return ( str || '' ).replace( /^\s+/, '' ).replace( /\s+$/, '' );
}


function getFileInputs(){
	var stack = [];

	each( uploadWrapper.getElementsByTagName('input'), function( i, element ) {
		if ( element.type === 'file' ) {
			stack.push( element );
		}
	});

	return stack;
}


function addClass( elem, value ) {
	if ( elem.nodeType === 1 ) {
		if ( ! elem.className ) {
			elem.className = trim( value );
		}
		else if ( elem.className.indexOf( value ) === -1 ) {
			elem.className = trim( elem.className + ' ' + value );
		}
	}
}


function removeClass( elem, value ) {
	if ( elem.nodeType === 1 ) {
		if ( elem.className.indexOf( value ) !== -1 ) {
			elem.className = trim( elem.className.replace( value, '' ) );
		}
	}
}

function clearResponse(){
	removeClass( serverWrapper, 'error' );
	removeClass( serverWrapper, 'success' );
	addClass( serverWrapper, 'loading' );
	serverResponse.innerHTML = '';
}

function addResponse( success, result ) {
	removeClass( serverWrapper, 'loading' );
	removeClass( serverWrapper, 'error' );
	removeClass( serverWrapper, 'success' );
	addClass( serverWrapper, success ? 'success' : 'error' );
	serverResponse.innerHTML = result || '';
}




// Adding Drag And Drop behavior

function DragFiles(){
	var drop = document.getElementById('drop-area');

	// Drop area is hidden by default
	drop.style.display = 'block';

	drop.ondragenter = function(){
		if ( drop.className.indexOf( 'hover' ) === -1 ) {
			drop.className += ' hover';
		}
		return false;
	};

	drop.ondragover = function(){
		return false;
	};

	drop.ondragleave = function(){
		if ( drop.className.indexOf( 'hover' ) > -1 ) {
			drop.className = drop.className.replace( /hover/, '' );
		}
		return false;
	};

	drop.ondrop = function( event ) {
		if ( drop.className.indexOf( 'hover' ) > -1 ) {
			drop.className = drop.className.replace( /hover/, '' );
		}

		// List of files
		var files = event.dataTransfer.files;

		// Extra post data
		var data = {
			JSON: !!json.checked,
			postVar1: 'miscData'
		};

		// Settings and callbacks
		var settings = {
			JSON: data.JSON,
			success: function( result ) {
				if ( data.JSON ) {
					if ( window.console ) {
						console.log( 'Upload Response:', result );
					}
					result = "Check your console\n\n" + this.response;
				}
				addResponse( true, result );
			},
			error: function( result ){
				if ( data.JSON ) {
					if ( window.console ) {
						console.log( 'Upload Response:', result );
					}
					result = "Check your console\n\n" + this.response;
				}
				addResponse( false, result );
			}
		};

		// Clear response area
		clearResponse();

		Upload( event.dataTransfer.files, data, settings );
		return false;
	};
}




// Wait for window load (use DOM Ready handler if access to framework is provided)

window.onload = function(){
	// Enable drag and drop files from desktop if allowed
	if ( Upload.NativeUpload ) {
		DragFiles();
	}

	// Store server element to be used in many places
	serverResponse = document.getElementById('server-response');
	serverWrapper = document.getElementById('server-wrapper');
	uploadWrapper = document.getElementById('input-upload');
	json = document.getElementById('json');

	// Upload files through file inputs
	document.getElementById('upload-files').onclick = function(){
		// List of inputs to be uploaded
		var files = getFileInputs();

		// Extra post data
		var data = {
			JSON: !!json.checked,
			postVar1: 'miscData'
		};

		// Settings and callbacks
		var settings = {
			JSON: data.JSON,
			success: function( result ) {
				if ( data.JSON ) {
					if ( window.console ) {
						console.log( 'Upload Response:', result );
					}
					result = "Check your console\n\n" + this.response;
				}
				addResponse( true, result );
			},
			error: function( result ){
				if ( data.JSON ) {
					if ( window.console ) {
						console.log( 'Upload Response:', result );
					}
					result = "Check your console\n\n" + this.response;
				}
				addResponse( false, result );
			}
		};

		// Clear response area
		clearResponse();

		// Action has already been defined
		Upload( files, data, settings );

		// We clear the file inputs in new browsers as they retain value,
		// and we do a clean search for old browsers that use the frame hack,
		// and those inputs are cloned and replaced, leaving the files stack
		// above useless.
		each( getFileInputs(), function( i, elem ) {
			elem.value = '';
		});
	};
};


})( this, this.document, this.Upload );
