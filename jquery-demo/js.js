/*
 * Pure Javascript Upload [VERSION]
 * An adaptation of valums ajaxupload(http://valums.com/ajax-upload/)
 * [DATE]
 * Corey Hart @ http://www.codenothing.com
 */
(function( jQuery, Upload, window, undefined ) {


// Set the default action

Upload.defaults.action = '../upload.php';


// jQuery Upload plugin (quick access to Upload function)

jQuery.fn.upload = function( data, settings ) {
	// Return Upload object (chain-breaking)
	return Upload( this.filter('input[type=file]').toArray(), data, settings );
};

// DOM Ready

jQuery(function(){
	var server = jQuery('#server-wrapper'),
		response = jQuery('#server-response'),
		json = jQuery('#json'),
		norm = jQuery('#normalize'),
		drop = jQuery('#drop-area'),
		inputs = jQuery('#input-upload');

	function clearResponse(){
		server.removeClass('error success').addClass('loading');
		response.html('');
	}

	function addResponse( success, result ) {
		server.removeClass('loading').addClass( success ? 'success' : 'error' );
		response.html( result || '' );
	}

	// Normalize file upload
	norm.click(function(){
		Upload[ norm.is(':checked') ? 'normalize' : 'unnormalize' ]();
	});

	// Add drag behavior for browsers that support it
	if ( Upload.DragFiles ) {
		drop.show().bind({
			'dragenter': function(){
				drop.addClass('hover');
				return false;
			},

			'dragover': function(){
				return false;
			},

			'dragleave': function(){
				drop.removeClass('hover');
				return false;
			},

			'drop': function( event ) {
				drop.removeClass('hover');

				// List of files
				var files = event.originalEvent.dataTransfer.files;

				// Extra post data
				var data = {
					JSON: json.is(':checked'),
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

				Upload( files, data, settings );
				return false;
			}
		});
	}

	jQuery('#upload-files').click(function(){
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

		// We clear the file inputs in new browsers as they retain value,
		// and we do a clean search for old browsers that use the frame hack,
		// and those inputs are cloned and replaced, leaving the files stack useless
		inputs.find('input[type=file]').upload( data, settings ).each(function(){
			jQuery( this ).val('');
		});
	});
});

})( jQuery, Upload, this );
