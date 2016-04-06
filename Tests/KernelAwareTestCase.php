<?php

namespace Jarves\Tests;

use Jarves\Tests\ContainerHelperTrait;
use Symfony\Bundle\FrameworkBundle\Client;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class KernelAwareTestCase extends WebTestCase
{
    use ContainerHelperTrait;

    protected $allCookies;
    protected $container;

    public function setUp()
    {
        static::bootKernel([]);
        $this->container = static::$kernel->getContainer();
    }

    public function login()
    {
        //login as admin
        $loggedIn = $this->restCall('/jarves/admin/logged-in');

        if (!$loggedIn || !$loggedIn['data']) {
            $response = $this->restCall('/jarves/admin/login', 'POST', ['username' => 'admin', 'password' => 'admin']);
            $this->assertTrue(false !== $response['data']);
        }
    }

    protected function getRoot()
    {
        return realpath($this->getKernel()->getRootDir() . '/..') . '/';
    }

    public function restCall($path = '/', $method = 'GET', $postData = null, $failOnError = true)
    {
        $content = $this->call($path, $method, $postData);

        $data = json_decode($content, true);

        if ($failOnError && (!is_array($data) || @$data['error'])) {
            $this->fail(
                "path $path, method: $method:\n" .
                var_export($content, true)
            );
        }

        return !json_last_error() ? $data : $content;
    }

    public function call($path = '/', $method = 'GET', $parameters = [])
    {
        $client = static::createClient();

        $server = [];

        if (!$parameters) {
            $parameters = [];
        }

        if ($this->allCookies) {
            foreach ($this->allCookies as $cookie) {
                $client->getCookieJar()->set($cookie);
            }
        }

        $client->request($method, $path, $parameters, $files = array(), $server);

        $this->allCookies = $client->getCookieJar()->all();

        return $client->getInternalResponse()->getContent();
    }

    /**
     * Creates a Client.
     *
     * @param array $options An array of options to pass to the createKernel class
     * @param array $server  An array of server parameters
     *
     * @return Client A Client instance
     */
    protected static function createClient(array $options = array(), array $server = array())
    {
        if (!static::$kernel || !static::$kernel->getContainer()->has('test.client')) {
            static::bootKernel($options);
        }

        $client = static::$kernel->getContainer()->get('test.client');
        $client->setServerParameters($server);

        return $client;
    }

    public function resetCookies()
    {
        $this->allCookies = null;
    }
}