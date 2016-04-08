<?php
class somessenger
{
	var $_im              = null;
	
	function somessenger()
	{
		$this->_im = CreateObject('phpgwapi.messenger');
	}
	
	public function setMessengerConf( $params )
	{
		$error      = array();
		$status     = array();
		$commit     = false;
		
		foreach ( $this->_im->getConfigs() as $key => $value )
			$status[$key] = $this->_im->setConfig( $key, isset( $params[$value] )? $params[$value] : null );
		
		foreach ( $status as $key => $value ) {
			switch ($value) {
				case 'skipped': break;
				case 'changed': $commit = true; break;
				default: $error[$key][] = utf8_encode( $value );
			}
		}
		if ( count($error) ) return $error;
		if ( $commit ) $this->_im->commit();
		
		return true;
	}
	
}
