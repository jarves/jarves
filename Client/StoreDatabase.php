<?php

namespace Jarves\Client;

use Jarves\Model\Session;
use Jarves\Model\SessionQuery;

class StoreDatabase extends AbstractStore
{
    public function save($key, Session $session)
    {
        try {
            $session->save();
//            Jarves::setPropelCacheObject('\Users\Models\Session', $session->getId(), $session);
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
//            Jarves::removePropelCacheObject('\Users\Models\Session', $key);
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