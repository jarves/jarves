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

use Jarves\Configuration\Configs;
use Jarves\Configuration\Field;
use Jarves\Configuration\Object;
use Jarves\ORM\Builder\Builder;

interface TypeInterface
{
    /**
     * @return string
     */
    public function getName();

//    /**
//     * Do whatever is needed to setup the build environment correctly.
//     *
//     * Add new objects with relations if a field is a n-to-n relation for example.
//     * This changes won't be saved, but only be used for the model building/schema migration.
//     *
//     * Make sure that this method does only change stuff once, because we call it frequently, depends
//     * if another boot has something changed.
//     *
//     * @param \Jarves\Configuration\Object $object
//     * @param Configs $configs
//     */
//    public function bootBuildTime(Object $object, Configs $configs);

    /**
     * Do whatever is needed to setup the runtime environment correctly.
     * This changes are also used in the model buildTime.
     *
     * e.g. create cross foreignKeys for 1-to-n relations.
     *
     * This changes will be cached.
     *
     * Make sure that this method does only change stuff once, because we call it frequently, depends
     * if another boot has something changed.
     *
     * @param \Jarves\Configuration\Object $object
     * @param Configs $configs
     */
    public function bootRunTime(Object $object, Configs $configs);

    /**
     * @return Field
     */
    public function getFieldDefinition();

    /**
     * @param Field $field
     */
    public function setFieldDefinition(Field $field);

    /**
     * @return \Jarves\Admin\Form\Form
     */
    public function getForm();

    /**
     * @return array
     */
    public function validate();

    /**
     * Returns all columns that are necessary to get this field working.
     *
     * @return ColumnDefinitionInterface[]
     */
    public function getColumns();

    /**
     * Returns the field names to select from the object model as array.
     *
     * @return string[]
     */
    public function getSelection();

    /**
     * @param mixed $value
     */
    public function setValue($value);

    /**
     * @return mixed
     */
    public function getValue();

    /**
     * Maps the internal value to $data.
     *
     * @param array $data
     */
    public function mapValues(array &$data);

	/**
	 * Returns the internal data type that is required for setValue or that is returned by getValue.
	 *
	 * Possible values: integer|float|string|array|bool
	 *
	 * @return string
	 */
	public function getPhpDataType();

    public function isDiffAllowed();

    /**
     * A list of field names that are included additional in ObjectCrud's field list during loading of this field.
     *
     * @return array
     */
    public function getRequiredFields();

}