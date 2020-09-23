# loopback-component-filter

![Travis (.org) branch](https://img.shields.io/travis/loopback4/loopback-component-filter/master)
![npm](https://img.shields.io/npm/v/loopback-component-filter)
![npm bundle size](https://img.shields.io/bundlephobia/min/loopback-component-filter)
![GitHub](https://img.shields.io/github/license/loopback4/loopback-component-filter)

Using this simple extension you can filter models in repository level.

---

## Installation

```bash
npm i --save loopback-component-filter
```

---

## Usage

### Filter Repository Mixin

Change your repository parent class from `DefaultCrudRepository` to `FilterRepositoryMixin(configs)()`

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
import { FilterRepositoryMixin } from "loopback-component-filter";

export class UserRepository extends FilterRepositoryMixin<
    User,
    typeof User.prototype.id,
    UserRelations
>({
    where: async (context, where) => where,
    fields: async (context, fields) => fields,
})<Constructor<DefaultCrudRepository<User, string, UserRelations>>>(
    DefaultCrudRepository
) {
    // ...
}
```

---

## Contributors

-   [KoLiBer](https://www.linkedin.com/in/mohammad-hosein-nemati-665b1813b/)

## License

This project is licensed under the [MIT license](LICENSE.md).  
Copyright (c) KoLiBer (koliberr136a1@gmail.com)
