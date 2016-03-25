<?php

namespace Jarves\Admin\FieldTypes;

use Jarves\Configuration\Object;
use Jarves\Configuration\Configs;
use Jarves\ORM\ORMAbstract;

class TypePageContents extends AbstractSingleColumnType
{
    protected $name = 'Page Contents';

    /**
     * @return array
     */
    public function getSelection()
    {
        return [$this->getFieldDefinition()->getId().'.*', 'layout', 'theme'];
    }

    public function getColumns()
    {
        return [];
    }

    public function bootRunTime(Object $object, Configs $configs)
    {
        if (!$object->hasRelation($this->getFieldDefinition()->getId())) {

            $relation = new RelationDefinition();
            $relation->setName($this->getFieldDefinition()->getId());
            $relation->setType(ORMAbstract::ONE_TO_MANY);
            $relation->setForeignObjectKey('jarves/content');
            $relation->setRefName($object->getId());

            $object->addRelation($relation);
            $configs->addReboot('Added auto relation because of PageContents type.');

        }
    }
}