# loopback-component-filter

[![Build Status](https://travis-ci.com/loopback4/loopback-component-filter.svg?branch=master)](https://travis-ci.com/loopback4/loopback-component-filter)

Using this simple extension you can filter models in repository level.

---

## Installation

```bash
npm i --save loopback-component-filter
```

---

## Usage

### Filter Repository Mixin

Change your repository parent class from `DefaultCrudRepository` to `FilterCrudRepositoryMixin(configs)()`

#### Example

Change your repository from:

```ts
export class UserRepository extends DefaultCrudRepository<
    User,
    typeof User.prototype.id,
    UserRelations
> {
    // ...
}
```

To:

```ts
import { FilterCrudRepositoryMixin } from "loopback-component-filter";

export class UserRepository extends FilterCrudRepositoryMixin<
    User,
    string,
    UserRelations
>({
    id: "id",
    where: async (
        context,
        where
    ) => where;
    fields: async (
        context,
        fields
    ) => fields;
})() {
    // ...
}
```

---

## Contributions

-   [KoLiBer](https://www.linkedin.com/in/mohammad-hosein-nemati-665b1813b/)

## License

This project is licensed under the [MIT license](LICENSE).  
Copyright (c) KoLiBer (koliberr136a1@gmail.com)
