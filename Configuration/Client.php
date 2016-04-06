<?php

namespace Jarves\Configuration;

class Client extends Model
{
    protected $docBlock = 'The client session/authorisation/authentication handling.
  Attributes: (default)
    autoStart: true|false (false) If the systems starts always a session for each request and therefore sends for each
                                visitor/request a cookie (if none is delivered).
  ';

    protected $attributes = ['autoStart', 'service'];

    /**
     * @var string
     */
    protected $service = 'jarves.client.jarves_users';

    /**
     * @var bool
     */
    protected $autoStart = false;

    /**
     * @var Options
     */
    protected $options;

    /**
     * @var SessionStorage
     */
    protected $sessionStorage;

    /**
     * @param Options $options
     */
    public function setOptions(Options $options = null)
    {
        $this->options = $options;
    }

    public function setOption($key, $value)
    {
        $this->getOptions()->setOption($key, $value);
    }

    public function getOption($key)
    {
        return $this->getOptions()->getOption($key);
    }

    /**
     * @return Options
     */
    public function getOptions()
    {
        if (null === $this->options) {
            $this->options = new Options(null, $this->getJarves());
        }
        return $this->options;
    }

    /**
     * @param string $service
     */
    public function setService($service)
    {
        $this->service = $service;
    }

    /**
     * @return string
     */
    public function getService()
    {
        return $this->service;
    }

    /**
     * @param SessionStorage $sessionStorage
     */
    public function setSessionStorage(SessionStorage $sessionStorage = null)
    {
        $this->sessionStorage = $sessionStorage;
    }

    /**
     * @return SessionStorage
     */
    public function getSessionStorage()
    {
        if (null === $this->sessionStorage) {
            $this->sessionStorage = new SessionStorage();
        }
        return $this->sessionStorage;
    }

    /**
     * @param boolean $autoStart
     */
    public function setAutoStart($autoStart)
    {
        $this->autoStart = $this->bool($autoStart);
    }

    /**
     * @return boolean
     */
    public function getAutoStart()
    {
        return $this->autoStart;
    }

    /**
     * @return bool
     */
    public function isAutoStart()
    {
        return true === $this->autoStart;
    }


}