import {bootstrap}    from 'angular2/platform/browser';
import JarvesAdminComponent from './components/admin/JarvesAdminComponent';

import {enableProdMode} from 'angular2/core';
enableProdMode();

//todo, do here some loops over all bundles and pre-load (inline <script>) all boot.ts of all bundles which have that file

bootstrap(JarvesAdminComponent);