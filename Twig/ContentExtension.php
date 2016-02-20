<?php

namespace Jarves\Twig;

use Jarves\Jarves;

class ContentExtension extends \Twig_Extension
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

    public function getTokenParsers()
    {
        return array(new TokenParser\Content('content'), new TokenParser\Content('contents'));
    }

    public function getName()
    {
        return 'content';
    }

}