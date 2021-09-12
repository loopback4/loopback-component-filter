# loopback-component-filter

[![Build Status](https://travis-ci.com/loopback4/loopback-component-filter.svg?branch=master)](https://travis-ci.com/loopback4/loopback-component-filter)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Floopback4%2Floopback-component-filter.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Floopback4%2Floopback-component-filter?ref=badge_shield)
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
    models: async (context, entities) => entities,
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


[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Floopback4%2Floopback-component-filter.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Floopback4%2Floopback-component-filter?ref=badge_large)