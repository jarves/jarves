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

namespace Jarves\Twig\TokenParser;

use Jarves\Twig\Node\Unsearchable as NodeUnsearchable;

class Unsearchable extends \Twig_TokenParser
{

    public function getTag()
    {
        return 'unsearchable';
    }

    public function parse(\Twig_Token $token)
    {
        $lineno = $token->getLine();

        $this->parser->getStream()->expect(\Twig_Token::BLOCK_END_TYPE);
        $body = $this->parser->subparse(array($this, 'decideUnsearchableEnd'), true);
        $this->parser->getStream()->expect(\Twig_Token::BLOCK_END_TYPE);

        return new NodeUnsearchable($body, $lineno, $this->getTag());
    }

    public function decideUnsearchableEnd(\Twig_Token $token)
    {
        return $token->test('endunsearchable');
    }
}