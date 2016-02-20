
## REST Entry Points for the Window Class ##

**COMPLETELY OBSOLETE, lock in http://yourinstallation/jarves/doc instead!**

`entryPoint` represents the actual path to the entry point the window class is used.

`QS` is `QueryString` and means a argument through `GET`. Example `admin?foo=bar`, `foo` is passed as QS.

Return a list of object entries with the ability to filter.

    GET jarves/admin/<entryPoint>

        `offset`            (QS, integer) the offset.
        `limit`             (QS, integer) limit the output.
        `_<fieldKey>`       (QS, mixed) a value where the ORM filters by.


Return a single object entry per primary key.

    GET jarves/admin/<entryPoint>/<pk>

        `pk`            (string, required) the object url.


Delete a object entry.

    DELETE jarves/admin/<entryPoint>

        `object`            (string, required) the object url.


Add one new object entry or multiple entries.

    POST jarves/admin/<entryPoint>

        `<field1>`          (mixed) Value of field1 of the object.
        `<field2>`          (mixed) Value of field2 of the object.

        _pk                 (array, required if nested set) the target pk where we insert the new entry.
        _position           (string, default is `first`) the target where we insert the new entry.
        _targetObjectKey    (string, default is the window class object)
                            Example:
                            _pk: {
                                id: 23
                            },
                            _position: 'first',
                            _targetObjectKey: 'Core\\Domain'

                            If the object behind this object window has different object as root, then
                            you probably need to pass the `_targetObjectKey` of the root object and the `_pk` of the root entry
                            where the new entry should be added. Then only `first` and `last` are possible as `position`.
                            If you want to add a new entry into/beside a entry of the same object, then you have as
                            `position` all possibilities which are `first` (child), `last` (child), `prev` (sibling)
                            and `next` (sibling). This behaviour of the different root object is implemented usually through
                            propel's `scope` in the `nested set` behaviour. So, it's not possible to pass multiple primary keys
                            as root object.

        `_multiple`         (boolean) if a mass-insertion is used.
        `_items`            (array, required if `_multiple` is true)





list    GET     /admin/<entryPoint>
list    GET     /admin/<entryPoint>/:count
view    GET     /admin/<entryPoint>/123
update  PUT     /admin/<entryPoint>/123
patch   PATCH   /admin/<entryPoint>/123
insert  POST    /admin/<entryPoint>
delete  DELETE  /admin/<entryPoint>/123


//branches
GET     /admin/<entryPoint>/:branch
GET     /admin/<entryPoint>/:children-count
GET     /admin/<entryPoint>/123/branch
GET     /admin/<entryPoint>/123/children-count
PUT     /admin/<entryPoint>/123/move/456?position=&targetObjectKey=

GET     /admin/<entryPoint>/:roots
GET     /admin/<entryPoint>/:root?scope=123
GET     /admin/<entryPoint>/123/parents
GET     /admin/<entryPoint>/123/parent


// global object REST entry points

list    GET     /admin/object/node
int     GET     /admin/object/node/:count
view    GET     /admin/object/node/123
update  PUT     /admin/object/node/123
patch   PATCH   /admin/object/node/123
insert  POST    /admin/object/node
delete  DELETE  /admin/object/node/123


//branches
GET     /admin/object/node/:branch
GET     /admin/object/node/:children-count
GET     /admin/object/node/123/branch
GET     /admin/object/node/123/children-count
PUT     /admin/object/node/123/move/456?position=&targetObjectKey=

GET     /admin/object/node/:roots
GET     /admin/object/node/:root?scope=123
GET     /admin/object/node/123/parents
GET     /admin/object/node/123/parent







