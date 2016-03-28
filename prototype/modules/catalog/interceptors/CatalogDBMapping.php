 <?php

//Definindo Constantes
require_once ROOTPATH . '/modules/catalog/constants.php';

use prototype\api\Config as Config;

    /**
     * Métodos que são chamados conforme definições no arquivo contact.ini & contactGroup.ini
     *
     * @license    http://www.gnu.org/copyleft/gpl.html GPL
     * @author     Consórcio Expresso Livre - 4Linux (www.4linux.com.br) e Prognus Software Livre (www.prognus.com.br)
     * @sponsor    Caixa Econômica Federal
     * @author     José Vicente Tezza Jr. e Gustavo Pereira dos Santos Stabelini
     * @return     Métodos que são chamados conforme definições no arquivo contact.ini & contactGroup.ini
     * @access     public
     * */
	 
class CatalogDBMapping {


    public function findConnections(&$uri, &$params, &$criteria, $original) {

		if(count($params)>0 && isset($params[0]['id'])){
            $params_count = count($params);
			for($i=0; $i < $params_count; ++$i){
				//Retorna o telefone e o e-mail padrao de um determinado contato
				$sql = ' SELECT phpgw_cc_contact_conns.id_typeof_contact_connection as type, phpgw_cc_connections.connection_value as value '
					.'FROM phpgw_cc_contact_conns '
					.'JOIN phpgw_cc_connections '
					.'ON (phpgw_cc_connections.id_connection = phpgw_cc_contact_conns.id_connection) '
					.'WHERE phpgw_cc_contact_conns.id_contact = ' . $params[$i]['id'] . ' AND '
					.'phpgw_cc_connections.connection_is_default = TRUE ';

				$array = Controller::service('PostgreSQL')->execResultSql($sql);
				if(count($array)>0){
					foreach($array as $connection){
						switch($connection['type']){
							case TYPE_EMAIL 	: $params[$i][INDEX_EMAIL] 	= $connection['value']; break;
							case TYPE_TELEPHONE 	: $params[$i][INDEX_TELEPHONE] 	= $connection['value']; break;
							default			: $params[$i][INDEX_EMAIL] = $params[$i][INDEX_TELEPHONE] = '';
						}

					}
				}
				else{
					$params[$i][INDEX_EMAIL] = $params[$i][INDEX_TELEPHONE] = '';
				}
			}
		}
    }

	public function findGroupConnections(&$uri, &$params, &$criteria, $original) {

		if(count($params)>0 && isset($params[0]['id'])){
		$z = 0;
		$count = count($params);
		for($i=0; $i < $count; ++$i){
				//Retorna o telefone e o e-mail padrao de um determinado contato
				$sql = 'SELECT contato.names_ordered as name, contato.id_contact as id, conexao.connection_value as value '
					.'FROM phpgw_cc_groups grupo '
					.'JOIN phpgw_cc_contact_grps grupo_contato '
					.'ON (grupo.id_group = grupo_contato.id_group) '
					.'JOIN phpgw_cc_connections conexao '
					.'ON (grupo_contato.id_connection = conexao.id_connection) '
					.'JOIN phpgw_cc_contact_conns conexaoCon '
					.'ON (conexao.id_connection = conexaoCon.id_connection) '
					.'JOIN phpgw_cc_contact contato '
					.'ON (contato.id_contact = conexaoCon.id_contact) '
					.'WHERE grupo.id_group = ' . $params[$i]['id'] . ' AND '
					.'conexao.connection_is_default = TRUE';

				$array = Controller::service('PostgreSQL')->execResultSql($sql);

				if(count($array)>0){
					$params[$i]['contacts'][$z] = array();
					foreach($array as $connection){
						$params[$i]['contacts'][$z]['id'] = $connection['id'];		
						$params[$i]['contacts'][$z]['name'] = $connection['name'];							
						$params[$i]['contacts'][$z][INDEX_EMAIL] = $connection['value'];							
						++$z;
					}
				}
				else{					
					$params[$i]['contacts'] = null;
				}
			}
		}
    }

