<?php

namespace Jarves\Model;

use Jarves\File\FileInfoTrait;
use Jarves\Model\Base\File as BaseFile;
use Propel\Runtime\ActiveQuery\Criteria;
use Jarves\File\FileInfoInterface;
use Propel\Runtime\Map\TableMap;

class File extends BaseFile implements FileInfoInterface
{
    use FileInfoTrait;

    public function getCreatedTime()
    {
        return parent::getCreatedTime();
    }

    public function getModifiedTime()
    {
        return parent::getModifiedTime();
    }

    public function toArray(
        $keyType = null,
        $includeLazyLoadColumns = true,
        $alreadyDumpedObjects = array()
    ) {
        $item = parent::toArray(
            null === $keyType ? TableMap::TYPE_STUDLYPHPNAME : $keyType,
            $includeLazyLoadColumns,
            $alreadyDumpedObjects
        );
        $item['name'] = $this->getName();
        $item['dir'] = $this->getDir();
        $item['icon'] = $this->getIcon();
        $item['extension'] = $this->getExtension();

        return $item;
    }

}
