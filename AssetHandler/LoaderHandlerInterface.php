<?php

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