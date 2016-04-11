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

namespace Jarves\Configuration;

class SessionStorage extends Model
{
    protected $docBlock = '
        A class that handles the actual data storage.

        service: MUST have `Core\Cache\CacheInterface` as interface
    ';

    protected $attributes = ['service'];

    /**
     * @var string
     */
    protected $service = 'jarves.client.store.database';

    /**
     * @var Options
     */
    protected $options;

    /**
     * @param Options $options
     */
    public function setOptions(Options $options = null)
    {
        $this->options = $options;
    }

    public function addOption($key, $value)
    {
        if (null === $this->options) {
            $this->options = new Options();
        }

        $this->options->addOption($key, $value);
    }

    public function getOption($key)
    {
        if (null === $this->options) {
            return null;
        }

        return $this->options->getOption($key);
    }

    /**
     * @return Options
     */
    public function getOptions()
    {
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

}