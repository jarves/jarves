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

namespace Jarves\Twig;

use Jarves\Filesystem\WebFilesystem;
use Jarves\Jarves;

class FileExtension extends \Twig_Extension
{
    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var WebFilesystem
     */
    private $webFilesystem;

    function __construct(Jarves $jarves, WebFilesystem $webFilesystem)
    {
        $this->jarves = $jarves;
        $this->webFilesystem = $webFilesystem;
    }

    /**
     * @return \Jarves\Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
    }

    public function getName()
    {
        return 'file';
    }

    public function getFunctions()
    {
        return array(
            new \Twig_SimpleFunction('resizeImage', [$this, 'resizeImage']),
            new \Twig_SimpleFunction('thumbnail', [$this, 'thumbnail']),
            new \Twig_SimpleFunction('publicUrl', [$this, 'publicUrl']),
        );
    }

    /**
     * @param integer|string $id path or file id
     * @param int            $maxWidth
     * @param int            $maxHeight
     *
     * @return string
     */
    public function resizeImage($id, $maxWidth = 100, $maxHeight = 100, $quality = 8)
    {
        $path = $this->webFilesystem->getPath($id);

        $cachePath = 'cache/rendered-image/' . $path;

        if (false !== $pos = strrpos($cachePath, '.')) {
            $ext = substr($cachePath, $pos);
            $cachePath = substr($cachePath, 0, $pos);

            $cachePath .= '_' . $maxHeight . 'x' . $maxHeight . '.' . $quality . '.' . $ext;
        } else {
            $cachePath .= '_' . $maxHeight . 'x' . $maxHeight . '.' . $quality;
        }

        if (!$this->webFilesystem->has($cachePath)) {
            $image = $this->webFilesystem->getResizeMax($path, $maxWidth, $maxHeight);

            $this->webFilesystem->writeImage($image->getResult(), $cachePath, $quality);
        }

        return $cachePath;
    }

    /**
     * @param integer|string $id path or file id
     * @param int            $maxWidth
     * @param int            $maxHeight
     * @param bool           $resize
     *
     * @return string
     * @internal param int|string $id path or file id
     */
    public function thumbnail($id, $maxWidth = 100, $maxHeight = 100, $quality = 8, $resize = true)
    {
        $path = $this->webFilesystem->getPath($id);
        $cachePath = 'cache/rendered-image/' . ltrim($path, '/');

        if (false !== $pos = strrpos($cachePath, '.')) {
            $ext = substr($cachePath, $pos);
            $cachePath = substr($cachePath, 0, $pos);

            $cachePath .= '_' . $maxHeight . 'x' . $maxHeight . '.' . $quality . $ext;
        } else {
            $cachePath .= '_' . $maxHeight . 'x' . $maxHeight . '.' . $quality;
        }

        if (!$this->webFilesystem->has($cachePath)) {
            $image = $this->webFilesystem->getThumbnail($path, $maxWidth . 'x' . $maxHeight);

            $this->webFilesystem->writeImage($image, $cachePath, $quality);
        }

        return $cachePath;
    }

    /**
     * @param integer|string $id path or file id
     *
     * @return string
     */
    public function publicUrl($id)
    {
        return $this->webFilesystem->getPath($id);
    }

}
