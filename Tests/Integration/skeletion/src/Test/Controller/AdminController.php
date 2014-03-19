<?php

namespace Test\Controller;

use RestService\Server;
use Core\Jarves;

class AdminController extends Server {

    public function run($pEntryPoint){

        $this->addGetRoute('session', 'getSession');

        return parent::run();

    }

    public function getSession(){

        return Jarves::getAdminClient()->getSession()->getId().
            '-'.Jarves::getAdminClient()->getSession()->getTime().'-'.(Jarves::getAdminClient()->getSession()->getUserId()+0);
    }
}

?>