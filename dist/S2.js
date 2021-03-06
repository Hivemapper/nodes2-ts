"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var S2Point_1 = require("./S2Point");
var decimal_1 = require("./decimal");
var S2Metric_1 = require("./S2Metric");
exports.S2Metric = S2Metric_1.S2Metric;
var Long = require('long');
var S2 = (function () {
    function S2() {
    }
    S2.IEEEremainder = function (_f1, _f2) {
        var f1 = S2.toDecimal(_f1);
        var f2 = S2.toDecimal(_f2);
        var r = f1.mod(f2);
        if (r.isNaN() || r.eq(f2) || r.lessThanOrEqualTo(f2.abs().dividedBy(2))) {
            return r;
        }
        else {
            return (f1.gte(0) ? S2.toDecimal(1) : S2.toDecimal(-1)).times(r.minus(f2));
        }
    };
    /**
     * Return true if the given point is approximately unit length (this is mainly
     * useful for assertions).
     */
    S2.isUnitLength = function (p) {
        return p.norm2().minus(1).abs().lte(1e-15);
    };
    /**
     * If v is non-zero, return an integer {@code exp} such that
     * {@code (0.5 <= |v|*2^(-exp) < 1)}. If v is zero, return 0.
     *
     * <p>Note that this arguably a bad definition of exponent because it makes
     * {@code exp(9) == 4}. In decimal this would be like saying that the
     * exponent of 1234 is 4, when in scientific 'exponent' notation 1234 is
     * {@code 1.234 x 10^3}.
     *
     * TODO(dbeaumont): Replace this with "DoubleUtils.getExponent(v) - 1" ?
     */
    S2.exp = function (v /*double*/) {
        if (v == 0) {
            return 0;
        }
        // IT should always be ((int)log(2,v))+1;
        var start = Math.floor(Math.log(v) / Math.log(2));
        for (var i = start; i < start + 10; i++) {
            var curVal = Math.abs(v) * Math.pow(2, -i);
            if (curVal >= 0.5 && curVal < 1) {
                return i;
            }
        }
        throw new Error('method not written yet');
        // return (int)((S2.EXPONENT_MASK & bits) >> S2.EXPONENT_SHIFT) - 1022;
    };
    /**
     * Return a vector "c" that is orthogonal to the given unit-length vectors "a"
     * and "b". This function is similar to a.CrossProd(b) except that it does a
     * better job of ensuring orthogonality when "a" is nearly parallel to "b",
     * and it returns a non-zero result even when a == b or a == -b.
     *
     *  It satisfies the following properties (RCP == RobustCrossProd):
     *
     *  (1) RCP(a,b) != 0 for all a, b (2) RCP(b,a) == -RCP(a,b) unless a == b or
     * a == -b (3) RCP(-a,b) == -RCP(a,b) unless a == b or a == -b (4) RCP(a,-b)
     * == -RCP(a,b) unless a == b or a == -b
     */
    S2.robustCrossProd = function (a, b) {
        // The direction of a.CrossProd(b) becomes unstable as (a + b) or (a - b)
        // approaches zero. This leads to situations where a.CrossProd(b) is not
        // very orthogonal to "a" and/or "b". We could fix this using Gram-Schmidt,
        // but we also want b.RobustCrossProd(a) == -b.RobustCrossProd(a).
        //
        // The easiest fix is to just compute the cross product of (b+a) and (b-a).
        // Given that "a" and "b" are unit-length, this has good orthogonality to
        // "a" and "b" even if they differ only in the lowest bit of one component.
        // assert (isUnitLength(a) && isUnitLength(b));
        var x = S2Point_1.S2Point.crossProd(S2Point_1.S2Point.add(b, a), S2Point_1.S2Point.sub(b, a));
        if (!x.equals(new S2Point_1.S2Point(0, 0, 0))) {
            return x;
        }
        // The only result that makes sense mathematically is to return zero, but
        // we find it more convenient to return an arbitrary orthogonal vector.
        return a.ortho();
    };
    /**
     * Return the area of triangle ABC. The method used is about twice as
     * expensive as Girard's formula, but it is numerically stable for both large
     * and very small triangles. The points do not need to be normalized. The area
     * is always positive.
     *
     *  The triangle area is undefined if it contains two antipodal points, and
     * becomes numerically unstable as the length of any edge approaches 180
     * degrees.
     */
    S2.area = function (a, b, c) {
        // This method is based on l'Huilier's theorem,
        //
        // tan(E/4) = sqrt(tan(s/2) tan((s-a)/2) tan((s-b)/2) tan((s-c)/2))
        //
        // where E is the spherical excess of the triangle (i.e. its area),
        // a, b, c, are the side lengths, and
        // s is the semiperimeter (a + b + c) / 2 .
        //
        // The only significant source of error using l'Huilier's method is the
        // cancellation error of the terms (s-a), (s-b), (s-c). This leads to a
        // *relative* error of about 1e-16 * s / min(s-a, s-b, s-c). This compares
        // to a relative error of about 1e-15 / E using Girard's formula, where E is
        // the true area of the triangle. Girard's formula can be even worse than
        // this for very small triangles, e.g. a triangle with a true area of 1e-30
        // might evaluate to 1e-5.
        //
        // So, we prefer l'Huilier's formula unless dmin < s * (0.1 * E), where
        // dmin = min(s-a, s-b, s-c). This basically includes all triangles
        // except for extremely long and skinny ones.
        //
        // Since we don't know E, we would like a conservative upper bound on
        // the triangle area in terms of s and dmin. It's possible to show that
        // E <= k1 * s * sqrt(s * dmin), where k1 = 2*sqrt(3)/Pi (about 1).
        // Using this, it's easy to show that we should always use l'Huilier's
        // method if dmin >= k2 * s^5, where k2 is about 1e-2. Furthermore,
        // if dmin < k2 * s^5, the triangle area is at most k3 * s^4, where
        // k3 is about 0.1. Since the best case error using Girard's formula
        // is about 1e-15, this means that we shouldn't even consider it unless
        // s >= 3e-4 or so.
        // We use volatile doubles to force the compiler to truncate all of these
        // quantities to 64 bits. Otherwise it may compute a value of dmin > 0
        // simply because it chose to spill one of the intermediate values to
        // memory but not one of the others.
        var sa = b.angle(c);
        var sb = c.angle(a);
        var sc = a.angle(b);
        var s = sa.plus(sb).plus(sc).times(0.5);
        // 0.5 * (sa + sb + sc);
        if (s.gte(3e-4)) {
            // Consider whether Girard's formula might be more accurate.
            var s2 = s.pow(2);
            var dmin = s.minus(decimal_1.Decimal.max(sa, sb, sc));
            if (dmin.lt(s2.pow(2).times(s).times(1e-2))) {
                // This triangle is skinny enough to consider Girard's formula.
                var area = S2.girardArea(a, b, c);
                if (dmin.lt(s.times(area.times(0.1)))) {
                    return area;
                }
            }
        }
        // Use l'Huilier's formula.
        return S2.toDecimal(4)
            .times(decimal_1.Decimal.atan(decimal_1.Decimal.sqrt(decimal_1.Decimal.max(0.0, decimal_1.Decimal.tan(s.times(0.5))
            .times(decimal_1.Decimal.tan(s.minus(sa).times(0.5)))
            .times(decimal_1.Decimal.tan(s.minus(sb).times(0.5)))
            .times(decimal_1.Decimal.tan(s.minus(sc).times(0.5)))))));
    };
    /**
     * Return the area of the triangle computed using Girard's formula. This is
     * slightly faster than the Area() method above is not accurate for very small
     * triangles.
     */
    S2.girardArea = function (a, b, c) {
        // This is equivalent to the usual Girard's formula but is slightly
        // more accurate, faster to compute, and handles a == b == c without
        // a special case.
        var ab = S2Point_1.S2Point.crossProd(a, b);
        var bc = S2Point_1.S2Point.crossProd(b, c);
        var ac = S2Point_1.S2Point.crossProd(a, c);
        return decimal_1.Decimal.max(0, ab.angle(ac)
            .minus(ab.angle(bc))
            .plus(bc.angle(ac)));
    };
    S2.toDecimal = function (value) {
        if (typeof (value) === 'number' || typeof (value) === 'string') {
            return new decimal_1.Decimal(value);
        }
        return value;
    };
    /**
     * Return true if the points A, B, C are strictly counterclockwise. Return
     * false if the points are clockwise or colinear (i.e. if they are all
     * contained on some great circle).
     *
     *  Due to numerical errors, situations may arise that are mathematically
     * impossible, e.g. ABC may be considered strictly CCW while BCA is not.
     * However, the implementation guarantees the following:
     *
     *  If SimpleCCW(a,b,c), then !SimpleCCW(c,b,a) for all a,b,c.
     *
     * In other words, ABC and CBA are guaranteed not to be both CCW
     */
    S2.simpleCCW = function (a, b, c) {
        // We compute the signed volume of the parallelepiped ABC. The usual
        // formula for this is (AxB).C, but we compute it here using (CxA).B
        // in order to ensure that ABC and CBA are not both CCW. This follows
        // from the following identities (which are true numerically, not just
        // mathematically):
        //
        // (1) x.CrossProd(y) == -(y.CrossProd(x))
        // (2) (-x).DotProd(y) == -(x.DotProd(y))
        return S2Point_1.S2Point.crossProd(c, a).dotProd(b).gt(0);
    };
    /**
     *
     * Return true if edge AB crosses CD at a point that is interior to both
     * edges. Properties:
     *
     *  (1) SimpleCrossing(b,a,c,d) == SimpleCrossing(a,b,c,d) (2)
     * SimpleCrossing(c,d,a,b) == SimpleCrossing(a,b,c,d)
     */
    S2.simpleCrossing = function (a, b, c, d) {
        // We compute SimpleCCW() for triangles ACB, CBD, BDA, and DAC. All
        // of these triangles need to have the same orientation (CW or CCW)
        // for an intersection to exist. Note that this is slightly more
        // restrictive than the corresponding definition for planar edges,
        // since we need to exclude pairs of line segments that would
        // otherwise "intersect" by crossing two antipodal points.
        var ab = S2Point_1.S2Point.crossProd(a, b);
        var cd = S2Point_1.S2Point.crossProd(c, d);
        var acb = ab.dotProd(c).neg();
        var cbd = cd.dotProd(b).neg();
        var bda = ab.dotProd(d);
        var dac = cd.dotProd(a);
        return (acb.times(cbd).gt(0)) && (cbd.times(bda).gt(0)) && (bda.times(dac).gt(0));
    };
    return S2;
}());
S2.M_PI = Math.PI;
S2.M_1_PI = 1.0 / Math.PI;
S2.M_PI_2 = Math.PI / 2.0;
S2.M_PI_4 = Math.PI / 4.0;
S2.M_SQRT2 = Math.sqrt(2);
S2.M_E = Math.E;
// the axis directions are reversed).
S2.SWAP_MASK = 0x01;
S2.INVERT_MASK = 0x02;
// Number of bits in the mantissa of a double.
S2.EXPONENT_SHIFT = 52;
// Mask to extract the exponent from a double.
S2.EXPONENT_MASK = Long.fromString('0x7ff0000000000000', true, 16);
/** Mapping from cell orientation + Hilbert traversal to IJ-index. */
S2.POS_TO_ORIENTATION = [S2.SWAP_MASK, 0, 0, S2.INVERT_MASK + S2.SWAP_MASK];
S2.POS_TO_IJ = [
    // 0 1 2 3
    [0, 1, 3, 2],
    [0, 2, 3, 1],
    [3, 2, 0, 1],
    [3, 1, 0, 2],
];
S2.MAX_LEVEL = 30;
S2.Metric = S2Metric_1.S2Metric;
exports.S2 = S2;
//# sourceMappingURL=S2.js.map