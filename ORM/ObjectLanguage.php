<?php

namespace Jarves\ORM;

use Jarves\Configuration\Condition;
use Propel\Runtime\ActiveQuery\ModelCriteria;

class ObjectLanguage extends Propel
{
    public $objectKey = 'jarves/language';

    protected function modifyCondition(&$condition) {
        if (!$condition) {
            $condition = new Condition(null, $this->getJarves());
        }

        $languages = $this->getJarves()->getSystemConfig()->getLanguages();
        $languages = preg_replace('/\W+/', ',', $languages);
        $languages = explode(',', $languages);

        foreach ($languages as $lang) {
            $condition->addOr(['code', '=', $lang]);
        }
    }

    public function getStm(ModelCriteria $query, Condition $condition = null)
    {
        $this->modifyCondition($condition);
        return parent::getStm($query, $condition);
    }

}