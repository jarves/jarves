<?php

namespace Jarves\Configuration;

class Connection extends Model
{
    protected $rootName = 'connection';

    protected $attributes = ['type', 'persistent', 'slave', 'charset'];

    protected $docBlocks = [
        'server' => 'Can be a IP or a hostname. For SQLite enter here the path to the file.',
        'name' => 'The schema/database name'
    ];

    protected $docBlock = '
        type: mysql|pgsql|sqlite (the pdo driver name)
        persistent: true|false (if the connection should be persistent)
        slave: true|false (if the connection is a slave or not (readonly or not))
        charset: \'utf8\'
      ';

    /**
     * @var string
     */
    protected $type = 'mysql';

    /**
     * @var bool
     */
    protected $persistent = false;

    /**
     * @var string
     */
    protected $charset = 'utf8';

    /**
     * @var string
     */
    protected $server;

    /**
     * @var integer
     */
    protected $port;

    /**
     * @var string
     */
    protected $name;

    /**
     * @var string
     */
    protected $username;

    /**
     * @var string
     */
    protected $password;

    /**
     * Defines whether this is a slave and therefore a read-only connection.
     *
     * @var bool
     */
    protected $slave = false;

    public function getDsn($withLogin = false)
    {
        $type = strtolower($this->getType());
        $dsn = $type;

        if ('sqlite' === $dsn) {
            $file = $this->getServer();
            if (substr($file, 0, 1) != '/') {
                $file = realpath($file);
            }
            $dsn .= ':' . $file;
        } else {
            $dsn .= ':host=' . $this->getServer();
            if ($this->getPort()) {
                $dsn .= ';port=' . $this->getPort();
            }
            $dsn .= ';dbname=' . $this->getName();
        }

        if ('sqlite' !== $type && $withLogin) {
            if ($this->getUsername()) {
                $dsn .= ';user=' . $this->getUsername();
            }
            if ($this->getPassword()) {
                $dsn .= ';password=' . urlencode($this->getPassword());
            }
        }

        return $dsn;
    }

    /**
     * @param boolean $persistent
     */
    public function setPersistent($persistent)
    {
        $this->persistent = $this->bool($persistent);
    }

    /**
     * @return boolean
     */
    public function getPersistent()
    {
        return $this->persistent;
    }

    /**
     * @param string $rootName
     */
    public function setRootName($rootName)
    {
        $this->rootName = $rootName;
    }

    /**
     * @return string
     */
    public function getRootName()
    {
        return $this->rootName;
    }

    /**
     * @param string $type
     */
    public function setType($type)
    {
        $this->type = str_replace('pdo_', '', $type);
        if (!$this->type) {
            $this->type = 'mysql';
        }
    }

    /**
     * @return string
     */
    public function getType()
    {
        return $this->type == 'postgresql' ? 'pgsql' : $this->type;
    }

    /**
     * @param string $username
     */
    public function setUsername($username)
    {
        $this->username = $username;
    }

    /**
     * @return string
     */
    public function getUsername()
    {
        return $this->username;
    }

    /**
     * @param string $charset
     */
    public function setCharset($charset)
    {
        $this->charset = $charset;
    }

    /**
     * @return string
     */
    public function getCharset()
    {
        return $this->charset;
    }

    /**
     * @param string $server
     */
    public function setServer($server)
    {
        $this->server = $server;
    }

    /**
     * @return string
     */
    public function getServer()
    {
        return $this->server;
    }

    /**
     * @param string $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param string $password
     */
    public function setPassword($password)
    {
        $this->password = $password;
    }

    /**
     * @return string
     */
    public function getPassword()
    {
        return $this->password;
    }

    /**
     * @param boolean $slave
     */
    public function setSlave($slave)
    {
        $this->slave = $this->bool($slave);
    }

    /**
     * @return boolean
     */
    public function getSlave()
    {
        return $this->slave;
    }

    public function isSlave()
    {
        return true === $this->slave;
    }

    /**
     * @param int $port
     */
    public function setPort($port)
    {
        $this->port = $port;
    }

    /**
     * @return int
     */
    public function getPort()
    {
        return $this->port;
    }

}