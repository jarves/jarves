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

use Jarves\Client\ClientAbstract;
use Jarves\Configuration\Configs;
use Jarves\Configuration\Object;
use Jarves\JarvesConfig;

class TypeUserPassword extends AbstractType
{
    protected $name = 'UserPassword';

    /**
     * @var JarvesConfig
     */
    private $jarvesConfig;

    /**
     * @param JarvesConfig $jarvesConfig
     */
    public function __construct(JarvesConfig $jarvesConfig)
    {
        $this->jarvesConfig = $jarvesConfig;
    }

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

        $passwordHashKey = $this->jarvesConfig->getSystemConfig()->getPasswordHashKey();
        $data[$this->getFieldDefinition()->getId()] = ClientAbstract::getHashedPassword($this->getValue(), $salt, $passwordHashKey);
    }

    /**
     * {@inheritDocs}
     */
    public function bootRunTime(Object $object, Configs $configs)
    {
    }


}