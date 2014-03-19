<?php

namespace Jarves\Twig\Node;

class Unsearchable extends \Twig_Node
{
    public function __construct(\Twig_NodeInterface $body, $lineno, $tag = 'unsearchable')
    {
        parent::__construct(array('body' => $body), array(), $lineno, $tag);
    }

    /**
     * Compiles the node to PHP.
     *
     * @param \Twig_Compiler A Twig_Compiler instance
     */
    public function compile(\Twig_Compiler $compiler)
    {
        $compiler
            ->addDebugInfo($this)
            ->write("ob_start();\n")
            ->subcompile($this->getNode('body'))
            ->write("echo '<!--[jarves-unsearchable]-->' . ob_get_clean() . '<!--[/jarves-unsearchable]-->';\n")
        ;
    }
}