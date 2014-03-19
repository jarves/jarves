<?php

namespace Jarves\AssetHandler;

interface LoaderHandlerInterface
{

    /**
     * @param AssetInfo[] $assetsInfo
     * @param bool $concatenation
     * @return string
     */
    public function getTags(array $assetsInfo = array(), $concatenation = false);
}