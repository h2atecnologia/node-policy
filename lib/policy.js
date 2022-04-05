// const assert = require("assert");
const readFileSync = require("fs").readFileSync;
const jsonLogic = require("json-logic-js");
const { matcher, isMatch } = require("./matcher");

class Policy {
  constructor() {
    this.rules = [];
  }

  #type(o) {
    return Object.prototype.toString.call(o).match(/\s(\w+)/i)[1].toLowerCase();
  }

  #regexFromPattern(pattern) {
    /*     assert.equal(
          typeof pattern,
          "string",
          `pattern must be string (${typeof pattern} '${pattern}' provided)`
        ); */
    return new RegExp(`${pattern.replace(/\*/, ".*")}`);
  }

  #addRule(rule, participantPatterns, resourcePatterns, actionPatterns, conditions = [undefined]) {
    /*   assert.ok(
        ["allow", "deny"].indexOf(rule) !== -1,
        `rule must be allow or deny ('${rule}' provided)`
      );
      assert.ok(
        participantPatterns,
        `participant pattern must be specified ('${participantPatterns}' provided)`
      );
      assert.ok(
        resourcePatterns,
        `resource pattern must be specified ('${resourcePatterns}' provided)`
      );
      assert.ok(
        actionPatterns,
        `action pattern must be specified ('${actionPatterns}' provided)`
      );
  
      assert.ok(
        conditions,
        `conditions must be specified ('${actionPatterns}' provided)`
      );
   */
    if (!participantPatterns) throw new Error('participant pattern must be specified');
    else if (!Array.isArray(participantPatterns)) participantPatterns = [participantPatterns];

    if (!resourcePatterns) throw new Error('resource pattern must be specified');
    else if (!Array.isArray(resourcePatterns)) resourcePatterns = [resourcePatterns];

    if (!actionPatterns) throw new Error('action pattern must be specified')
    else if (!Array.isArray(actionPatterns)) actionPatterns = [actionPatterns];

    if (!conditions) throw new Error('participant pattern must be specified')
    else if (!Array.isArray(conditions)) conditions = [conditions];

    this.rules.push({
      rule: rule,
      participants: participantPatterns.map(pattern => {
        return this.#regexFromPattern(pattern);
      }),
      resources: resourcePatterns.map(pattern => {
        return this.#regexFromPattern(pattern);
      }),
      actions: actionPatterns.map(pattern => {
        return this.#regexFromPattern(pattern);
      }),
      conditions
    });
  }

  /*
  _isMatch(tests, value) {
    for (let i in tests) {
      const test = tests[i];
      if (test.test(value)) return true;
    }
    return false;
  }
  */

  #isMatch(tests, value) {
    let b;
    if (tests.length > 1) b = isMatch(tests.map((test) => test.source.replace(/.\*/g, '*')), value);
    else b = isMatch(value, tests.map((test) => test.source.replace(/.\*/g, '*')));
    // console.log(tests, value, b);
    return b; // isMatch(tests.map((test) => test.source.replace(/.\*/g, '*')), value);
  }

  // ___isMatch(tests, value) {
  // // const b = isMatch(value, tests.map((test) => test.source.replace(/.\*/g, '*')));
  // //   console.log(value, tests, b);
  // return b; isMatch(value, tests.map((test) => test.source.replace(/.\*/g, '*')));
  //}

  #logic(tests, value) {
    for (let i in tests) {
      const test = tests[i];
      if (test && !value) return false;
      if (test) {
        if (!jsonLogic.apply(test, value)) return false;
      }
    }
    return true;
  }

  /**
  * return: true for allow, false for deny and null if no rule is matched
  */

  #checkRule(rule, participant, resource, action, conditions) {
    if (action === 'sales:*') {
      //  console.log(rule.actions)
      //  console.log(rule.actions[0] instanceof RegExp, rule.actions[0].toString())
    }

    /* ___ */ const p = (action === 'sales:*' ? this.#isMatch(rule.participants, participant) : this.#isMatch(rule.participants, participant));
    const r = (action === 'sales:*' ? this.#isMatch(rule.resources, resource) : this.#isMatch(rule.resources, resource));
    const a = (action === 'sales:*' ? this.#isMatch(rule.actions, action) : this.#isMatch(rule.actions, action));
    //console.log(rule, p, r, a)
    const isMatch =
      p &&
      r &&
      a &&
      this.#logic(rule.conditions, conditions);
    if (isMatch) {
      return rule.rule === "allow";
    }
    return null;
  }

  allow(participantPatterns, resourcePatterns, actionPatterns, conditions) {
    this.#addRule(
      "allow",
      participantPatterns,
      resourcePatterns,
      actionPatterns,
      conditions
    );
  }

  deny(participantPatterns, resourcePatterns, actionPatterns, conditions) {
    this.#addRule(
      "deny",
      participantPatterns,
      resourcePatterns,
      actionPatterns,
      conditions
    );
  }

  // note: denial has preference before allowance
  isAllowed(participant, resource, action, conditions) {
    let isAllowed = false;
    for (let ruleIndex in this.rules) {
      let rule = this.rules[ruleIndex];
      let match = this.#checkRule(rule, participant, resource, action, conditions);
      if (match === true) {
        isAllowed = true;
      } else if (match === false) {
        return false;
      }
    }
    return isAllowed;
  }

  append(policy) {
    /*     assert.ok(
          policy instanceof Policy,
          `appended policy must be instance of Policy ('${typeof policy}' provided)`
        ); */

    this.rules.push(...policy.rules);
  }

  static fromString(source) {
    try {
      const rules = JSON.parse(source);

      // assert.ok(rules instanceof Array, "policy source must be array");

      let pol = new Policy();

      rules.forEach(rule => {
        pol.#addRule(
          rule.rule,
          rule.participants || [rule.participant],
          rule.resources || [rule.resource],
          rule.actions || [rule.action],
          rule.conditions || [rule.conditions]
        );
      });

      return pol;
    } catch (err) {
      return err;
    }
  };

  static fromFile(filepath) {
    try {
      const content = readFileSync(filepath, "utf-8");
      return this.fromString(content);
    } catch (err) {
      return err;
    }
  };

}

module.exports = Policy;
