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

namespace Tests\Object;

use Jarves\Model\Domain;
use Jarves\Model\DomainQuery;
use Jarves\Model\NodeQuery;
use Jarves\Tests\KernelAwareTestCase;

class CreateTest extends KernelAwareTestCase
{
    protected $nodePk = null;

    public function testObject()
    {
        $this->getObjects()->clear('test/test');

        //check empty
        $count = $this->getObjects()->getCount('test/test');
        $this->assertEquals(0, $count);

        //new object
        $values = array('name' => 'Hallo "\'Peter, ✔');
        $pk = $this->getObjects()->add('test/test', $values);

        //check if inserted correctly
        $this->assertArrayHasKey('id', $pk);
        $this->assertGreaterThan(0, $pk['id']);

        //get through single value pk and check result
        $item = $this->getObjects()->get('test/test', $pk['id']);
        $this->assertGreaterThan(0, $item['id']);
        $this->assertEquals($values['name'], $item['name']);

        //get through array pk and check result
        $item = $this->getObjects()->get('test/test', $pk);
        $this->assertGreaterThan(0, $item['id']);
        $this->assertEquals($values['name'], $item['name']);

        //check count
        $count = $this->getObjects()->getCount('test/test');
        $this->assertGreaterThan(0, $count);

        //remove
        $this->getObjects()->remove('test/test', $pk);

        //check empty
        $count = $this->getObjects()->getCount('test/test');
        $this->assertEquals(0, $count);
    }

    /**
     * @group test
     */
    public function testAdd()
    {
        $date = ('+'. rand(2, 30) . ' days +' . rand(2, 24) . ' hours');
        $values = array(
            'title' => 'News item',
            'intro' => [
                [
                    'type' => 'text',
                    'content' => 'Lorem ipsum'
                ]
            ],
            'newsDate' => strtotime($date),
            'lang' => 'en'
        );
        $pk = $this->getObjects()->add('JarvesPublicationBundle:News', $values);

        $item = $this->getObjects()->get('JarvesPublicationBundle:News', $pk);

        $this->assertEquals($values['title'], $item['title']);

        $intro = $item['intro'][0];
        $this->assertEquals($intro['content'], $item['intro'][0]['content']);
        $this->assertEquals($intro['type'], $item['intro'][0]['type']);
        $this->assertGreaterThan(0, $intro['id']);
        $this->assertEquals($item['id'], $intro['foreignId']);

        $this->assertEquals($values['newsDate'], $item['newsDate']);
        $this->assertEquals($values['lang'], $item['lang']);

        $this->assertTrue($this->getObjects()->remove('JarvesPublicationBundle:News', $pk));

        $this->assertNull($this->getObjects()->get('JarvesPublicationBundle:News', $pk));
    }

    protected function getNewNodeItem()
    {
        $domain = DomainQuery::create()->findOne();

        $values = array(
            'title' => 'Test page',
            'domain' => $domain->getId(),
            'type' => 0,
            'urn' => 'nothing'
        );

        $pk = $this->getObjects()->add(
            'jarves/node',
            $values,
            $domain->getId(),
            'first',
            'jarves/domain'
        );
        return $this->nodePk = $pk;
    }

    public function testPatch()
    {
        $nodePk = $this->getNewNodeItem();

        $ori = clone NodeQuery::create()->findOneById($nodePk['id']);
        $this->getObjects()->patch('jarves/node', $nodePk, [
            'title' => 'Test page changed'
        ]);

        $node = NodeQuery::create()->findOneById($nodePk['id']);
        $this->assertEquals('Test page changed', $node->getTitle());
        $this->assertEquals($ori->getDomainId(), $node->getDomainId());
    }

    /**
     * @group test
     */
    public function testPatchDomain()
    {
        $newDomain = new Domain();
        $newDomain->setPath('/');
        $newDomain->setDomain('testDomainName');
        $newDomain->setTheme('defaultTheme');
        $newDomain->save();

        $patched = $this->getObjects()->patch('jarves/domain', $newDomain->getId(), [
            'domain' => 'testdomain.tld',
            'theme' => 'coreLayouts'
        ]);

        $this->assertTrue($patched);

        $domain = DomainQuery::create()->findOneById($newDomain->getId());
        $this->assertEquals('testdomain.tld', $domain->getDomain());
        $this->assertEquals('coreLayouts', $domain->getTheme());
        $newDomain->delete();
    }

    public function tearDown()
    {
        if ($this->nodePk) {
            NodeQuery::create()->filterById($this->nodePk['id'])->delete();
        }
    }
}
