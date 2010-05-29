<?php
/*
 * Pure Javascript Upload [VERSION]
 * An adaptation of valums ajaxupload(http://valums.com/ajax-upload/)
 * [DATE]
 * Corey Hart @ http://www.codenothing.com
 */

print_r( $_SERVER );
echo file_get_contents("php://input");
exit();

$result = array(
	'Post Data' => $_POST,
	'Files' => array(),
);

// Limit info shown
foreach ( $_FILES as $key => $file ) {
	$result['Files'][ $key ] = array(
		'name' => $file['name'],
		'type' => $file['type'],
		'size' => $file['size'],
	);
}

// Return JSON Encoded result if wanted
if ( $_POST['JSON'] == 'true' ) {
	echo json_encode( $result );
} else {
	print_r( $result );
}

?>
