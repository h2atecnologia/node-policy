const assert = require("assert");
const Policy = require("../");

describe("policy", () => {
  it("should validate simple rules", () => {
    let policy = new Policy();
    policy.allow("customer", "cars", "buy");
    policy.allow("seller", "cars", "buy");
    policy.allow("seller", "cars", "sell");

    assert.ok(policy.isAllowed("customer", "cars", "buy"));
    assert.ok(!policy.isAllowed("customer", "cars", "sell"));
    assert.ok(policy.isAllowed("seller", "cars", "buy"));
    assert.ok(policy.isAllowed("seller", "cars", "sell"));
    assert.ok(!policy.isAllowed("seller", "cars", "destroy"));
    assert.ok(!policy.isAllowed("seller", "vans", "buy"));
  });

  it("should validate array of rules", () => {
    let policy = new Policy();
    policy.allow("customer", "cars", ["buy"]);
    policy.allow("seller", ["cars", "vans"], ["buy", "sell"]);

    assert.ok(policy.isAllowed("customer", "cars", "buy"));
    assert.ok(!policy.isAllowed("customer", "cars", "sell"));
    assert.ok(policy.isAllowed("seller", "cars", "buy"));
    assert.ok(policy.isAllowed("seller", "cars", "sell"));
    assert.ok(!policy.isAllowed("seller", "cars", "destroy"));
    assert.ok(policy.isAllowed("seller", "vans", "buy"));
    assert.ok(!policy.isAllowed("seller", "trucks", "buy"));
  });

  it("should validate wildcards rules", () => {
    let policy = new Policy();

    policy.allow("seller", ["cars"], "*");
    policy.allow("seller", ["vans"], "hit-with-*");

    assert.ok(policy.isAllowed("seller", "cars", "buy"));
    assert.ok(policy.isAllowed("seller", "cars", "sell"));
    assert.ok(policy.isAllowed("seller", "cars", "destroy"));
    assert.ok(policy.isAllowed("seller", "vans", "hit-with-bat"));
    assert.ok(!policy.isAllowed("seller", "vans", "hit-without-bat"));
  });

  it("should validate allow all", () => {
    let policy = new Policy();

    policy.allow("*", "*", "*");

    assert.ok(policy.isAllowed("a", "b", "c"));
  });

  it("should validate allow all with prefixes", () => {
    let policy = new Policy();

    policy.allow("a_*", "b_*", "c_*");

    assert.ok(policy.isAllowed("a_anything", "b_anything", "c_anything"));
    assert.ok(!policy.isAllowed("a_anything", "c_anything", "c_anything"));
  });

  it("should validate various wildcards", () => {
    let policy = new Policy();

    policy.allow("admin_*", "something_*", "hold_*");
    policy.deny("admin_john", "something_*", "hold_it");

    assert.ok(policy.isAllowed("admin_john", "something_abc", "hold_aaa"));
    assert.ok(!policy.isAllowed("admin_john", "something_aaa", "hold_it"));
    assert.ok(!policy.isAllowed("aaa", "bbb", "ccc"));
  });

  it("should prefer deny", () => {
    let policy = new Policy();

    policy.allow("*", "*", "*");
    policy.deny("guest", "secret", "*");

    assert.ok(policy.isAllowed("user", "blah", "read"));
    assert.ok(policy.isAllowed("guest", "blah", "write"));
    assert.ok(!policy.isAllowed("guest", "secret", "any"));
  });

  it("should not allow invalid pattern", () => {
    let policy = new Policy();
    assert.throws(() => {
      policy.allow();
    });
    assert.throws(() => {
      policy.allow("seller", [1], "*");
    });
    assert.throws(() => {
      policy.allow("seller", [undefined], "*");
    });
    assert.throws(() => {
      policy.allow("seller", [null], "*");
    });
  });

  it("should allow valid condition", () => {
    let policy = new Policy();
    policy.allow("guest", "secret1", "testar", {
      "and": [
        {
          ">": [
            {
              "var": "age"
            },
            5
          ]
        },
        {
          "<": [
            {
              "var": "age"
            },
            15
          ]
        }
      ]
    });
    assert.ok(policy.isAllowed("guest", "secret1", "testar", { age: 6 }));
  });

  it("should not allow invalid condition", () => {
    let policy = new Policy();
    policy.allow("guest", "secret1", "testar", {
      "and": [
        {
          ">": [
            {
              "var": "age"
            },
            5
          ]
        },
        {
          "<": [
            {
              "var": "age"
            },
            15
          ]
        }
      ]
    });
    assert.ok(!policy.isAllowed("guest", "secret1", "testar", { age: 26 }));
  });

  it("should allow valid new policies", () => {
    let policy = new Policy();
    // participantPatterns, resourcePatterns, actionPatterns, conditions
    policy.allow("user:salesman:*", "bb:sales:*:pos", ["sales:vender", "sales:ver"]);
    assert.ok(policy.isAllowed("user:salesman:83757575", "bb:sales:*:pos", "sales:vender"));
    assert.ok(policy.isAllowed("user:salesman:83757575", "bb:sales:*:pos", "sales:ver"));
    assert.ok(!policy.isAllowed("user:salesman:83757575", "bb:sales:*:pos", "sales:mexer"));
    assert.ok(policy.isAllowed("user:salesman:83757575", "bb:sales:*:pos", "sales:*"));
    assert.ok(!policy.isAllowed("user:salesman:83757575", "bb:*:*:payment", "sales:*"));

    let policy2 = new Policy();
    policy2.allow("*", "*", ["sales:vender", "sales:ver"]);
    assert.ok(policy2.isAllowed("user:salesman:83757575", "bb:*:*:payment", "sales:ver"));
    assert.ok(!policy2.isAllowed("user:salesman:83757575", "bb:*:*:payment", "sales:xx"));

  });

  describe("append", () => {
    it("should append two policy", () => {
      let policy = new Policy();
      policy.allow("*", "*", "*");
      let policy2 = new Policy();
      policy2.deny("guest", "secret", "*");

      policy.append(policy2);

      assert.ok(policy.isAllowed("user", "blah", "read"));
      assert.ok(policy.isAllowed("guest", "blah", "write"));
      assert.ok(!policy.isAllowed("guest", "secret", "any"));
    });
  });
});
