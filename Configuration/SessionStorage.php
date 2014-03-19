<?php

namespace Jarves\Configuration;

class SessionStorage extends Model
{
    protected $docBlock = '
        A class that handles the actual data storage.

        class: The full classname of the storage. MUST have `Core\Cache\CacheInterface` as interface.
        Define `database` for the database storage.
    ';

    protected $attributes = ['class'];

    /**
     * @var string
     */
    protected $class = 'Jarves\Client\StoreDatabase';

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
     * @param string $class
     */
    public function setClass($class)
    {
        $this->class = $class;
    }

    /**
     * @return string
     */
    public function getClass()
    {
        return $this->class;
    }

}