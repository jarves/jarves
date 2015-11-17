<?php

namespace Jarves\Configuration;

class Database extends Model
{
    protected $docBlocks = [
        'prefix' => 'All tables will be prefixed with this string. Best practise is to suffix it with a underscore.
    Examples: dev_, domain_ or prod_',
        'protectTables' => 'The ORM we use deletes all tables not related to the objects, so enter here your tables
    which should be excluded from this. One table name per line. (Or better do a database-reverse)'
    ];

    /**
     * @var string
     */
    protected $prefix;

    /**
     * @var Connection[]
     */
    protected $connections;

    /**
     * Returns a writeable/master connection.
     *
     * @return Connection
     */
    public function getMainConnection()
    {
        if (null == $this->connections) {
            $connection = new Connection();
            $this->addConnection($connection);
            return $connection;
        } else {
            foreach ($this->connections as $connection) {
                if (!$connection->isSlave()) {
                    return $connection;
                }
            }
        }
    }

    /**
     * @return Connection[]
     */
    public function getSlaveConnections()
    {
        $result = [];

        if (null !== $this->connections) {
            foreach ($this->connections as $connection) {
                if ($connection->isSlave()) {
                    $result[] = $connection;
                }
            }
        }

        return $result;
    }

    /**
     * @param Connection[] $connections
     */
    public function setConnections(array $connections = null)
    {
        $this->connections = $connections;
    }

    /**
     * @return Connection[]
     */
    public function getConnections()
    {
        return $this->connections;
    }

    public function addConnection(Connection $connection)
    {
        $this->connections[] = $connection;
    }

    /**
     * @return bool
     */
    public function hasSlaveConnection()
    {
        if ($this->connections) {
            foreach ($this->connections as $connection) {
                if ($connection->isSlave()) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * @param string $prefix
     */
    public function setPrefix($prefix)
    {
        $this->prefix = $prefix;
    }

    /**
     * @return string
     */
    public function getPrefix()
    {
        throw new \Exception('Deprecated');
        return $this->prefix;
    }
}