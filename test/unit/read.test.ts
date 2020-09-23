import { expect } from "@loopback/testlab";
import { juggler } from "@loopback/repository";

import { User } from "./test.model";
import { UserRepository } from "./test.repository";

describe("Read Model", () => {
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

    it("find() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);

        /**
         * Test find by where
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
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);

        /**
         * Test findOne by where
         */
        expect(
            await userRepository.findOne({
                where: { username: { inq: ["user1", "user2"] } },
            })
        ).containDeep({
            username: "user2",
            password: undefined,
        });
    });

    it("findById() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);

        /**
         * Test find by id
         */
        expect(await userRepository.findById("2")).containDeep({
            username: "user2",
            password: undefined,
        });
    });

    it("count() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);

        /**
         * Test count by where
         */
        expect(await userRepository.count()).containDeep({
            count: 2,
        });
    });

    it("exists() Test", async () => {
        await userRepository.deleteAll({});
        await userRepository.createAll([
            { id: "2", username: "user2", password: "231" },
            { id: "3", username: "user3", password: "321" },
        ]);

        /**
         * Test exists by id
         */
        expect(await userRepository.exists("1")).equal(false);
        expect(await userRepository.exists("2")).equal(true);
    });
});
