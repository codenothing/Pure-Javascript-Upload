<?php
/*
 * Pure Javascript Upload [VERSION]
 * An adaptation of valums ajaxupload(http://valums.com/ajax-upload/)
 * [DATE]
 * Corey Hart @ http://www.codenothing.com
 */
$JSON = false;
$result = array(
	'Post Data' => $_POST,
	'Get Data' => $_GET,
	'Files' => array(),
);


// Chrome single file upload
// You can grab the actual file through "file_get_contents('php://input')"
if ( $_SERVER['HTTP_X_FILE_NAME'] ) {
	$result['Files'] = array(
		'name' => $_SERVER['HTTP_X_FILE_NAME'],
		'size' => $_SERVER['HTTP_X_FILE_SIZE']
	);
	$JSON = $_GET['JSON'] == 'true' ? true : false;
}
else {
	// Limit info shown
	foreach ( $_FILES as $key => $file ) {
		$result['Files'][ $key ] = array(
			'name' => $file['name'],
			'type' => $file['type'],
			'size' => $file['size'],
		);
	}
	$JSON = $_POST['JSON'] == 'true' ? true : false;
}


// Return JSON Encoded result if wanted
if ( $JSON ) {
	echo json_encode( $result );
} else {
	print_r( $result );
}

?>
