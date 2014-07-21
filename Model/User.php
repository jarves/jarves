<?php

namespace Jarves\Model;

use Jarves\Client\ClientAbstract;
use Jarves\Jarves;
use Jarves\Model\Base\User as BaseUser;

class User extends BaseUser
{

    protected $cachedGroupIds;

    /**
     * Converts $password in a hash and set it.
     * If the salt is not already set, this generates one.
     *
     * @param string $password plain password
     *
     */
    public function hashPassword($password)
    {
        $this->setPasswordSalt(ClientAbstract::getSalt());

        $password = ClientAbstract::getHashedPassword($password, $this->getPasswordSalt());

        $this->setPassword($password);
    }

    /**
     * @return string comma separated list of ids
     */
    public function getGroupIds()
    {
        if (null === $this->cachedGroupIds) {
            $userGroups = $this->getUserGroups();

            if (count($userGroups) > 0) {
                $inGroups = [];
                foreach ($userGroups as $group) {
                    $inGroups[] = $group->getGroupsId();
                }
                $this->cachedGroupIds = implode(', ', $inGroups);
            } else {
                $this->cachedGroupIds = '0';
            }
        }

        return $this->cachedGroupIds;
    }
}
