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

namespace Jarves\Tests\Jarves;

use Jarves\Model\Acl;
use Jarves\Tests\AuthTestCase;
use Propel\Runtime\Map\TableMap;

class AuthTest extends AuthTestCase
{
    protected $acls;

    public function tearDown()
    {
        if ($this->acls) {
            foreach ($this->acls as $acl) {
                $acl->delete();
            }
        }

        parent::tearDown();
    }

    public function testNewUserLogin()
    {
        $response = $this->restCall('/jarves/admin/login', 'POST', ['username' => 'test', 'password' => 'test']);

        $this->assertInternalType('array', $response['data']);
        $this->assertEquals($this->userPk['id'], $response['data']['userId']);
        $this->assertEquals(false, $response['data']['access']);
    }

    public function testNewValidUserLogin()
    {
        $this->acls[] = $acl = new Acl();
        $acl->toArray();
        $acl->fromArray(
            [
                'object' => 'jarves/entryPoint',
                'targetType' => \Jarves\ACL::TARGET_TYPE_GROUP,
                'targetId' => $this->testGroupPk['id'],
                'sub' => true,
                'mode' => 0,
                'access' => true,
                'constraintType' => 1,
                'constraintCode' => $this->getObjects()->getObjectUrlId('jarves/entryPoint', ['path' => '/admin']),
            ],
            TableMap::TYPE_CAMELNAME
        );
        $acl->save();
        $this->getCacher()->invalidateCache('core/acl');

        $response = $this->restCall('/jarves/admin/login', 'POST', ['username' => 'test', 'password' => 'test']);

        $this->assertInternalType('array', $response['data']);
        $this->assertEquals($this->userPk['id'], $response['data']['userId']);
        $this->assertEquals(true, $response['data']['access']);
    }

}