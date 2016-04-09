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

namespace Jarves\Tests\REST;

use Jarves\Model\NodeQuery;
use Jarves\Tests\KernelAwareTestCase;

class NestedTest extends KernelAwareTestCase
{
    public function setUp()
    {
        parent::setUp();
        $this->login();
    }

    public function testNestedMultipleAdd()
    {

        $blog = NodeQuery::create()->findOneByTitle('Blog');

        $post = array(
            'visible' => true,
            '_items' => [
                ['title' => 'Rest Nested Test', 'type' => 0, 'urn' => 'nested-test', 'layout' => '@JarvesDemoThemeBundle.jarvesDemoTheme/layout_default.tpl']
            ],
            '_multiple' => true,
            '_position' => 'next',
            '_pk' => ['id' => $blog->getId()],
            '_targetObjectKey' => 'jarves/node'
        );

        $response = $this->restCall('/jarves/object/jarves/node/:multiple', 'POST', $post);

        $this->assertEquals(200, $response['status']);
        $this->assertGreaterThan(1, $response['data'][0]['id']);

        $id = $response['data'][0]['id'];

        $item = NodeQuery::create()->findPk($id);

        $this->assertGreaterThan(0, $item->getLft());
        $this->assertGreaterThan(0, $item->getRgt());
        $this->assertGreaterThan(0, $item->getLevel());

        $item->delete();
    }

    public function testNestedMultipleAddTwo()
    {

        $blog = NodeQuery::create()->findOneByTitle('Blog');

        $post = array(
            'visible' => true,
            '_items' => [
                ['title' => 'Rest Nested Test 1', 'type' => 0, 'urn' => 'nested-test', 'layout' => '@JarvesDemoThemeBundle.jarvesDemoTheme/layout_default.tpl'],
                ['title' => 'Rest Nested Test 2', 'type' => 0, 'urn' => 'nested-test', 'layout' => '@JarvesDemoThemeBundle.jarvesDemoTheme/layout_default.tpl']
            ],
            '_multiple' => true,
            '_position' => 'next',
            '_pk' => ['id' => $blog->getId()],
            '_targetObjectKey' => 'JarvesBundle:Node'
        );

        $response = $this->restCall('/jarves/object/jarves/node/:multiple', 'POST', $post);

        $this->assertEquals(200, $response['status']);
        $this->assertGreaterThan(1, $response['data'][0]['id']);
        $this->assertGreaterThan(1, $response['data'][1]['id']);

        $id = $response['data'][0]['id'];
        $id2 = $response['data'][1]['id'];

        $item = NodeQuery::create()->findPk($id);
        $item2 = NodeQuery::create()->findPk($id2);

        $this->assertGreaterThan(0, $item->getLft());
        $this->assertGreaterThan(0, $item->getRgt());
        $this->assertGreaterThan(0, $item->getLevel());

        $this->assertGreaterThan(0, $item2->getLft());
        $this->assertGreaterThan(0, $item2->getRgt());
        $this->assertGreaterThan(0, $item2->getLevel());

        $item->delete();
        $item2->delete();
    }

}