   /**
    * Busca todos os contatos que o usario possui, que sao os seguintes:
    * - contatos dynamicos
    * - contatos pessoais
    * - grupos pessoais
    * - contatos compartilhados
    * - grupos compartilhados
    * Converte nomes acentuados de iso para utf-8 (para o json_encode) e elimina repeticoes.
	* @param string $uidNumber: Id de identificacao do usuario no banco de dados.
    * @return array: Contem a lista dos contatos e o rate maior de um
    * contato dinamico.
    */
	public function allContactsUser($uidNumber )
	{

		$relations = Controller::service('PostgreSQL')->execResultSql("select id_related from phpgw_cc_contact_rels where id_contact='{$uidNumber}' and id_typeof_contact_relation=1");

		$sqlOwnerContacts = '';
		$sqlOwnerGroups   = '';

		if(empty($relations))
		{
			$sqlOwnerContacts = " A.id_owner={$uidNumber} ";
			$sqlOwnerGroups = " owner={$uidNumber} ";
		}
		else
		{
			$idRelations = "{$uidNumber},";
			foreach ($relations as $value)
				$idRelations.= $value['id_related'].',';
			$idRelations = substr($idRelations,0,-1);
			$sqlOwnerContacts = " A.id_owner in ({$idRelations}) ";
			$sqlOwnerGroups = " owner in ({$idRelations}) ";
		}

		$sql = "select
					id,
					name,
					mail,
					text('/dynamiccontacts') as type,
					text('/dynamiccontacts') as typel,
					owner,
					number_of_messages
				from expressomail_dynamic_contact
				where owner={$uidNumber}
				union all
				select A.id_contact as id,
					A.names_ordered as name,
					C.connection_value as mail,
					CASE WHEN A.id_owner='{$uidNumber}' THEN '/personalContact' ELSE '/sharedcontact' END as type,
					CASE WHEN A.id_owner='{$uidNumber}' THEN '/personalContact' ELSE '/contacts' END as typel,
					A.id_owner as owner,
					null as number_of_messages
				from phpgw_cc_contact A,
					phpgw_cc_contact_conns B,
					phpgw_cc_connections C
				where A.id_contact = B.id_contact and B.id_connection = C.id_connection
					and B.id_typeof_contact_connection = 1 and
					{$sqlOwnerContacts}
				union all
				select id_group as id,
					title as name,
					short_name as mail,
					CASE WHEN owner='{$uidNumber}' THEN '/groups' ELSE '/sharedgroup' END as type,
					CASE WHEN owner='{$uidNumber}' THEN '/groups' ELSE '/groups' END as typel,
				    owner,
				    null as number_of_messages
				from phpgw_cc_groups
				where $sqlOwnerGroups
				order by name";

		$contacts = Controller::service('PostgreSQL')->execResultSql($sql);
		$total = count($contacts);
		$topContact = 0;
		$arrContacts = array('dynamiccontacts'=>array(), 'personalContact'=>array(),
							 'groups'=>array(), 'sharedcontact'=>array(), 'sharedgroup'=>array()
							 );

		$tmp = array();
		for($x = 0; $x < $total; $x++)
		{
			$contacts[$x]['name'] = mb_convert_encoding($contacts[$x]['name'], 'UTF-8', 'UTF-8 , ISO-8859-1');
			$contacts[$x]['value'] = empty($contacts[$x]['name']) ?
								$contacts[$x]['mail'] :
								$contacts[$x]['name'] . ' - ' . $contacts[$x]['mail'];

			if($contacts[$x]['number_of_messages'] === null)
				unset($contacts[$x]['number_of_messages']);
			else
				$topContact = $contacts[$x]['number_of_messages'] > $topContact ?
							$contacts[$x]['number_of_messages'] : $topContact;

			// Se a lista de contatos contiver emails repetidos seguir
			// a seguinte regra:
			// os emails do contato pessoal sempre prevalecem,
			// seguidos pelo contato compartilhado. Contato dinamico
			// soh aparecera se nao contiver em nenhum outro catalogo
			// do usuario. Logica:
			// email X == Y verificar:
			// ->se X eh dinamico e o Y eh pessoal
			// 	 ->nao adiciona
			// ->se X eh compartilhado e o Y eh pessoal
			// 	 ->nao adiciona
			// ->se X eh dynamico e o Y eh compartilhado
			// 	 ->nao adiciona
			$addToArray = true;
			for ($y=0; $y < $total; $y++)
			{
				if($contacts[$x]['mail'] == $contacts[$y]['mail'] &&
					(
						($contacts[$x]['type']==='/dynamiccontacts' && $contacts[$y]['type']==='/personalContact') ||
						($contacts[$x]['type']==='/sharedcontact' && $contacts[$y]['type']==='/personalContact') ||
						($contacts[$x]['type']==='/dynamiccontacts' && $contacts[$y]['type']==='/sharedcontact')
						)
					)
				{
					$addToArray = false;
					break;
				}
			}
			/*

			 */
			if($addToArray === true)
			{
				switch ($contacts[$x]['type']) {
					case '/dynamiccontacts':
						$arrContacts['dynamiccontacts'][] = $contacts[$x];
						break;
					case '/personalContact':
						$arrContacts['personalContact'][] = $contacts[$x];
						break;
					case '/groups':
						$arrContacts['groups'][] = $contacts[$x];
						break;
					case '/sharedcontact':
						$arrContacts['sharedcontact'][] = $contacts[$x];
						break;
					case '/sharedgroup':
						$arrContacts['sharedgroup'][] = $contacts[$x];
						break;
				}
			}
        }
		$return['contacts'] = array_merge($arrContacts['dynamiccontacts'], $arrContacts['personalContact'],
		                      $arrContacts['groups'], $arrContacts['sharedcontact'],
		                      $arrContacts['sharedgroup']);
		$return['topContact'] = $topContact;
		return $return;
    }
}

?>
