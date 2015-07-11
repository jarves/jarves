import Jarves from './services/Jarves.js';
import WindowManagement from './services/WindowManagement.js';
import Translator from './services/Translator.js';
import ObjectRepository from './services/ObjectRepository.js';
import Backend from './services/Backend.js';
import angular from './angular.js';
import {registerModuleField, registerModuleDirective, registerModuleFilter, registerModuleLabel} from './utils.js';
import {getPreparedConstructor} from './utils';

var jarvesModule = angular.module('jarves', ['ngAnimate']);
export default jarvesModule;

export function registerField(controller) {
    registerModuleField(jarvesModule, controller);
}

export function registerDirective( controller) {
    registerModuleDirective(jarvesModule, controller);
}

export function registerFilter(controller) {
    registerModuleFilter(jarvesModule, controller);
}

export function registerLabel(controller) {
    registerModuleLabel(jarvesModule, controller);
}

jarvesModule.service('jarves', getPreparedConstructor(Jarves));
jarvesModule.service('windowManagement', getPreparedConstructor(WindowManagement));
jarvesModule.service('translator', getPreparedConstructor(Translator));
jarvesModule.service('objectRepository', getPreparedConstructor(ObjectRepository));
jarvesModule.service('backend', getPreparedConstructor(Backend));

import Button from './directives/Button.js';
import Icon from './directives/Icon.js';
import InputText from './directives/InputText.js';
import JarvesField from './directives/JarvesField.js';
import JarvesForm from './directives/JarvesForm.js';
import JarvesFormGroup from './directives/JarvesFormGroup.js';
import JarvesGrid from './directives/JarvesGrid.js';
import JarvesGridActions from './directives/JarvesGridActions.js';
import JarvesLabel from './directives/JarvesLabel.js';
import JarvesList from './directives/JarvesList.js';
import JarvesListItem from './directives/JarvesListItem.js';
import JarvesListTemplate from './directives/JarvesListTemplate.js';
import JarvesTabs from './directives/JarvesTabs.js';
import JarvesTree from './directives/JarvesTree.js';
import JarvesTreeItem from './directives/JarvesTreeItem.js';
import Layout from './directives/Layout.js';
import LayoutCell from './directives/LayoutCell.js';
import SelectOption from './directives/SelectOption.js';
import ThFixed from './directives/ThFixed.js';
import Translate from './directives/Translate.js';
import Window from './directives/Window.js';
import WindowContent from './directives/WindowContent.js';
import WindowFrame from './directives/WindowFrame.js';
import WindowSidebar from './directives/WindowSidebar.js';
import WindowDialog from './directives/WindowDialog.js';

registerDirective(Button);
registerDirective(Icon);
registerDirective(InputText);
registerDirective(JarvesField);
registerDirective(JarvesForm);
registerDirective(JarvesFormGroup);
registerDirective(JarvesGrid);
registerDirective(JarvesGridActions);
registerDirective(JarvesLabel);
registerDirective(JarvesList);
registerDirective(JarvesListItem);
registerDirective(JarvesListTemplate);
registerDirective(JarvesTabs);
registerDirective(JarvesTree);
registerDirective(JarvesTreeItem);
registerDirective(Layout);
registerDirective(LayoutCell);
registerDirective(SelectOption);
registerDirective(ThFixed);
registerDirective(Translate);
registerDirective(Window);
registerDirective(WindowContent);
registerDirective(WindowFrame);
registerDirective(WindowSidebar);
registerDirective(WindowDialog);

import Text from './fields/Text.js';
import Password from './fields/Password.js';
import File from './fields/File.js';
import Select from './fields/Select.js';
import Language from './fields/Language.js';
import Tab from './fields/Tab.js';

registerField(Text);
registerField(Password);
registerField(File);
registerField(Select);
registerField(Language);
registerField(Tab);

import {default as TextLabel} from './labels/Text.js';
import {default as CheckboxLabel} from './labels/Checkbox.js';
import {default as DateLabel} from './labels/Date.js';
import {default as DatetimeLabel} from './labels/Datetime.js';
import {default as ImageLabel} from './labels/Image.js';
import {default as ObjectLabel} from './labels/ObjectLabel.js';
import {default as SelectLabel} from './labels/Select.js';
registerLabel(TextLabel);
registerLabel(CheckboxLabel);
registerLabel(DateLabel);
registerLabel(DatetimeLabel);
registerLabel(ImageLabel);
registerLabel(ObjectLabel);
registerLabel(SelectLabel);

import ToArray from './filters/ToArray.js';
import TranslateFilter from './filters/Translate.js';
registerFilter(ToArray);
registerFilter(TranslateFilter);

jarvesModule.config(function($provide) {
    $provide.decorator("$controller", ['$delegate', ($delegate) => {
        return function(constructor, locals) {
            if (angular.isString(constructor)) {
                try {
                    var moduleClass = System.get(constructor);
                    if (moduleClass) {
                        var preparedConstructor = getPreparedConstructor(System.get(constructor).default);
                        console.log('es6 module found for ', constructor);
                        constructor = preparedConstructor || System.get(constructor).default;
                    }
                } catch (e){
                }
            }
            return $delegate(constructor, locals);
        };
    }]);
});

console.log('init jarves angular module');