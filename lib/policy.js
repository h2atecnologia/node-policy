const assert = require("assert");
const jsonLogic = require("json-logic-js");

class Policy {
  constructor() {
    this.rules = [];
  }

  #type(o) {
    return Object.prototype.toString.call(o).match(/\s(\w+)/i)[1].toLowerCase();
  }

  _regexFromPattern(pattern) {
    assert.equal(
      typeof pattern,
      "string",
      `pattern must be string (${typeof pattern} '${pattern}' provided)`
    );
    return new RegExp(`${pattern.replace(/\*/, ".*")}`);
  }

  _addRule(rule, participantPatterns, resourcePatterns, actionPatterns, conditions = [undefined]) {
    assert.ok(
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

    if (!Array.isArray(participantPatterns))
      participantPatterns = [participantPatterns];
    if (!Array.isArray(resourcePatterns)) resourcePatterns = [resourcePatterns];
    if (!Array.isArray(actionPatterns)) actionPatterns = [actionPatterns];
    if (!Array.isArray(conditions)) conditions = [conditions];

    this.rules.push({
      rule: rule,
      participants: participantPatterns.map(pattern => {
        return this._regexFromPattern(pattern);
      }),
      resources: resourcePatterns.map(pattern => {
        return this._regexFromPattern(pattern);
      }),
      actions: actionPatterns.map(pattern => {
        return this._regexFromPattern(pattern);
      }),
      conditions
    });
  }

  _isMatch(tests, value) {
    for (let i in tests) {
      const test = tests[i];
      if (test.test(value)) return true;
    }
    return false;
  }

  _logic(tests, value) {
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

  _checkRule(rule, participant, resource, action, conditions) {
    const isMatch =
      this._isMatch(rule.participants, participant) &&
      this._isMatch(rule.resources, resource) &&
      this._isMatch(rule.actions, action) &&
      this._logic(rule.conditions, conditions);
    if (isMatch) {
      return rule.rule === "allow";
    }
    return null;
  }

  allow(participantPatterns, resourcePatterns, actionPatterns, conditions) {
    this._addRule(
      "allow",
      participantPatterns,
      resourcePatterns,
      actionPatterns,
      conditions
    );
  }

  deny(participantPatterns, resourcePatterns, actionPatterns, conditions) {
    this._addRule(
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
      let match = this._checkRule(rule, participant, resource, action, conditions);
      if (match === true) {
        isAllowed = true;
      } else if (match === false) {
        return false;
      }
    }
    return isAllowed;
  }

  append(policy) {
    assert.ok(
      policy instanceof Policy,
      `appended policy must be instance of Policy ('${typeof policy}' provided)`
    );

    let newPolicy = new Policy();

    this.rules = this.rules.concat(policy.rules);
  }
}

module.exports = Policy;
