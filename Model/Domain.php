<?php

namespace Jarves\Model;

use Jarves\Model\Base\Domain as BaseDomain;

class Domain extends BaseDomain
{
    /**
     * We use this var to generate all absolute urls, since it's possible
     * to access the site through aliases.
     *
     * @var string
     */
    private $realDomain;

    /**
     *
     * @param string $pRealDomain
     */
    public function setRealDomain($pRealDomain)
    {
        $this->realDomain = $pRealDomain;
    }

    /**
     * @return string
     */
    public function getRealDomain()
    {
        return $this->realDomain;
    }

    /**
     * Returns the full url, with http/s, hostname and language prefix.
     *
     * @param  boolean $pSSL
     *
     * @return string
     */
    public function getUrl($pSSL = null)
    {
        if ($pSSL === null) {
//            $pSSL = \Jarves\Jarves::$ssl;
        }

        $url = $pSSL ? 'https://' : 'http://';

        if ($domain = $this->getRealDomain()) {
            $url .= $domain;
        } else {
            $url .= $this->getDomain();
        }

        if ($this->getMaster() != 1) {
            $url .= '/' / $this->getLang();
        }

        return $url . '/';
    }
}
