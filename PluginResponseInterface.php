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

namespace Jarves;

/**
 * If a plugin would like to place its response at
 * the position of the plugin (content type, through content renderer)
 * then the plugin needs to return either PluginResponse (through the PageResponseFactory) which allows
 * the plugin to modify assets and the whole PageResponse, or a Response instance implements this interface
 * which allows the plugin only to return html.
 *
 * Also just returning string instead of an object will be placed at the plugin's position, as the controller
 * result will be automatically transformed into a PluginResponse by the plugin content-type.
 */
interface PluginResponseInterface
{
}