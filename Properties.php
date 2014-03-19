<?php

namespace Jarves;

/**
 *
 * Properties class to store array information in the database field from type OBJECT.
 *
 */

class Properties
{
    /**
     * @var array
     */

    public $data = array();

    public function __construct($data)
    {
        if (is_string($data)) {
            $this->data = json_decode($data, true);
        } else {
            $this->data = $data;
        }

    }

    /**
     * Returns the data as array.
     *
     * @return array
     */
    public function toArray()
    {
        return $this->data;
    }

    /**
     * Gets the value of $path
     *
     * @param  string $path slash delimited string
     *
     * @return mixed
     */
    public function getByPath($path)
    {
        $path2 = explode('/', $path);

        $data = $this->data;

        foreach ($path2 as $node) {
            if (!isset($data[$node])) {
                return false;
            }
            $data = $data[$node];
        }

        return $data;

    }

    /**
     * Sets the value of $path
     *
     * @param string $path slash delimited string
     * @param mixed  $data
     */
    public function setByPath($path, $data)
    {
        $path2 = explode('/', $path);

        $data2 =& $this->data;

        foreach ($path2 as $node) {
            if (!$data2[$node]) {
                $data2[$node] = array();
            }
            $data2 =& $data2[$node];
        }

        if ($data2) {
            $data2 = $data;
        }

    }

}
