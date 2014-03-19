<?php

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