
## REST Entry Points for Object Entries ##

**COMPLETELY OBSOLETE, lock in http://yourinstallation/jarves/doc instead!**

Return a list of object entries with the ability to filter.

    GET jarves/admin/object/<objectKey>

        objectKey           (string, required) the object key.

        offset              (integer) the offset.
        limit               (integer) limit the output.
        _<fieldKey>         (mixed) a value where the ORM filter by.


Return a single object entry per primary key.

    GET jarves/admin/object/<objectKey>/<primaryKey>

        objectKey           (string, required) the object key.
        primaryKey           (string, required) primary key string.

        offset              (integer) the offset.
        limit               (integer) limit the output.
        _<fieldKey1>        (mixed) a value where the ORM filters by.
        _<fieldKey2>        "
        _<fieldKeyN>        "


Return a object's root entry per scope.

    GET jarves/admin/object-tree-root/<objectKey>

        objectKey           (string, required) object key.
        scope               (string) primary key of the root entry.


Return a list of all object root entries. Means all possible roots.

    GET jarves/admin/object-roots/<objectKey>

        objectKey           (string, required) object key.


Return a list of all parents incl. the root entry (if the object has a different object as root).

    GET jarves/admin/object-parents/<objectKey>/<primaryKey>

        objectKey           (string, required) object key.
        primaryKey           (string, required) primary key string.

Return the parent of a object entry.

    GET jarves/admin/object-parent/<objectKey>/<primaryKey>

        objectKey           (string, required) object key.
        primaryKey           (string, required) primary key string.




Move a entry of a nested set object.

    PUT jarves/admin/object-move

        object           (string, required) source object url.
        to               (string, required) target object url.
        where            (string, default=`into`) `into`, `below` or `before`.


