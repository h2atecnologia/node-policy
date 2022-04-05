const assert = require("assert");
const path = require("path");
const Policy = require("../");

describe("parser", () => {
  let policy = Policy.fromFile(path.join(__dirname, "/example.policy.json"));
  it("should load w/no error", () => {
    assert.ok(!(policy instanceof Error));
  });
  if (policy instanceof Policy) {
    it("...and validate policy", () => {
      assert.ok(policy.isAllowed("customer", "bb:cars", "buy"));
    });
  }
});
