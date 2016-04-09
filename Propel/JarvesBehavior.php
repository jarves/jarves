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

namespace Jarves\Propel;

use Propel\Generator\Model\Behavior;

class JarvesBehavior extends Behavior
{

    public function queryMethods($builder)
    {
        $this->builder = $builder;
        $script = '';
        $this->addExternalBasePreSelect($script);
        return $script;
    }

    protected function addExternalBasePreSelect(&$script)
    {
        $script .= "
    public function externalBasePreSelect(ConnectionInterface \$con){
        return \$this->basePreSelect(\$con);
    }
";
    }

}