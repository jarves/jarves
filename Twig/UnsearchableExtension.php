<?php

namespace Jarves\Twig;

use Jarves\Jarves;
use Jarves\Model\Base\Node;
use Jarves\Twig\TokenParser\Unsearchable;

class UnsearchableExtension extends \Twig_Extension
{
    public function getName()
    {
        return 'unsearchable';
    }

    public function getTokenParsers()
    {
        return array(new Unsearchable());
    }
}