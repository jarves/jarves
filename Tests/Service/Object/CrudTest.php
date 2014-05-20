<?php

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
        $this->getObjects()->clear('Test\\Test');

        //check empty
        $count = $this->getObjects()->getCount('Test\\Test');
        $this->assertEquals(0, $count);

        //new object
        $values = array('name' => 'Hallo "\'Peter, ✔');
        $pk = $this->getObjects()->add('Test\\Test', $values);

        //check if inserted correctly
        $this->assertArrayHasKey('id', $pk);
        $this->assertGreaterThan(0, $pk['id']);

        //get through single value pk and check result
        $item = $this->getObjects()->get('Test\\Test', $pk['id']);
        $this->assertGreaterThan(0, $item['id']);
        $this->assertEquals($values['name'], $item['name']);

        //get through array pk and check result
        $item = $this->getObjects()->get('Test\\Test', $pk);
        $this->assertGreaterThan(0, $item['id']);
        $this->assertEquals($values['name'], $item['name']);

        //check count
        $count = $this->getObjects()->getCount('Test\\Test');
        $this->assertGreaterThan(0, $count);

        //remove
        $this->getObjects()->remove('Test\\Test', $pk);

        //check empty
        $count = $this->getObjects()->getCount('Test\\Test');
        $this->assertEquals(0, $count);
    }

    public function testAdd()
    {
        $date = ('+'. rand(2, 30) . ' days +' . rand(2, 24) . ' hours');
        $values = array(
            'title' => 'News item',
            'intro' => 'Lorem ipsum',
            'newsDate' => strtotime($date)
        );
        $pk = $this->getObjects()->add('JarvesPublicationBundle:News', $values);

        $item = $this->getObjects()->get('JarvesPublicationBundle:News', $pk);

        $this->assertEquals($values['title'], $item['title']);
        $this->assertEquals($values['intro'], $item['intro']);
        $this->assertEquals($values['newsDate'], $item['newsDate']);

        $this->assertTrue($this->getObjects()->remove('JarvesPublicationBundle:News', $pk));

        $this->assertNull($this->getObjects()->get('JarvesPublicationBundle:News', $pk));
    }

    protected function getNewNodeItem()
    {
        $domain = DomainQuery::create()->findOne();

        $values = array(
            'title' => 'Test page',
            'domain' => $domain->getId(),
            'type' => 0
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
