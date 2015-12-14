<?php
require_once  (dirname(__FILE__).'/api/controller.php');
use prototype\api\Config as Config;
$uidNumber = Config::me('uidNumber') ? Config::me('uidNumber') : $_SESSION['phpgw_info']['expressomail']['user']['account_id'];
$me = Controller::read(array('concept' => 'user', 'service' => 'OpenLDAP'  , 'id' => $uidNumber));
$sql  = "SELECT * FROM phpgw_preferences where preference_app = 'common' AND preference_owner IN ( '-2' , '-1' , {$me['id']} ) ORDER BY preference_owner DESC";
$preferences =  Controller::service('PostgreSQL')->execResultSql($sql);

foreach( $preferences as $preference){
    $values = unserialize($preference['preference_value']);
    if(isset( $values['lang'] ))
        $me['lang'] = $values['lang'];
}

echo json_encode( $me );