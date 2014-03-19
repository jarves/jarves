<?php

namespace Jarves\Configuration;

class FilePermission extends Model
{

    protected $rootName = 'file';

    protected $docBlock = '
    Whenever Jarves creates files we try to set the correct permission and file owner.
    Attributes (default):
    groupPermission:    rw|r|empty (rw)
    everyonePermission: rw|r|empty (r)
    disableModeChange:  true|false (false)
    ';

    protected $docBlocks = [
        'groupOwner' => 'The group owner name'
    ];

    protected $attributes = ['groupPermission', 'everyonePermission', 'disableModeChange'];

    /**
     * @var string
     */
    protected $groupPermission = 'rw';

    /**
     * @var string
     */
    protected $everyonePermission = 'r';

    /**
     * @var bool
     */
    protected $disableModeChange = false;

    /**
     * @var string
     */
    protected $groupOwner;

    /**
     * @param string $everyonePermission
     */
    public function setEveryonePermission($everyonePermission)
    {
        $this->everyonePermission = $everyonePermission;
    }

    /**
     * @return string
     */
    public function getEveryonePermission()
    {
        return $this->everyonePermission;
    }

    /**
     * @param string $groupOwner
     */
    public function setGroupOwner($groupOwner)
    {
        $this->groupOwner = $groupOwner;
    }

    /**
     * @return string
     */
    public function getGroupOwner()
    {
        return $this->groupOwner;
    }

    /**
     * @param string $groupPermission
     */
    public function setGroupPermission($groupPermission)
    {
        $this->groupPermission = $groupPermission;
    }

    /**
     * @return string
     */
    public function getGroupPermission()
    {
        return $this->groupPermission;
    }

    /**
     * @param boolean $disableModeChange
     */
    public function setDisableModeChange($disableModeChange)
    {
        $this->disableModeChange = $this->bool($disableModeChange);
    }

    /**
     * @return boolean
     */
    public function getDisableModeChange()
    {
        return $this->disableModeChange;
    }


}