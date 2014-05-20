<?php

namespace Jarves\Admin\FieldTypes;

use Jarves\Client\ClientAbstract;
use Jarves\Configuration\Configs;
use Jarves\Configuration\Object;

class TypeUserPassword extends AbstractType
{
    protected $name = 'UserPassword';

    public function isDiffAllowed()
    {
        return false;
    }

    public function getColumns()
    {
        $actualColumn = new ColumnDefinition();
        $actualColumn->setName($this->getFieldDefinition()->getId());
        $actualColumn->setPhpDataType('string');
        $actualColumn->setSqlDataType('varchar(512)');

        $saltColumn = new ColumnDefinition();
        $saltColumn->setName($this->getFieldDefinition()->getId() . 'Salt');
        $saltColumn->setPhpDataType('string');
        $saltColumn->setSqlDataType('varchar(64)');

        return [
            $actualColumn,
            $saltColumn
        ];
    }

    public function getSelection()
    {
        return [$this->getFieldDefinition()->getId(), $this->getFieldDefinition()->getId() . 'Salt'];
    }

    public function mapValues(array &$data)
    {
        $salt = ClientAbstract::getSalt();
        $data[$this->getFieldDefinition()->getId().'Salt'] = $salt;
        $data[$this->getFieldDefinition()->getId()] = ClientAbstract::getHashedPassword($this->getValue(), $salt);
    }

    /**
     * {@inheritDocs}
     */
    public function bootRunTime(Object $object, Configs $configs)
    {

    }


}