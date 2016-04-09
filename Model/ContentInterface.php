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

namespace Jarves\Model;

interface ContentInterface
{
    public function getId();
    public function getType();
    public function getContent();
    public function getAccessFromGroups();
    public function getAccessFrom();
    public function getAccessTo();
    public function getUnsearchable();
    public function getTemplate();
    public function toArray();

}