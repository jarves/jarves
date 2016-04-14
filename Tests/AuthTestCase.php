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

namespace Jarves\Tests;

use Jarves\Model\GroupQuery;
use Jarves\Model\UserQuery;
use Propel\Runtime\ActiveQuery\Criteria;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AuthTestCase extends KernelAwareTestCase
{
    protected $testGroupPk;
    protected $userPk;

    public function setUp()
    {
        parent::setUp();

        UserQuery::create()->filterById(1, Criteria::GREATER_THAN)->delete();
        GroupQuery::create()->filterById(1, Criteria::GREATER_THAN)->delete();

        if ($this->testGroupPk) {
            return;
        }

        $this->testGroupPk = $this->getObjects()->add(
            'jarves/group',
            [
                'name' => 'TestGroup'
            ]
        );

        $this->userPk = $this->getObjects()->add(
            'jarves/user',
            [
                'username' => 'test',
                'password' => 'test',
                'activate' => true,
                'email' => 'test@localhost',
                'groups' => [$this->testGroupPk['id']]
            ]
        );

        $user = $this->getObjects()->get('jarves/user', $this->userPk['id']);

        $this->assertEquals(1, count($user['groups']));
        $this->assertEquals($this->testGroupPk['id'], $user['groups'][0]['id']);
    }
}