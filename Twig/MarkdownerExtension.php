<?php

namespace Jarves\Twig;

use Jarves\ContentTypes\Markdowner;
use Jarves\PageStack;

class MarkdownerExtension extends \Twig_Extension
{
    /**
     * @var Markdowner
     */
    private $markdowner;

    /**
     * @param Markdowner $markdowner
     */
    function __construct(Markdowner $markdowner)
    {
        $this->markdowner = $markdowner;
    }

    public function getName()
    {
        return 'markdowner';
    }

    /**
     * {@inheritdoc}
     */
    public function getFilters()
    {
        return array(
            new \Twig_SimpleFilter('markdowner', array($this, 'markdown'), array('pre_escape' => 'html', 'is_safe' => array('html'))),
        );
    }

    public function markdown($text)
    {
        return $this->markdowner->transform($text);
    }

}