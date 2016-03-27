jarves.Field
========


A `jarves.field` is a `Jarves Administration Field` which means a field like :

 [ screenshot here ]



Examples:

```javascript
{
    label: 'Name',
    type: 'text',
    require: true
}
```

```javascript
{
    label: 'keywords',
    type: 'array',
    options: {
        fields: {
            keyword: {
                type: 'text'
            }
        }
    }
}
```

```xml
<field id="name" required="true">
    <label>Name</label>
    <type>text</type>
</field>
```


## All Field Types And Options

### Basic Options

 Name            | Type    | Default | Description
-----------------|---------|---------|------------
 `label`         | String  | `''`    | The label.
 `desc`          | String  | `''`    | Shows a grayed description text. __Warning__: This value is set as HTML. So escape `<` and `>`.
 `required`      | Boolean | `false` | Defines if this field needs a valid value.
                 |         |         |
 `needValue`     | mixed   | `null`  | If this value is equal to the parent's value or the value of `againstFields`'s value, then this fields gets visible.
 `againstField`  | string  | `null`  | The id of a other field in the FormField set.
 `default`       | mixed   | `null`  | The default/initial value.
 `startEmpty`    | Boolean | `false` | If this field starts with a empty value (on initialisation).
 `returnDefault` | Boolean | `false` | If this field returns the value even though it's the `default` value (in a form).
                 |         |
 `tableItem`     | Boolean | `false` | If this field injects a `tr`+2x`td` instead of `div`.
 `disabled`      | Boolean | `false` | If this fields is disabled or not.
 `noWrapper`     | Boolean | `false` | If this fields contains a default wrapper div with title, description etc or only the input itself.
 `width`         | mixed   | `null`  | The width of the whole field. Default is `null` and therefore `400px` (defined through css). Use 'auto' to have correct 100% width.
                 |         |
 `help`          | String  | `''`    | Shows a little help icon and points to the given help id.
                 |         |         |
 `withAsteriskIfRequired` | Boolean | `false` | If this fields shows a little `*` if the `required` is true.


## Additional options

All additional options have to be passed through a `options` object.

### `array`

 Name            | Type    | Default | Description
-----------------|---------|---------|------------
 `columns`       | Array   | `[]`    | Example: `[{label: 'Col 1', width: 50}, {label: 'bar'}]]`
 `fields`        | Object  | `{}`    | A object with key-value pairs. The value is a normal jarves.field definition.
 `startWith`     | Integer | `0`     | With how many rows it is initialized.
 `asHash`        | Boolean | `false` | If the result of this field is not a array but a object/hash, indexed by the first `field` value.
 `asArray`       | Boolean | `false` | If this is true, then this returns only a array with the direct value not sub objects. Se below for more information.
 `withOrder`     | Boolean | `false` | If the items can be moved up and down.
 `withoutRemove` | Boolean | `false` | If the items can not be removed, only added.

#### Results

If `asHash` is `true` and `fields` contains exactly two items:
```javascript
{
    valueFromField1: valueFromField2,
    valueFromField1: valueFromField2,
    ...
}
```

If `asHash` is `true` and `fields` contains more than two items:
```javascript
{
    valueFromField1: [field2: valueFromField2, field2: valueFromField3],
    valueFromField1: [field2: valueFromField2, field2: valueFromField3],
    ...
}
```

If `asArray` is `true` and you have only one `fields` item:
```javascript
[
    valueFromField1,
    valueFromField1,
    ...
]
```

If `asArray` is `true` and you more than one `fields` item:
```javascript
[
    [valueFromField1, valueFromField2],
    [valueFromField1, valueFromField2],
    ...
]
```

All other cases:
```javascript
[
    {field1: valueFromField1, field2: valueFromField2},
    {field1: valueFromField1, field2: valueFromField2},
    ...
]
```

Examples:

```javascript
{
    label: 'Names',
    type: 'array',
    options: {
        columns: [
            {label: 'Name', width: '50%'},
            {label: 'Last Name'}
        ],
        fields: {
            name: {
                type: 'text',
                required: true
            },
            lastName: {
                type: 'text'
            }
        }
    }
}
```

__Notice__: In the last example all fields in `fields` are regular jarves.Fields but with the property `noWrapper=true`.