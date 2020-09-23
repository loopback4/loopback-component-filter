import { expect } from "@loopback/testlab";
import { juggler } from "@loopback/repository";

import { User } from "./test.model";
import { UserRepository } from "./test.repository";

describe("Create Model", () => {
    let userRepository: UserRepository;
    before(async () => {
        const dataSource = new juggler.DataSource({
            name: "db",
            connector: "memory",
        });

        userRepository = new UserRepository(User, dataSource);
    });

    it("createAll() Test", async () => {
        await userRepository.deleteAll({});

        /**
         * Test createAll
         */
        expect(
            await userRepository.createAll([
                {
                    username: "user1",
                },
                {
                    username: "user2",
                },
            ])
        ).containDeep([
            {
                username: "user1",
            },
            {
                username: "user2",
            },
        ]);
    });

    it("create() Test", async () => {
        await userRepository.deleteAll({});

        /**
         * Test create by entity
         */
        expect(
            await userRepository.create({
                username: "userX",
            })
        ).containDeep(undefined);
    });
});
