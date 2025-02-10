import { Prices } from "./Prices";

describe("Prices array", () => {
  test("Each _id should be unique", () => {
    const ids = Prices.map((price) => price._id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("Each array should define the correct price range", () => {
    Prices.forEach((price) => {
      const [min, max] = price.array;

      // Ensure the array contains two elements
      expect(price.array).toHaveLength(2);

      // Ensure the price range is in the correct order
      expect(min).toBeLessThanOrEqual(max);

      // Ensure the correct range
      switch (price._id) {
        case 0:
          expect(min).toBe(0);
          expect(max).toBe(19);
          break;
        case 1:
          expect(min).toBe(20);
          expect(max).toBe(39);
          break;
        case 2:
          expect(min).toBe(40);
          expect(max).toBe(59);
          break;
        case 3:
          expect(min).toBe(60);
          expect(max).toBe(79);
          break;
        case 4:
          expect(min).toBe(80);
          expect(max).toBe(99);
          break;
        case 5:
          expect(min).toBe(100);
          expect(max).toBe(9999);
          break;
        default:
          throw new Error("Unexpected _id");
      }
    });
  });
});
