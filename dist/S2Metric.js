"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var S2_1 = require("./S2");
/**
 * Defines an area or a length cell metric.
 */
var S2Metric = (function () {
    /**
     * Defines a cell metric of the given dimension (1 == length, 2 == area).
     */
    function S2Metric(_dim, _deriv) {
        this._dim = S2_1.S2.toDecimal(_dim).toNumber();
        this._deriv = S2_1.S2.toDecimal(_deriv);
    }
    S2Metric.prototype.deriv = function () {
        return this._deriv;
    };
    S2Metric.prototype.dim = function () {
        return this._dim;
    };
    /** Return the value of a metric for cells at the given level. */
    S2Metric.prototype.getValue = function (level) {
        var scaleFactor = this.dim() * (1 - level);
        return this.deriv().toNumber() * Math.pow(2, scaleFactor);
    };
    /**
     * Return the level at which the metric has approximately the given value.
     * For example, S2::kAvgEdge.GetClosestLevel(0.1) returns the level at which
     * the average cell edge length is approximately 0.1. The return value is
     * always a valid level.
     */
    S2Metric.prototype.getClosestLevel = function (/*double*/ value) {
        return this.getMinLevel(S2_1.S2.M_SQRT2 * value);
    };
    /**
     * Return the minimum level such that the metric is at most the given value,
     * or S2CellId::kMaxLevel if there is no such level. For example,
     * S2::kMaxDiag.GetMinLevel(0.1) returns the minimum level such that all
     * cell diagonal lengths are 0.1 or smaller. The return value is always a
     * valid level.
     */
    S2Metric.prototype.getMinLevel = function (value /*double*/) {
        if (value <= 0) {
            return S2_1.S2.MAX_LEVEL;
        }
        // This code is equivalent to computing a floating-point "level"
        // value and rounding up.
        var exponent = S2_1.S2.exp(value / ((1 << this.dim()) * this.deriv().toNumber()));
        var level = Math.max(0, Math.min(S2_1.S2.MAX_LEVEL, -((exponent - 1) >> (this.dim() - 1))));
        // assert (level == S2CellId.MAX_LEVEL || getValue(level) <= value);
        // assert (level == 0 || getValue(level - 1) > value);
        return level;
    };
    /**
     * Return the maximum level such that the metric is at least the given
     * value, or zero if there is no such level. For example,
     * S2.kMinWidth.GetMaxLevel(0.1) returns the maximum level such that all
     * cells have a minimum width of 0.1 or larger. The return value is always a
     * valid level.
     */
    S2Metric.prototype.getMaxLevel = function (_value /*double*/) {
        var value = S2_1.S2.toDecimal(_value).toNumber();
        if (value <= 0) {
            return S2_1.S2.MAX_LEVEL;
        }
        // This code is equivalent to computing a floating-point "level"
        // value and rounding down.
        var exponent = S2_1.S2.exp((1 << this.dim()) * this.deriv().toNumber() / value);
        var level = Math.max(0, Math.min(S2_1.S2.MAX_LEVEL, ((exponent - 1) >> (this.dim() - 1))));
        // assert (level == 0 || getValue(level) >= value);
        // assert (level == S2CellId.MAX_LEVEL || getValue(level + 1) < value);
        return level;
    };
    return S2Metric;
}());
exports.S2Metric = S2Metric;
//# sourceMappingURL=S2Metric.js.map