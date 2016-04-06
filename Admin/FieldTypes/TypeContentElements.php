<?php

namespace Jarves\Admin\FieldTypes;

use Jarves\Configuration\Configs;
use Jarves\Configuration\Field;
use Jarves\Configuration\Object;
use Jarves\Exceptions\ModelBuildException;
use Jarves\Storage\AbstractStorage;
use Jarves\Tools;

class TypeContentElements extends AbstractType
{
    protected $name = 'Contents Elements';

    /**
     * @return array
     */
    public function getSelection()
    {
        return [$this->getFieldDefinition()->getId() . '.*'];
    }

    public function getColumns()
    {
        return [];
    }

    public function bootRunTime(Object $object, Configs $configs)
    {
        $contentsObjectName = $object->getId() . ucfirst($this->getFieldDefinition()->getId());
        $contentsObject = $object->getBundle()->getObject($contentsObjectName);

        if (!$contentsObject) {
            $contentsObject = new Object();
            $contentsObject->setId($contentsObjectName);
            $contentsObject->setWorkspace(true);

            $contentsObject->setNested(true);
            $contentsObject->setNestedRootAsObject(true);
            $contentsObject->setNestedRootObject($object->getKey());
            $contentsObject->setNestedRootObjectField('foreignId');

            $contentsObject->setTable(
                $object->getTable() . '_' . Tools::camelcase2Underscore($this->getFieldDefinition()->getId())
            );
            $contentsObject->setStorageService($object->getStorageService());
        }

        $fields = [
            'id' => ['type' => 'number', 'autoIncrement' => true, 'primaryKey' => true],
            'foreignId' => ['type' => 'number'],
            'slotId' => ['type' => 'number'],
            'sort' => ['type' => 'number'],
            'content' => ['type' => 'textarea'],
            'template' => ['type' => 'view'],
            'type' => ['type' => 'text'],
            'hide' => ['type' => 'checkbox'],
            'unsearchable' => ['type' => 'checkbox'],
            'access_from' => ['type' => 'datetime'],
            'access_to' => ['type' => 'datetime'],
            'access_from_groups' => ['type' => 'text'],
        ];

        foreach ($fields as $k => $def) {
            if (!$contentsObject->getField($k)) {
                $def['id'] = $k;
                $field = new Field($def, $object->getJarves());
                $contentsObject->addField($field);
                $configs->addReboot(sprintf('[ContentElements] Added field %s to %s', $k, $contentsObject->getKey()));
            }
        }

        if (!$contentsObject->hasRelation('ForeignObject')) {
            $relation = new RelationDefinition();
            $relation->setName('ForeignObject');
            $relation->setType(AbstractStorage::MANY_TO_ONE);
            $relation->setForeignObjectKey($object->getKey());
            $relation->setRefName(ucfirst($this->getFieldDefinition()->getId()));

            $reference = new RelationReferenceDefinition();

            $primaryFields = $object->getPrimaryKeys();
            if (1 < count($primaryFields)) {
                throw new ModelBuildException(sprintf(
                    'FieldType `ContentElements` can not be used on the object `%s` with composite PrimaryKey',
                    $object->getId()
                ));
            }
            if (0 === count($primaryFields)) {
                throw new ModelBuildException(sprintf(
                    'FieldType `ContentElements` can not be used on the object `%s` with no PrimaryKey',
                    $object->getId()
                ));
            }
            $columns = $primaryFields[0]->getFieldType()->getColumns();
            if (1 < count($columns)) {
                throw new ModelBuildException(sprintf(
                    'FieldType `ContentElements` can not be used on the object `%s` with composite PrimaryKey',
                    $object->getId()
                ));
            }
            $reference->setForeignColumn($columns[0]);

            $field = $contentsObject->getField('foreignId');
            $columns = $field->getFieldType()->getColumns();

            $reference->setLocalColumn($columns[0]);
            $relation->setReferences([$reference]);

            $contentsObject->addRelation($relation);

            $configs->addReboot(
                sprintf('[ContentElements] Added relation ForeignObject to %s', $contentsObject->getKey())
            );
        }

        if (!$contentsObject->getBundle()) {
            $object->getBundle()->addObject($contentsObject);
        }

        if (!$object->hasRelation($this->getFieldDefinition()->getId())) {
            $relation = new RelationDefinition();
            $relation->setName(ucfirst($this->getFieldDefinition()->getId()));
            $relation->setType(AbstractStorage::ONE_TO_MANY);
            $relation->setForeignObjectKey($contentsObject->getKey());
            $relation->setRefName('ForeignObject');

            $reference = new RelationReferenceDefinition();
            $primaryFields = $object->getPrimaryKeys();
            $columns = $primaryFields[0]->getFieldType()->getColumns();
            $reference->setLocalColumn($columns[0]);

            $field = $contentsObject->getField('foreignId');
            $columns = $field->getFieldType()->getColumns();
            $reference->setForeignColumn($columns[0]);

            $relation->setReferences([$reference]);
            $object->addRelation($relation);

            $configs->addReboot(
                sprintf(
                    '[ContentElements] Added relation %s to %s',
                    ucfirst($this->getFieldDefinition()->getId()),
                    $object->getKey()
                )
            );
        }
    }
}