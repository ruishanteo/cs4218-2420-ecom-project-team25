import userModel from "./userModel";

const mockUser1 = {
    name: "mockuser",
    email: "email@123.com",
    password: "password123",
    phone: "91234567",
    address: "address",
    answer: "answer1",
}

const mockUser2 = {
    name: "mockuser2",
    email: "email@321.com",
    password: "password321",
    phone: "97654321",
    address: "address",
    answer: "answer2",
}


const users = [ mockUser1, mockUser2];


const mockUser1WithRole = {
    name: "mockuser",
    email: "email@123.com",
    password: "password123",
    phone: "91234567",
    address: "address",
    answer: "answer1",
    role: 1
}

describe("User Model", () => {
    it('should validate a new user with default role 0', async () => {
        const user = new userModel(mockUser1);

        await expect(user.validate()).resolves.toBeUndefined();
        expect(user.role).toBe(0); // Default should be applied
    });


    it('should validate a user with a specified role', async () => {
        const userWithRole = new userModel(mockUser1WithRole);

        await expect(userWithRole.validate()).resolves.toBeUndefined();
    });


    it("should require name", async () => {
        const user = new userModel({ ...mockUser1, name: "" });
        await expect(user.validate()).rejects.toThrow(/Path `name` is required/);
    });

    it("should trim name", async () => {
        const user = new userModel({ ...mockUser1, name: "  mockuser  " });
        await user.validate();
        expect(user.name).toBe("mockuser");
    });

    it("should require email", async () => {
        const user = new userModel({ ...mockUser1, email: "" });
        await expect(user.validate()).rejects.toThrow(/Path `email` is required/);
    });

    it("should validate email format", async () => {
        const user = new userModel({ ...mockUser1, email: "invalidemail" });
        await expect(user.validate()).rejects.toThrow();
    });


    it("should require password", async () => {
        const user = new userModel({ ...mockUser1, password: "" });
        await expect(user.validate()).rejects.toThrow(/Path `password` is required/);
    });


    it("should require phone number", async () => {
        const user = new userModel({ ...mockUser1, phone: "" });
        await expect(user.validate()).rejects.toThrow(/Path `phone` is required/);
    });

    it("should validate phone number format", async () => {
        const user = new userModel({ ...mockUser1, phone: "ww12345" });
        await expect(user.validate()).rejects.toThrow();
    });

    it("should require address", async () => {
        const user = new userModel({ ...mockUser1, address: "" });
        await expect(user.validate()).rejects.toThrow(/Address must be a non-empty object/);
    });

    it("should require answer", async () => {
        const user = new userModel({ ...mockUser1, answer: "" });
        await expect(user.validate()).rejects.toThrow(/Path `answer` is required/);
    });

    }
)