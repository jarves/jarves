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
        return $this->realDomain ?: $this->getDomain();
    }

    public function setThemeOptions($v)
    {
        return parent::setThemeOptions(json_encode($v));
    }

    public function getThemeOptions()
    {
        if ($v = parent::getThemeOptions()) {
            return json_decode($v, true);
        }

        return null;
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
