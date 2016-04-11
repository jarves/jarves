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

interface CompileHandlerInterface
{
    /**
     * Compiles a file path to an AssetInfo object.
     *
     * Use $this->resolvePath or $this->resolvePublicPath from AbstractHandler to resolve
     * $assetPath.
     *
     * @param assetInfo $assetInfo might be a symfony path with @ (e.g. @JarvesDemoTheme/base.css.scss)
     * @return AssetInfo[]AssetInfo|null|true null to remove the file from asset list, true to let the asset it the list and don't change anything
     *                             or a new AssetInfo object or a array of AssetInfo[] if the old should be replaced with this one.
     */
    public function compileFile(AssetInfo $assetInfo);
}