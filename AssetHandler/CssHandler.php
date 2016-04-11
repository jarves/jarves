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

use Jarves\Filesystem\Filesystem;
use Jarves\Jarves;
use Jarves\Utils;

class CssHandler extends AbstractHandler
{
    /**
     * @var Filesystem
     */
    protected $webFilesystem;

    /**
     * @var Utils
     */
    protected $utils;

    /**
     * CssHandler constructor.
     * @param Jarves $jarves
     * @param Filesystem $webFilesystem
     * @param Utils $utils
     */
    public function __construct(Jarves $jarves, Filesystem $webFilesystem, Utils $utils)
    {
        parent::__construct($jarves);
        $this->webFilesystem = $webFilesystem;
        $this->jarves = $jarves;
        $this->utils = $utils;
    }

    protected function getTag(AssetInfo $assetInfo)
    {
        if ($assetInfo->getPath()) {
            $path = $this->getAssetPath($assetInfo->getPath());
            $pubPath = $this->getPublicAssetPath($assetInfo->getPath());
            if (file_exists($path)) {
                $pubPath .= '?c=' . substr(md5(filemtime($path)),0, 6);
            }
            return sprintf(
                '<link rel="stylesheet" type="text/css" href="%s" >',
                $pubPath
            );
        } else {
            return sprintf(
                <<<EOF
<style type="text/css">
%s
</style>
EOF
                ,
                $assetInfo->getContent()
            );
        }
    }

    public function needsGrouping() {
        return true;
    }

    /**
     * @param AssetInfo[] $assetsInfo
     * @param bool $concatenation
     * @return string
     */
    public function getTags(array $assetsInfo = array(), $concatenation = false)
    {
        $tags = [];

        if ($concatenation) {
            $filesToCompress = [];

            foreach ($assetsInfo as $asset) {
                if ($asset->getPath()) {
                    // load css files, that are not accessible (means those point to a controller)
                    // because those can't be compressed
                    $localPath = $this->getAssetPath($asset->getPath());
                    if (!file_exists($localPath)) {
                        $tags[] = $this->getTag($asset);
                        continue;
                    }
                }

                if ($asset->getContent()) {
                    // load inline assets because we can't compress those
                    $tags[] = $this->getTag($asset);
                    continue;
                }

                if (!$asset->isCompressionAllowed()) {
                    $tags[] = $this->getTag($asset);
                    continue;
                }

                $filesToCompress[] = $asset->getPath();
            }

            if ($filesToCompress) {
                $tags[] = $this->getTag($this->compressFiles($filesToCompress));
            }
        } else {
            foreach ($assetsInfo as $asset) {
                $tags[] = $this->getTag($asset);
            }
        }

        return implode("\n", $tags);
    }

    /**
     * @param array $files
     *
     * @return AssetInfo
     */
    public function compressFiles(array $files)
    {
        $md5String = '';

        foreach ($files as $file) {
            $path = $this->getAssetPath($file);
            $md5String .= '.' . filemtime($path);
        }

        $fileUpToDate = false;
        $md5Line = '/* ' . md5($md5String) . " */\n";

        $oFile = 'cache/compressed-css/' . md5($md5String) . '.css';
        $handle = @fopen($this->getJarves()->getRootDir() . '/../web/' . $oFile, 'r');
        if ($handle) {
            $line = fgets($handle);
            fclose($handle);
            if ($line == $md5Line) {
                $fileUpToDate = true;
            }
        }

        if (!$fileUpToDate) {
            $content = $this->utils->compressCss(
                $files,
                'cache/compressed-css/'
            );
            $content = $md5Line . $content;
            $this->webFilesystem->write($oFile, $content);
        }

        $assetInfo = new AssetInfo();
        $assetInfo->setPath($oFile);

        return $assetInfo;
    }

}