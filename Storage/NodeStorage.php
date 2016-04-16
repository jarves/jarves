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

use Jarves\PageStack;

class NodeStorage extends Propel
{
    /**
     * @var PageStack
     */
    protected $pageStack;

    public function setPageStack(PageStack $pageStack)
    {
        $this->pageStack = $pageStack;
    }

    public function populateRow($clazz, $row, $selects, $relations, $relationFields, $permissionCheck = false)
    {
        $row = parent::populateRow($clazz, $row, $selects, $relations, $relationFields, $permissionCheck);
        if ($row) {
            $row['url'] = $this->pageStack->getNodeUrl($row['id']);
        }

        return $row;
    }

}