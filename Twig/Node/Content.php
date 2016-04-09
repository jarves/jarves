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

namespace Jarves\Twig\Node;

use Jarves\ContentRender;

class Content extends \Twig_Node
{
    protected $name;

    public function __construct($name, $id, $type, $optional, $options, $line, $tag = 'content')
    {
        $this->name = $name;

        parent::__construct(
            array('id' => $id, 'type' => $type, 'options' => $options),
            array('optional' => filter_var($optional, FILTER_VALIDATE_BOOLEAN)),
            $line,
            $tag
        );
    }

    /**
     * Compiles the node to PHP.
     *
     * @param \Twig_Compiler A Twig_Compiler instance
     */
    public function compile(\Twig_Compiler $compiler)
    {
        $methodName = 'content' === $this->name ? 'renderSingleSlot' : 'renderSlot';

        $compiler
            ->addDebugInfo($this)
            ->write("\$renderParams = [];\n");

        if (null !== $type = $this->getNode('type')) {
            $compiler
                ->write("\$renderParams['type'] = ")
                ->subcompile($type)
                ->write(";\n");
        }

        if (null !== $options = $this->getNode('options')) {
            $compiler
                ->write("\$renderParams['options'] = ")
                ->subcompile($options)
                ->write(";\n");
        }

        $compiler
            ->write("echo \$context['jarves_content_render']->$methodName(null")
            ->write(', ')->subcompile($this->getNode('id'))
            ->write(', $renderParams')
            ->write(");\n");
        ;
    }
}