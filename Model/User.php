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

use Jarves\Jarves;
use Jarves\Model\Base\User as BaseUser;
use Symfony\Component\Security\Core\User\UserInterface;

class User extends BaseUser implements UserInterface
{
    protected $cachedGroupIds;

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

    public function getGroupIdsArray()
    {
        return explode(',', $this->getGroupIds());
    }

    public function __toString()
    {
        return $this->getUsername();
    }

    /**
     * @param string $role
     * @return boolean
     */
    public function hasRole($role)
    {
        return in_array($role, $this->getRoles());
    }

    /**
     * Return all groups, converted it names to role names.
     *
     * {@inheritdoc}
     */
    public function getRoles()
    {
        $names = GroupQuery::create()
            ->select('Name')
            ->filterByUser($this)
            ->find();

        $result = [];
        foreach ($names as $name) {
            $result[] = preg_replace('/[^a-zA-Z0-9]+/', '_', strtoupper($name));
        }

        return $result;
    }

    /**
     * {@inheritdoc}
     */
    public function getSalt()
    {
        return null;
    }

    /**
     * {@inheritdoc}
     */
    public function eraseCredentials()
    {
        $this->password = null;
    }
}
