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

namespace Jarves\Storage;

use Jarves\Configuration\Condition;
use Propel\Runtime\ActiveQuery\ModelCriteria;

class LanguageStorage extends Propel
{
    public $objectKey = 'jarves/language';

    protected function modifyCondition(&$condition) {
        if (!$condition) {
            $condition = new Condition(null, $this->jarves);
        }

        $languages = $this->jarves->getSystemConfig()->getLanguages();
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