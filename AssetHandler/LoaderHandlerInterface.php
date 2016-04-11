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

namespace Jarves\AssetHandler;

interface LoaderHandlerInterface
{

    /**
     * @param AssetInfo[] $assetsInfos
     * @param bool $concatenation
     * @return string
     */
    public function getTags(array $assetsInfos = array(), $concatenation = false);


    /**
     * Returns true if the order of the scripts should be keep together when minifying.
     *
     * @return boolean
     */
    public function needsGrouping();
}