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

namespace Jarves\Admin\FieldTypes;

use Jarves\Configuration\Field;
use Jarves\Configuration\Object;
use Jarves\Configuration\Configs;
use Jarves\Storage\AbstractStorage;

class TypePageContents extends AbstractSingleColumnType
{
    protected $name = 'Page Contents';

    /**
     * @return array
     */
    public function getSelection()
    {
        return [$this->getFieldDefinition()->getId() . '.*', 'layout', 'theme'];
    }

    public function getColumns()
    {
        //todo, necessary of another module than jarves/node want to use PageContent.
        return [];
    }

    /**
     * A list of field names that are included additional in ObjectCrud's field list during loading of this field.
     *
     * @return array
     */
    public function getRequiredFields()
    {
        return ['layout', 'theme'];
    }

    public function bootRunTime(Object $object, Configs $configs)
    {
        if (!$object->hasRelation($this->getFieldDefinition()->getId())) {

            $relation = new RelationDefinition();
            $relation->setName($this->getFieldDefinition()->getId());
            $relation->setType(AbstractStorage::ONE_TO_MANY);
            $relation->setForeignObjectKey('jarves/content');
            $relation->setRefName($object->getId());

            $object->addRelation($relation);
            $configs->addReboot('Added auto relation because of PageContents type.');
        }

        if (!$object->hasField('layout')) {
            $field = new Field();
            $field->setId('layout');
            $field->setType('text');

            $object->addField($field);
            $configs->addReboot('PageContents needs `layout` field.');
        }

        if (!$object->hasField('theme')) {
            $field = new Field();
            $field->setId('theme');
            $field->setType('text');

            $object->addField($field);
            $configs->addReboot('PageContents needs `theme field.');
        }
    }
}