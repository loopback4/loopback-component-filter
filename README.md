# loopback-component-filter

![checks](https://img.shields.io/github/checks-status/loopback4/loopback-component-filter/next)
![npm latest](https://img.shields.io/npm/v/loopback-component-filter/latest)
![npm next](https://img.shields.io/npm/v/loopback-component-filter/next)
![license](https://img.shields.io/github/license/loopback4/loopback-component-filter)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Floopback4%2Floopback-component-filter.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Floopback4%2Floopback-component-filter?ref=badge_shield)

Using this simple extension you can filter models in repository level.

## Installation

Use the package manager [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) to install `loopback-component-filter`.

```bash
npm i --save loopback-component-filter
```

## Usage

Follow these steps to add `Filter` extension to your loopback4 application:

-   Change your repository parent class from `DefaultCrudRepository` to `FilterRepositoryMixin(configs)()`

    ```ts
    // Old
    export class UserRepository extends DefaultCrudRepository<
        User,
        typeof User.prototype.id,
        UserRelations
    > {
        // ...
    }

    // New
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

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

This project is licensed under the [MIT](LICENSE.md).  
Copyright (c) KoLiBer (koliberr136a1@gmail.com)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Floopback4%2Floopback-component-filter.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Floopback4%2Floopback-component-filter?ref=badge_large)
