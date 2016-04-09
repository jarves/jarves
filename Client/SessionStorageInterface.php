<?php
/**
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

namespace Jarves\Client;

use Jarves\Configuration\SessionStorage;
use Jarves\Model\Session;

interface SessionStorageInterface
{
    public function configure(SessionStorage $storage, ClientAbstract $client);

    public function save($key, Session $session);

    public function get($key);

    public function delete($key);
}