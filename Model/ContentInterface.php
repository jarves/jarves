<?php

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