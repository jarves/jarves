import Jarves from './services/Jarves';
import WindowManagement from './services/WindowManagement';
import Translator from './services/Translator';
import ObjectRepository from './services/ObjectRepository';
import Backend from './services/Backend';
import angular from './angular';
import {registerModuleField, registerModuleDirective, registerModuleFilter, registerModuleLabel} from './utils';
import {getPreparedConstructor} from './utils';

var jarvesModule = angular.module('jarves', []);
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

import Button from './directives/Button';
import Icon from './directives/Icon';
import InputText from './directives/InputText';
import JarvesField from './directives/JarvesField';
import JarvesForm from './directives/JarvesForm';
import JarvesFormGroup from './directives/JarvesFormGroup';
import JarvesGrid from './directives/JarvesGrid';
import JarvesLabel from './directives/JarvesLabel';
import JarvesList from './directives/JarvesList';
import JarvesListItem from './directives/JarvesListItem';
import JarvesListTemplate from './directives/JarvesListTemplate';
import Layout from './directives/Layout';
import LayoutCell from './directives/LayoutCell';
import SelectOption from './directives/SelectOption';
import ThFixed from './directives/ThFixed';
import Translate from './directives/Translate';
import Window from './directives/Window';
import WindowContent from './directives/WindowContent';
import WindowFrame from './directives/WindowFrame';
import WindowSidebar from './directives/WindowSidebar';

registerDirective(Button);
registerDirective(Icon);
registerDirective(InputText);
registerDirective(JarvesField);
registerDirective(JarvesForm);
registerDirective(JarvesFormGroup);
registerDirective(JarvesGrid);
registerDirective(JarvesLabel);
registerDirective(JarvesList);
registerDirective(JarvesListItem);
registerDirective(JarvesListTemplate);
registerDirective(Layout);
registerDirective(LayoutCell);
registerDirective(SelectOption);
registerDirective(ThFixed);
registerDirective(Translate);
registerDirective(Window);
registerDirective(WindowContent);
registerDirective(WindowFrame);
registerDirective(WindowSidebar);

import Text from './fields/Text';
import Password from './fields/Password';
import File from './fields/File';
import Select from './fields/Select';
import Language from './fields/Language';

registerField(Text);
registerField(Password);
registerField(File);
registerField(Select);
registerField(Language);

import {default as TextLabel} from './labels/Text';
import {default as CheckboxLabel} from './labels/Checkbox';
import {default as DateLabel} from './labels/Date';
import {default as DatetimeLabel} from './labels/Datetime';
import {default as ImageLabel} from './labels/Image';
import {default as ObjectLabel} from './labels/Object';
import {default as SelectLabel} from './labels/Select';
registerLabel(TextLabel);
registerLabel(CheckboxLabel);
registerLabel(DateLabel);
registerLabel(DatetimeLabel);
registerLabel(ImageLabel);
registerLabel(ObjectLabel);
registerLabel(SelectLabel);

import ToArray from './filters/ToArray';
registerFilter(ToArray);

jarvesModule.config(function($provide) {
    $provide.decorator("$controller", ['$delegate', ($delegate) => {
        return function(constructor, locals) {
            if (angular.isString(constructor)) {
                try {
                    var module = System.get(constructor);
                    if (module) {
                        console.log('es6 module found for ', constructor);
                        constructor = getPreparedConstructor(System.get(constructor).default);
                    }
                } catch (e){
                }
            }
            return $delegate(constructor, locals);
        };
    }]);
});

console.log('init jarves angular module');