import { expect } from "@loopback/testlab";
import { juggler } from "@loopback/repository";

import { User } from "./test.model";
import { UserRepository } from "./test.repository";

describe("Update Model", () => {
    const datasource: juggler.DataSource = new juggler.DataSource({
        name: "db",
        connector: "memory",
    });
    const userRepository = new UserRepository(User, datasource);

    it("updateAll() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "1", username: "user1", password: "123" },
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);
    });

    it("update() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "1", username: "user1", password: "123" },
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);
    });

    it("updateById() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "1", username: "user1", password: "123" },
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);
    });

    it("replaceById() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "1", username: "user1", password: "123" },
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);
    });
});
