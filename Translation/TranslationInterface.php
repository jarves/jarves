<?php

namespace Jarves\Translation;

interface TranslationInterface {

    public function t($id, $plural = null, $count = 0, $context = null);
    public function tc($context, $id, $plural = null, $count = 0);
}