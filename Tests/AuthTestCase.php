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
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AuthTestCase extends KernelAwareTestCase
{
    protected $testGroupPk;
    protected $userPk;

    public function setUp()
    {
        parent::setUp();

        UserQuery::create()->filterByUsername('test')->delete();
        GroupQuery::create()->filterByName('TestGroup')->delete();

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
                'email' => 'test@localhost',
                'groups' => [$this->testGroupPk['id']]
            ]
        );
    }

    public function tearDown()
    {
        if (!$this->testGroupPk) {
            return;
        }
        $this->getObjects()->remove('jarves/group', $this->testGroupPk);
        $this->getObjects()->remove('jarves/user', $this->userPk);

        parent::tearDown();
    }
}