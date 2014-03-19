<?php
//TODO

//namespace Core\Cache;
//
//use Core\Event;
//
//class PHPSessions extends AbstractCache
//{
//    private $tokenId;
//    private $token;
//
//    private $config;
//
//    /**
//     * {@inheritdoc}
//     */
//    public function __construct($config)
//    {
//        $this->config = $config;
//        $this->startSession();
//
//        //since we store don't want to have a second cookie beside our own from ClientAbstract,
//        //we have to listen for token changes and the reset the session_id();
//        Event::listen('core/client/token-changed', array($this, 'startSession'));
//    }
//
//    /**
//     * {@inheritdoc}
//     */
//    public function testConfig($config)
//    {
//        return true;
//    }
//
//    /**
//     * {@inheritdoc}
//     */
//    public function startSession($newSession = null)
//    {
//        if ($this->config['ClientInstance']) {
//            $this->tokenId = $this->config['ClientInstance']->getTokenId();
//            $this->token = $this->config['ClientInstance']->getToken();
//        } else {
//            $this->tokenId = 'phpsession';
//        }
//
//        session_name($this->tokenId);
//
//        if (!$this->token) {
//            return false;
//        }
//
//        session_id($this->token);
//        session_start();
//    }
//
//    /**
//     * {@inheritdoc}
//     */
//    public function doGet($key)
//    {
//        return $_SESSION[$key];
//    }
//
//    /**
//     * {@inheritdoc}
//     */
//    public function doSet($key, $value, $timeout = null)
//    {
//        return ($_SESSION[$key] = $value) ? true : false;
//    }
//
//    /**
//     * {@inheritdoc}
//     */
//    public function doDelete($key)
//    {
//        unset($_SESSION[$key]);
//    }
//}
