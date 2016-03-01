<?php
include_once (dirname(__FILE__) . '/../../api/controller.php');

use prototype\api\Config as Config;

/**
 * Classe de log do admin.
 * @author carlos-vaz
 * - dataHora: Data e hora do log
 * - ip: Ip do usuário
 * - user: Usuario logado
 * - application: expressoMail, Calendar, Admin, etc...
 * - level:
 *    - trace: usado para fazer um trace em desenvolvimento
 *    -	info: informações gerais
 *    - warning: mensagens de alerta, algo que não interrompe o funcionamento mas prejudica de alguma forma.
 *    -	error: mensagens de fatal error.
 * - application: Classe ou modulo que gerou o log.
 * - action: Metodo ou rotina que  gerou o log.
 * - mensage: informações detalhadas do erro.
 * - servername: Nome do servidor que está rodando a instância do php.
 *
 */
class Logger
{

	const ERROR   = 'error';
	const WARNING = 'warning';
	const INFO    = 'info';
	const TRACE   = 'trace';

	const IN_DB   = 'IN_DB';
	const IN_FILE = 'IN_FILE';

	private static $_instance = NULL;
	private static $_dbinfo = NULL;


	public static function trace($application, $action, $message, $writeMethod=Logger::IN_DB)
	{
		self::log(self::TRACE, $application, $action, $message, $writeMethod);
	}

	public static function info($application, $action, $message, $writeMethod=Logger::IN_DB)
	{
		self::log(self::INFO, $application, $action, $message, $writeMethod);
	}

	public static function warning($application, $action, $message, $writeMethod=Logger::IN_DB)
	{
		self::log(self::WARNING, $application, $action, $message, $writeMethod);
	}

	public static function error($application, $action, $message, $writeMethod=Logger::IN_DB)
	{
		self::log(self::ERROR, $application, $action, $message, $writeMethod);
	}

	public static function log($level=self::INFO, $application, $action, $message, $writeMethod)
	{
		// nao faz login se USE_LOGGER eh falso
		if (USE_LOGGER === false)
		{
			return;
		}

		if(!isset(self::$_instance))
		{
			self::$_instance = new Logger();
			self::$_dbinfo = isset($_SESSION['phpgw_info']['expressomail']['server']['loggerdb'])?$_SESSION['phpgw_info']['expressomail']['server']['loggerdb']:$GLOBALS['phpgw_info']['server']['loggerdb'];
		}

		$application = strtolower($application);
		$action      = strtolower($action);

		if($writeMethod===Logger::IN_DB)
			self::$_instance->writeDB($level, $application, $action, $message);
		else
			self::$_instance->writeFile($level, $application, $action, $message);

	}

	private function getContext()
	{
		$cxt = array();
		$cxt['dt'] = date("Ymd");
		$cxt['hr'] = date("H:i:s");
		$cxt['ip'] = $_SERVER['REMOTE_ADDR'];
		$cxt['li'] = $_SESSION['phpgw_info']['expressomail']['user']['account_lid'];
		$cxt['sn'] = gethostname();
		return $cxt;
	}

	private function writeDB($level, $application, $action, $message)
	{

		$cxt = $this->getContext();
		$db = new mysqli(self::$_dbinfo['db_host'],self::$_dbinfo['db_user'],self::$_dbinfo['db_pass'],self::$_dbinfo['db_name'],self::$_dbinfo['db_port']);
		$sql = 'INSERT INTO phpgw_logger (server_name,ip,uid,level,application,action,message) ';
		$sql .= "VALUES('{$cxt['sn']}', '{$cxt['ip']}', '{$cxt['li']}', '$level', '$application', '$action', '$message')";

		if ($db->query($sql) != false)
		{
			$db->close();
			return true;
		}
		else
		{
			$db->close();
			$txt = "'$dateTime', '$ip', '$uid', '$level', '$application', '$action', '$message', '$serverName'";
			$txt = 'writeDB: log('.$txt.')  Error('.pg_last_error().')';
			self::error('LoggerDB', 'write', $txt, self::IN_FILE);
			return false;
		}

	}

	private function writeFile($level, $application, $action, $message)
	{

		$arqName = '';

		if($level===Logger::ERROR)
			$arqName = 'errorLog.txt';
		else
			$arqName = 'accessesLog.txt';

		$cxt = $this->getContext();

		$arquivo = $GLOBALS['phpgw_info']['server']['PHPGW_LOG_ACTION_DIR']."/".$cxt['dt'].$arqName;

		$texto = "[{$cxt['dt']} {$cxt['hr']}][{$cxt['sn']}][{$cxt['ip']}][{$cxt['li']}][$level][$application][$action]> $message \n";

		$manipular = fopen($arquivo, "a+");

		fwrite($manipular, $texto);

		fclose($manipular);

	}
}
