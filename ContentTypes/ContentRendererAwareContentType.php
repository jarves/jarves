<?php

namespace Jarves\ContentTypes;

use Jarves\ContentRender;

interface ContentRendererAwareContentType
{
    public function setContentRenderer(ContentRender $contentRender);
}