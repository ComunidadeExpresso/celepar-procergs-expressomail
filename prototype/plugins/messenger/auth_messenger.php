<?php

  /***************************************************************************\
  *  Expresso - Expresso Messenger                                            *
  * ------------------------------------------------------------------------- *
  *  This program is free software; you can redistribute it and/or modify it  *
  *  under the terms of the GNU General Public License as published by the    *
  *  Free Software Foundation; either version 2 of the License, or (at your   *
  *  option) any later version.                                               *
  \***************************************************************************/

if( !isset($GLOBALS['phpgw_info']) )
{
	$GLOBALS['phpgw_info']['flags'] = array(
		'currentapp' => 'expressoMail',
		'nonavbar'   => true,
		'noheader'   => true
	);
}

require_once '../../../header.inc.php';

if( !session_id() )
{
	echo json_encode( array( "error" => "Not Permission" ) );
	exit;
}

$im = CreateObject('phpgwapi.messenger');
if ( $im->checkAuth() ) {
	echo json_encode( array(
		'dt__b' => $im->url,
		'dt__c' => $im->domain,
		'dt__a' => $im->getAuth()->client,
		'dt__d' => $im->getAuth()->user,
		'dt__e' => $im->getAuth()->auth,
	) );
}
