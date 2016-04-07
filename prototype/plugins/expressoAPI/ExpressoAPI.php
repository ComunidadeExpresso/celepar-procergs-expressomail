<?php
/**
 * ExpressoAPI - cURL or instance API to expresso rest reources
 *
 * @access		public
 * @author		Alexandre Rocha Wendling <alexandrerw@celepar.pr.gov.br>
 * @category	ExpressoAPI
 * @package		ExpressoAPI
 * @version		1.1
 * 
 * Usage:
 * ExpressoAPI::getInstance('http://example.com/api/rest');
 * ExpressoAPI::One_Resource();
 * ExpressoAPI::isValid();
 * $api = ExpressoAPI::getInstance('/var/www/lib/api/rest');
 * $api->Login(array('params' => array('user' => 'value', 'password'=> 'value')));
 * $api->Other_Resource()->result->foo;
 * $api->setAuth();
 */
class ExpressoAPI
{
	/**
	 * Static instance singleton design
	 * @var object(ExpressoAPI)
	 */
	protected static $_instance;
	
	/**
	 * Url context to access API
	 * @var string
	 */
	protected $_context = null;
	
	/**
	 * Request method
	 * @var string
	 */
	protected $_type = 'POST';
	
	/**
	 * Authority hash logon code
	 * @var string
	 */
	protected $_auth = null;
	
	/**
	 * Storage to last response
	 * @var object(stdClass)
	 */
	protected $_last_response = null;
	
	/**
	 * Storage to last status success
	 * @var boolean
	 */
	protected $_last_result = null;
	
	/**
	 * Class construct
	 *
	 * @param string $context
	 */
	function __construct($context)
	{
		$this->_context = $context;
	}
	
	/**
	 * Get the singleton instance to class, if necessary, change the context
	 * 
	 * @param string $context
	 * @return ExpressoAPI
	 */
	public static function getInstance($context = null)
	{
		if (null === self::$_instance)
			self::$_instance = new self($context);
		
		if (!is_null($context)) self::$_instance->_context = $context;
		
		return self::$_instance;
	}
	
	/**
	 * Set/Unset authority code for automatic add auth param
	 *
	 * @return ExpressoAPI
	 */
	public static function setAuth($value = null)
	{
		$self = self::getInstance();
		$self->_auth = $value;
		return $self;
	}
	
	/**
	 * Check last success status
	 * 
	 * @return boolean
	 */
	public static function isValid()
	{
		$self = self::getInstance();
		return $self->_last_result;
	}
	
	/**
	 * Get last response object
	 * 
	 * @return boolean
	 */
	public static function getLastResponse()
	{
		$self = self::getInstance();
		return $self->_last_response;
	}
	
	/**
	 * Make include instance to resource
	 * 
	 * @param string $name
	 * @param array $arguments
	 * @return object $last_response
	 */
	public static function loadResourceInstance($name, $arguments = null)
	{
		$self = self::getInstance();
		
		// Parse name of resource and package
		$exp = explode('/',str_replace('_','/', trim($name,' /_')));
		$class = array_pop($exp).'Resource';
		$pkg = strtolower(array_pop($exp));
		
		// Include class file
		if (!(class_exists($class, false) || interface_exists($class, false)))
			include($self->_context.($pkg?'/'.$pkg:'').'/'.$class.'.php');
		
		try {
			// Create instance of resource
			$resource = new $class();
			
			// Pass arguments to request format
			$request = new stdClass();
			$request->data = (is_null($arguments[0])? array() : $arguments[0]);
			
			// Call method to execute
			$resource->post($request);
			
			$self->_last_response = new stdClass();
			$self->_last_response->result = (object)$resource->getResult();
			$self->_last_result = true;
			
		} catch (ResponseException $e) {
			$self->_last_response = (object)array('error' => array('code' => $e->getCode(), 'message' => $e->getMessage()));
			$self->_last_result = false;
		}
		return $self->_last_response;
	}
	
	/**
	 * Make request cURL to resource
	 * 
	 * @param string $name - resource name. ex.: Login, Mail/Folders, /Mail/Folders, Mail_Folders
	 * @param array $arguments - array[0]: fields to send, array[1]: set options **not implemented**
	 * @return object(stdClass) $_last_response
	 */
	public static function loadResourceRest($name, $arguments)
	{
		$self = self::getInstance();
		
		// Make url with context and parsed resource name
		$url = $self->_context.'/'.str_replace('_','/', trim($name,' /_'));
		
		// Build query field to send, and set automatic auth if present
		$fields = isset($arguments[0])? $arguments[0] : array();
		if($self->_auth) $fields['params']['auth'] = $self->_auth;
		$fields = http_build_query($fields);
		
		// Init cURL objct
		$curl = curl_init();
		curl_setopt($curl, CURLOPT_FAILONERROR, true);
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
		curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
		
		// Select request method
		switch ($self->_type) {
			case 'GET':
				curl_setopt($curl, CURLOPT_URL, $url.((strlen($fields)>0)? '?'.$fields : ''));
				break;
			case 'POST':
			default:
				curl_setopt($curl, CURLOPT_URL, $url);
				curl_setopt($curl, CURLOPT_POSTFIELDS, $fields);
				break;
		}
		
		// Execute the resource and decode response
		$self->_last_response = json_decode(curl_exec($curl));
		
		// Response is valid? 
		if (curl_errno($curl) || is_null($self->_last_response))
			$self->_last_response = (object)array('error' => array('code' => -1, 'message' => 'Unknown'));
		
		// Set status success/error
		$self->_last_result = !isset($self->_last_response->error);
		
		// Close conection
		curl_close($curl);
		
		// Set/unset automatic authority
		if (isset($self->_last_response->result->auth)) self::setAuth($self->_last_response->result->auth);
		if (trim($name,' /_') == 'Logout') self::setAuth();
		
		// return response
		return $self->_last_response;
	}
	
	/**
	 * Select the loader method based in context
	 * 
	 * @return string
	 */
	public static function getLoader()
	{
		$self = self::getInstance();
		return is_dir($self->_context)? 'loadResourceInstance' : 'loadResourceRest';
	}
	
	/**
	 * Magic method to call ExpressoAPI->loadResource
	 * 
	 * @param string $name
	 * @param array $arguments
	 * @return object(stdClass) $_last_response
	 */
	public function __call($name, $arguments)
	{
		return $this->{$this->getLoader()}($name, $arguments);
	}
	
	/**
	 * Magic method to call ExpressoAPI::loadResource
	 * 
	 * @param string $name
	 * @param array $arguments
	 * @return object(stdClass) $_last_response
	 */
	public static function __callStatic($name, $arguments)
	{
		$self = self::getInstance();
		return $self->{$self->getLoader()}($name, $arguments);
	}
}
