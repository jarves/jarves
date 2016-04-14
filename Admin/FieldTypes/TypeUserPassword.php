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
use Jarves\Model\User;
use Symfony\Component\Security\Core\Encoder\EncoderFactoryInterface;

class TypeUserPassword extends AbstractSingleColumnType
{
    protected $name = 'UserPassword';

    protected $phpDataType = 'string';

    protected $sqlDataType = 'VARCHAR(255)';

    /**
     * @var EncoderFactoryInterface
     */
    private $encoderFactory;

    public function __construct(EncoderFactoryInterface $encoderFactory)
    {
        $this->encoderFactory = $encoderFactory;
    }

    public function isDiffAllowed()
    {
        return false;
    }

    public function getValue()
    {
        if (!parent::getValue()) {
            return null;
        }

        $userClass = $this->getFieldDefinition()->getOption('userClass') ?: User::class;

        $encoder = $this->encoderFactory->getEncoder($userClass);
        return $encoder->encodePassword(parent::getValue(), null);
    }
}