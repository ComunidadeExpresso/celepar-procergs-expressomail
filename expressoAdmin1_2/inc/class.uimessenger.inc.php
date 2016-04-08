<?php
class uimessenger
{
	var $public_functions = array(
		'save' => true,
		'config' => true,
		'edit' => true,
	);
	
	var $_so;
	
	function uimessenger()
	{
		$this->_so = CreateObject('expressoAdmin1_2.somessenger');
		if ( !@is_object($GLOBALS['phpgw']->js) ) $GLOBALS['phpgw']->js = CreateObject('phpgwapi.javascript');
	}
	
	function save()
	{
		if ( !( isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest' ) ) {
			$GLOBALS['phpgw']->redirect($GLOBALS['phpgw']->link('/admin/index.php'));
			return false;
		}
		
		if ( !$GLOBALS['phpgw']->acl->check('run',1,'admin') ) $this->_setResponse( null, 401 );
		
		$result = $this->_so->setMessengerConf( $_POST );
		if ( $result === true ) $this->_setResponse( utf8_encode(lang('Configuration saved successfully')) );
		else $this->_setResponse( $result, 400 );
	}
	
	function config()
	{
		if ( !( isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest' ) ) {
			$GLOBALS['phpgw']->redirect($GLOBALS['phpgw']->link('/admin/index.php'));
			return false;
		}
		
		if ( !$GLOBALS['phpgw']->acl->check('run',1,'admin') ) $this->_setResponse( null, 401 );
		
		$result = array(
			Messenger::CONFIG_ENABLED        => $this->_so->_im->enabled,
			Messenger::CONFIG_DOMAIN         => $this->_so->_im->domain,
			Messenger::CONFIG_URL            => $this->_so->_im->url,
			Messenger::CONFIG_PUBKEY         => $this->_so->_im->pubkey,
			Messenger::CONFIG_GROUPENABLED   => $this->_so->_im->groupenabled,
			Messenger::CONFIG_GROUPBASE      => $this->_so->_im->groupbase,
			Messenger::CONFIG_GROUPFILTER    => $this->_so->_im->groupfilter,
		);
		
		$this->_setResponse( $result );
	}
	
	function _setResponse( $data, $code = null )
	{
		if ( !is_null($code) ) header( ':', true, (int)$code );
		header( 'Content-Type: application/json' );
		echo json_encode( (array)$data );
		exit;
	}
	
	function edit()
	{
		if ( !$GLOBALS['phpgw']->acl->check('run',1,'admin') ) $GLOBALS['phpgw']->redirect($GLOBALS['phpgw']->link('/admin/index.php'));
		
		$GLOBALS['phpgw']->js->add('src','./prototype/plugins/jquery/jquery.min.js');
		$GLOBALS['phpgw']->js->add('src','./prototype/plugins/jquery/jquery-ui.min.js');
		$GLOBALS['phpgw']->js->validate_file('jscode','connector','expressoAdmin1_2');
		$GLOBALS['phpgw']->js->validate_file('jscode','lang','expressoAdmin1_2');
		$GLOBALS['phpgw']->js->validate_file('jscode','messenger_config','expressoAdmin1_2');
		$GLOBALS['phpgw']->css->validate_file('./prototype/plugins/jquery/jquery-ui.css');
		$GLOBALS['phpgw']->css->validate_file('expressoAdmin1_2/templates/default/css/custom.css');
		
		unset($GLOBALS['phpgw_info']['flags']['nonavbar']);
		$GLOBALS['phpgw_info']['flags']['app_header'] = $GLOBALS['phpgw_info']['apps']['expressoAdmin1_2']['title'].' - '.lang('Expresso Messenger');
		$GLOBALS['phpgw']->common->phpgw_header();
		
		$p = CreateObject('phpgwapi.Template',PHPGW_APP_TPL);
		$p->set_file(array('messenger' => 'messenger.tpl'));
		$p->set_block('messenger','body','body');
		$p->set_block('messenger','row_opts','row_opts');
		$p->set_var(array(
			'lang_title'                    => lang('Expresso Messenger Settings'),
			'lang_save'                     => lang('Save'),
			'lang_cancel'                   => lang('Cancel'),
			'lang_yes'                      => lang('Yes'),
			'lang_no'                       => lang('No'),
			'lang_enabled'                  => lang('Enabled'),
			'lang_disabled'                 => lang('Disabled'),
			
			'lang_messenger_enabled'        => lang('Enable Messenger'),
			'input_name_enabled'            => Messenger::CONFIG_ENABLED,
			'input_value_enabled'           => $this->_so->_im->enabled? 'checked' : '',
			
			'lang_jabber_domain'            => lang('Domain Jabber'),
			'input_name_domain'             => Messenger::CONFIG_DOMAIN,
			'input_value_domain'            => $this->_so->_im->domain,
			
			'lang_url'                      => lang('URL for direct connection'),
			'lang_url_ex'                   => 'Ex.: http://server_jabber:5280/http-bind',
			'input_name_url'                => Messenger::CONFIG_URL,
			'input_value_url'               => $this->_so->_im->url,
			
			'lang_pubkey'                   => lang('Public Key'),
			'lang_pubkey_ex'                => lang('Encrypts the password before sending to jabber server').'. '.
			                                   lang('Store in PEM format: base64 encoded, closed between "%1" and "%2"', '-----BEGIN PUBLIC KEY-----', '-----END PUBLIC KEY-----'),
			'input_name_pubkey'             => Messenger::CONFIG_PUBKEY,
			'input_value_pubkey'            => $this->_so->_im->pubkey,
			
			'lang_group_enabled'            => lang('Enable filter by group'),
			'input_name_group_enabled'      => Messenger::CONFIG_GROUPENABLED,
			'input_value_group_enabled'     => $this->_so->_im->groupenabled? 'checked' : '',
			
			'lang_group_options'            => lang('Group filter options'),
			'input_class_group_options'     => $this->_so->_im->groupenabled? '' : 'ui-state-disabled',
			
			'lang_group_base'               => lang('Base DN for the directory'),
			'input_name_group_base'         => Messenger::CONFIG_GROUPBASE,
			
			'lang_group_filter'             => lang('Search filter for user groups'),
			'lang_group_filter_ex'          => 'Ex.: (&(objectClass=posixGroup)(cn=group-jabber-*)(memberUid=%u))',
			'input_name_group_filter'       => Messenger::CONFIG_GROUPFILTER,
			'input_value_group_filter'      => $this->_so->_im->groupfilter,
		));
		
		foreach( $this->_so->_im->listConfigFunc( 'GROUPBASE' ) as $key => $value ) {
			$p->set_var( array(
				'option_value'   => $key,
				'option_enabled' => $this->_so->_im->groupbase === $key? ' selected' : '',
				'option_text'    => lang( $key ),
			) );
			$p->fp('opts_groupbase','row_opts',True);
		}
		$p->pparse('out','body');
	}
}
