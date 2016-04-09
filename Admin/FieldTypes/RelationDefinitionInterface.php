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

interface RelationDefinitionInterface
{

    /**
     * @return string
     */
    public function getName();

    /**
     * @return string
     */
    public function getRefName();

    /**
     * The objectKey this relation points to.
     *
     * e.g. jarves/node
     *
     * @return string
     */
    public function getForeignObjectKey();

    /**
     * One of
     *
     * \Jarves\ORM\ORMAbstract::
     *       MANY_TO_ONE = 'nTo1',
     *       ONE_TO_MANY = '1ToN',
     *       ONE_TO_ONE = '1To1',
     *       MANY_TO_MANY = 'nToM';
     *
     * @return string
     */
    public function getType();

    /**
     * @return RelationReferenceDefinitionInterface[]
     */
    public function getReferences();

    /**
     * @return string cascade|setnull|restrict|none
     */
    public function getOnDelete();

    /**
     * @return string cascade|setnull|restrict|none
     */
    public function getOnUpdate();

    /**
     * @return boolean
     */
    public function getWithConstraint();
}
