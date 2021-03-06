"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var S2_1 = require("./S2");
var Interval = (function () {
    function Interval(lo, hi) {
        this.lo = S2_1.S2.toDecimal(lo);
        this.hi = S2_1.S2.toDecimal(hi);
    }
    Interval.prototype.toString = function () {
        return "[" + this.lo.toString() + ", " + this.hi.toString() + "]";
    };
    /**
     * Return true if two intervals contains the same set of points.
     */
    Interval.prototype.equals = function (that) {
        if (typeof (that) === typeof (this)) {
            return this.lo.eq(that.lo) && this.hi.eq(that.hi);
        }
        return false;
    };
    return Interval;
}());
exports.Interval = Interval;
//# sourceMappingURL=Interval.js.map