import {registerControllerDecorator} from './angular.ts';
registerControllerDecorator();

//load modules
import './services/Jarves.ts';
import './services/Backend.ts';
import './services/ObjectRepository.ts';
import './services/Translator.ts';
import './services/WindowManagement.ts';
//
//
import './directives/admin/JarvesAdmin.ts';
import './directives/admin/JarvesLogin.ts';
import './directives/admin/JarvesInterface.ts';

import './directives/JarvesWindow.ts';
import './directives/WindowContent.ts';
import './directives/WindowDialog.ts';
import './directives/WindowFrame.ts';
import './directives/WindowSidebar.ts';
import './directives/WindowCombined.ts';
import './directives/WindowList.ts';

import './directives/Button.ts';
import './directives/Icon.ts';
import './directives/InputText.ts';

import './directives/JarvesField.ts';
import './directives/JarvesForm.ts';
import './directives/JarvesFormGroup.ts';
import './directives/JarvesGrid.ts';
import './directives/JarvesGridActions.ts';
import './directives/JarvesLabel.ts';
import './directives/JarvesList.ts';
import './directives/JarvesListItem.ts';
import './directives/JarvesListTemplate.ts';
import './directives/JarvesTabs.ts';
import './directives/JarvesTree.ts';
import './directives/JarvesTreeItem.ts';
import './directives/Layout.ts';
import './directives/LayoutCell.ts';
import './directives/SelectOption.ts';
import './directives/ThFixed.ts';
import './directives/Translate.ts';

import './fields/File.ts';
import './fields/Language.ts';
import './fields/Password.ts';
import './fields/Select.ts';
import './fields/Tab.ts';
import './fields/Text.ts';

import './labels/Checkbox.ts';
import './labels/Date.ts';
import './labels/Datetime.ts';
import './labels/Image.ts';
import './labels/Imagemap.ts';
import './labels/ObjectLabel.ts';
import './labels/Select.ts';
import './labels/Text.ts';

import './filters/ToArray.ts';
import './filters/Translate.ts';


//import {getPreparedConstructor} from './utils.ts';

//window.jarvesModule.directive('ngControllerLoaded', [function() {
//    return {
//        restrict: 'A',
//        scope: true,
//        controller: '@',
//        link: function(){
//            console.log('link ngControllerLoaded');
//        },
//        priority: 1600
//    };
//}]);
//