<?php

if (!defined('ROOTPATH'))
    define('ROOTPATH', dirname(__FILE__) . '/..');

use prototype\api\Config as Config;

require_once(__DIR__ . '/../../modules/catalog/interceptors/CatalogDBMapping.php');
/**
 * Classe que fornece via REST que todos os contatos do usario no quais sao:
 * - Contatos Dinâmicos
 * - Contatos Pessoais
 * - Grupos
 * - Contatos Compartilhados
 * - Grupos Compartilhados
 */
class UserDynamicContactsResource extends Resource
{

	/**
    * Retorna todos os contatos que o usario possui para usar na busca dinamica.
	* @return Retorna uma lista de Contatos Dinâmicos, Grupos, Contatos Pessoais, Grupos Compartilhados e Contatos Compartilhados
	* @access     public
	* */
	function get($request)
	{
		$this->secured();

		//verificar se a preferencia de contatos dinamicos nao esta ativada
		if(!$this->isEnabledDynamicContacts()){
			$response = new Response($request);
			$response->addHeader('Content-type', 'aplication/json');
			$response->code = Response::UNAUTHORIZED;
			$response->body = 'disabled dynamic contacts preference';
			return $response;
		}

	    $catalog = new CatalogDBMapping();
		$contactsUser = $catalog->allContactsUser(Config::me("uidNumber"));

		$response = new Response($request);
		$response->addHeader('Content-type', 'aplication/json');
		$response->code = Response::OK;
		$response->body = json_encode($contactsUser);
		return $response;

	}

    private function isEnabledDynamicContacts(){
		$dynamicContactsEnable = $_SESSION['phpgw_info']['user']['preferences']['expressoMail']['use_dynamic_contacts'];
		if($dynamicContactsEnable === '1')
			return true;
		else
			return false;
    }
}

?>
