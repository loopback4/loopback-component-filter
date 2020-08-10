import { expect } from "@loopback/testlab";
import { juggler } from "@loopback/repository";

import { User } from "./test.model";
import { UserRepository } from "./test.repository";

describe("Delete Model", () => {
    let userRepository: UserRepository;
    before(async () => {
        const dataSource = new juggler.DataSource({
            name: "db",
            connector: "memory",
        });

        userRepository = new UserRepository(User, dataSource);

        await userRepository.create({
            id: "1",
            username: "user1",
            password: "123",
        });
    });

    it("deleteAll() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);

        /**
         * Test deleteAll by where
         */
        expect(await userRepository.deleteAll()).containDeep({
            count: 2,
        });
        expect(await userRepository.findOne({ where: { id: "2" } })).equal(
            null
        );
    });

    it("delete() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);

        /**
         * Test delete by entity
         */
        await userRepository.delete(new User({ id: "2" }));
        expect(await userRepository.findOne({ where: { id: "2" } })).equal(
            null
        );
    });

    it("deleteById() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);

        /**
         * Test delete by id
         */
        await userRepository.deleteById("2");
        expect(await userRepository.findOne({ where: { id: "2" } })).equal(
            null
        );
    });
});
