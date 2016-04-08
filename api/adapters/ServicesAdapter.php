<?php

class ServicesAdapter extends ExpressoAdapter
{
	function __construct($id)
	{
		parent::__construct($id);
	}

	protected function authChat()
	{
		$im = CreateObject('phpgwapi.messenger');
		if ( $im->checkAuth() ) {
			return array(
				'B' => $im->url,
				'C' => $im->domain,
				'A' => $im->getAuth()->client,
				'D' => $im->getAuth()->user,
				'E' => $im->getAuth()->auth,
			);
		}
		return false;
	}

}

?>