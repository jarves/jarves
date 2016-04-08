<?php

namespace Jarves;

/**
 * If a plugin would like to place its response at
 * the position of the plugin (content type, through content renderer)
 * then the plugin needs to return either PluginResponse (through the PageResponseFactory) which allows
 * the plugin to modify assets and the whole PageResponse, or SimplePluginResponse, which allows the plugin
 * only to return html.
 */
interface PluginResponseInterface
{
}