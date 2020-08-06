import { expect } from "@loopback/testlab";
import { juggler } from "@loopback/repository";

import { User } from "./test.model";
import { UserRepository } from "./test.repository";

describe("Read Model", () => {
    const datasource: juggler.DataSource = new juggler.DataSource({
        name: "db",
        connector: "memory",
    });
    const userRepository = new UserRepository(User, datasource);

    it("find() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "1", username: "user1", password: "123" },
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);

        /**
         * Test find using where
         */
        expect(
            await userRepository.find({
                where: { username: { inq: ["user1", "user2"] } },
            })
        ).containDeep([
            {
                username: "user2",
                password: undefined,
            },
        ]);
    });

    it("findOne() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "1", username: "user1", password: "123" },
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);
    });

    it("findById() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "1", username: "user1", password: "123" },
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);
    });

    it("count() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "1", username: "user1", password: "123" },
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);
    });

    it("exists() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "1", username: "user1", password: "123" },
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);
    });
});
