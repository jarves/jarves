<?php

namespace Jarves\Tests\REST;

use Jarves\Tests\KernelAwareTestCase;
use Test\Model\Item;
use Test\Model\ItemQuery;

class BasicTest extends KernelAwareTestCase
{
    public function setUp()
    {
        parent::setUp();

        $this->login();
    }

    public function testBasics()
    {
        $loggedIn = $this->restCall('/jarves/admin/logged-in');
        $this->assertTrue($loggedIn['data'], 'we are logged in.');

        $response = $this->call('/jarves');

        $this->assertNotEmpty($response);

        $this->assertContains('Jarves cms Administration', $response, "we got the login view.");

        $this->assertContains('window._session = {"userId":1', $response, "we're logged in.");
    }

    public function testSettings()
    {
        $result = $this->restCall('/jarves/admin/backend/settings?lang=en');
        $this->assertInternalType('array', $result);

        $this->assertEquals(200, $result['status']);
    }

    public function testListing()
    {
        $response = $this->restCall('/jarves/object/jarves/node/');

        $this->assertEquals(200, $response['status']);
        $this->assertGreaterThanOrEqual(14, count($response['data']), "we have at least 14 nodes from the installation script.");

        ItemQuery::create()->deleteAll();

        $response = $this->restCall('/jarves/object/test/item/');

        $this->assertEquals(200, $response['status']);
        $this->assertNull($response['data'], 'if we have no items, we should get NULL.');

        $item1 = new Item();
        $item1->setTitle('Item 1');
        $item1->save();

        $item2 = new Item();
        $item2->setTitle('Item 2');
        $item2->save();
        $id2 = $item2->getId();

        $response = $this->restCall('/jarves/object/test/item/');

        $this->assertEquals(200, $response['status']);
        $this->assertEquals(2, count($response['data']));

        $response = $this->restCall('/jarves/object/test/item/' . $id2);

        $this->assertEquals(200, $response['status']);
        $this->assertEquals($id2, $response['data']['id']);
    }

    /**
     * @group test
     */
    public function testUpdating()
    {
        ItemQuery::create()->deleteAll();

        $item1 = new Item();
        $item1->setTitle('Item 1');
        $item1->save();
        $id = $item1->getId();

        $response = $this->restCall('/jarves/object/test/item/' . $id . '?fields=title');
        $this->assertEquals('Item 1', $response['data']['title']);

        $item = $this->getJarves()->getObjects()->get('test/item', $id);

        $response = $this->restCall(
            '/jarves/object/test/item/' . $id,
            'PUT',
            array(
                 'title' => 'Item 1 modified'
            )
        );

        $this->assertEquals(200, $response['status']);
        $this->assertTrue($response['data']);

        //did we really store the new value?
        $response = $this->restCall('/jarves/object/test/item/' . $id);
        $this->assertEquals('Item 1 modified', $response['data']['title']);
    }

    public function testDelete()
    {
        ItemQuery::create()->deleteAll();

        $item1 = new Item();
        $item1->setTitle('Item 1');
        $item1->save();
        $id = $item1->getId();

        $response = $this->restCall('/jarves/object/test/item/' . $id);
        $this->assertEquals('Item 1', $response['data']['title']);

        $response = $this->restCall('/jarves/object/test/item/' . $id, 'DELETE');

        $this->assertEquals(200, $response['status']);
        $this->assertTrue($response['data']);

        //did we really delete it?
        $response = $this->restCall('/jarves/object/test/item/' . $id);
        $this->assertNull($response['data']);
    }

    public function testAdd()
    {
        ItemQuery::create()->deleteAll();

        $item1 = new Item();
        $item1->setTitle('Item 1');
        $item1->save();
        $id = $item1->getId();

        $response = $this->restCall('/jarves/object/test/item/' . $id);
        $this->assertEquals('Item 1', $response['data']['title']);

        $response = $this->restCall(
            '/jarves/object/test/item/',
            'POST',
            array(
                 'title' => 'Item 2'
            )
        );

        $this->assertEquals(200, $response['status']);
        $this->assertEquals($id + 1, $response['data']['id'] + 0);

        //did we really inserted it?
        $response = $this->restCall('/jarves/object/test/item/' . $response['data']['id']);
        $this->assertEquals($id + 1, $response['data']['id'] + 0);

    }

}
