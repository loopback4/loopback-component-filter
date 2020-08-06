import { expect } from "@loopback/testlab";
import { juggler } from "@loopback/repository";

import { User } from "./test.model";
import { UserRepository } from "./test.repository";

describe("Update Model", async () => {
    const datasource: juggler.DataSource = new juggler.DataSource({
        name: "db",
        connector: "memory",
    });
    const userRepository = new UserRepository(User, datasource);
    await userRepository.create({
        id: "1",
        username: "user1",
        password: "123",
    });

    it("updateAll() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);

        /**
         * Test updateAll by where
         */
        expect(
            await userRepository.updateAll({ username: "userx" })
        ).containDeep({
            count: 2,
        });
        expect(await userRepository.findById("2")).containDeep({
            username: "userx",
            password: undefined,
        });
    });

    it("update() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);

        /**
         * Test update by entity
         */
        await userRepository.update(new User({ id: "2", username: "userx" }));
        expect(await userRepository.findById("2")).containDeep({
            username: "userx",
            password: undefined,
        });
    });

    it("updateById() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);

        /**
         * Test update by id
         */
        await userRepository.updateById("2", { username: "userx" });
        expect(await userRepository.findById("2")).containDeep({
            username: "userx",
            password: undefined,
        });
    });

    it("replaceById() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);

        /**
         * Test replace by id
         */
        await userRepository.replaceById("2", {});
        expect(await userRepository.findById("2")).containDeep({
            username: undefined,
            password: undefined,
        });
    });
});
