/*
 * Pure Upload [VERSION]
 * An adaptation of valums ajaxupload(http://valums.com/ajax-upload/)
 * [DATE]
 * Corey Hart @ http://www.codenothing.com
 */
(function( window, document, Upload, undefined ) {

// Workspace Globals

var serverResponse, serverWrapper, uploadWrapper;

// Upload Handler

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
			elem.className += trim( ' ' + value );
		}
	}
}


function removeClass( elem, value ) {
	if ( elem.nodeType === 1 ) {
		if ( elem.className.indexOf( value ) !== -1 ) {
			elem.className += trim( elem.className.removeClass( value, '' ) );
		}
	}
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
			postVar1: 'miscData'
		};

		// Settings and callbacks
		var settings = {
			success: function( result ) {
				removeClass( serverWrapper, 'error' );
				addClass( serverWrapper, 'success' );
				serverResponse.innerHTML = result;
			},
			error: function( result ){
				removeClass( serverWrapper, 'success' );
				addClass( serverWrapper, 'error' );
				serverResponse.innerHTML = result;
			}
		};

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

	// Upload files through file inputs
	document.getElementById('upload-files').onclick = function(){
		// List of inputs to be uploaded
		var files = getFileInputs();

		// Extra post data
		var data = {
			postVar1: 'miscData'
		};

		// Settings and callbacks
		var settings = {
			success: function( result ) {
				removeClass( serverWrapper, 'error' );
				addClass( serverWrapper, 'success' );
				serverResponse.innerHTML = result;
			},
			error: function( result ) {
				removeClass( serverWrapper, 'success' );
				addClass( serverWrapper, 'error' );
				serverResponse.innerHTML = result;
			}
		};

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
