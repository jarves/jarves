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
     * @param string $passwordHashKey from the system configuration
     *
     */
    public function hashPassword($password, $passwordHashKey)
    {
        $this->setPasswordSalt(ClientAbstract::getSalt());

        $password = ClientAbstract::getHashedPassword($password, $this->getPasswordSalt(), $passwordHashKey);

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
