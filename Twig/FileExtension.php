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
    private $filesystem;

    function __construct(Jarves $jarves, WebFilesystem $filesystem)
    {
        $this->jarves = $jarves;
        $this->filesystem = $filesystem;
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
    public function resizeImage($id, $maxWidth = 100, $maxHeight = 100)
    {
        $path = $this->filesystem->getPath($id);
        $image = $this->filesystem->getResizeMax($path, $maxWidth, $maxHeight);

        //todo

        return '';
    }

    /**
     * @param integer|string $id path or file id
     * @param string $resolution <width>x<height>
     * @param bool   $resize
     *
     * @return string
     * @internal param int|string $id path or file id
     */
    public function thumbnail($id, $resolution, $resize = false)
    {
        $path = $this->filesystem->getPath($id);
        $image = $this->filesystem->getThumbnail($path, $resolution, $resize);

        //todo

        return '';
    }

    /**
     * @param integer|string $id path or file id
     *
     * @return string
     */
    public function publicUrl($id)
    {
        return $this->filesystem->getPath($id);
    }

}
