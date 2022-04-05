const assert = require("assert");
const { existsSync, mkdirSync } = require('fs');
const path = require("path");
const Policy = require("../");

if (!existsSync(path.join(__dirname, '/tmp'))) {
  mkdirSync(path.join(__dirname, '/tmp'), { recursive: true })
}

describe("export", () => {
  let policy = Policy.fromFile(path.join(__dirname, "/example.policy.json"));
  let j = policy.toJson();
  it("should generate a valid array", () => {
    assert.ok((j instanceof Array && j[0].rule && (j[0].participants || j[0].participant) && (j[0].resources || j[0].resource) && (j[0].actions || j[0].action)));
  });
  it("should save to file 1", () => {
    assert.ok(!policy.toFile(path.join(__dirname, '/tmp', "/saved.1.policy.json"), true));
  });
  describe("save again", () => {
    it("should save to file 2", () => {
      let policy2 = Policy.fromFile(path.join(__dirname, '/tmp', "/saved.1.policy.json"));
      assert.ok(!policy2.toFile(path.join(__dirname, '/tmp', "/saved.2.policy.json"), true));
    });
  });
});
