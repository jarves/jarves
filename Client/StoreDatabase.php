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

use Jarves\Model\Session;
use Jarves\Model\SessionQuery;

class StoreDatabase extends AbstractStore
{
    public function save($key, Session $session)
    {
        try {
            $session->save();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function get($key)
    {
        $session = SessionQuery::create()->findOneById($key);

        if (!$session) {
            return false;
        }

        if ($session->getTime() + $this->getClient()->getConfig()['timeout'] < time()) {
            $session->delete();

            return false;
        }

        return $session;
    }

    public function delete($key)
    {
        if ($this->getClient()->getSession()) {
            $this->getClient()->getSession()->delete();
        }
    }

}