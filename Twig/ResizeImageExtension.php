<?php

namespace Jarves\Twig;

use Jarves\Jarves;

class ResizeImageExtension extends \Twig_Extension
{
    /**
     * @var Jarves
     */
    protected $jarves;

    function __construct(Jarves $jarves)
    {
        $this->jarves = $jarves;
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
        return 'resizeImage';
    }

    public function getFunctions()
    {
        return array(
            'resizeImage' => new \Twig_Function_Method($this, 'resizeImage')
        );
    }

    public function resizeImage($imagePath, $dimension = '100x100')
    {
        if (!$imagePath) return '';

        return '';
    }

}