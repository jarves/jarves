<?php

namespace Jarves\Client;

use Jarves\Configuration\SessionStorage;
use Jarves\Model\Session;

interface SessionStorageInterface
{
    function __construct(SessionStorage $storage, ClientAbstract $client);

    public function save($key, Session $session);

    public function get($key);

    public function delete($key);
}