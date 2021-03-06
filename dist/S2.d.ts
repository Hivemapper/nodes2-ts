import { S2Point } from "./S2Point";
import { S2Metric } from "./S2Metric";
export declare class S2 {
    static M_PI: number;
    static M_1_PI: number;
    static M_PI_2: number;
    static M_PI_4: number;
    static M_SQRT2: number;
    static M_E: number;
    static SWAP_MASK: number;
    static INVERT_MASK: number;
    private static EXPONENT_SHIFT;
    private static EXPONENT_MASK;
    /** Mapping from cell orientation + Hilbert traversal to IJ-index. */
    static POS_TO_ORIENTATION: number[];
    static POS_TO_IJ: number[][];
    static MAX_LEVEL: number;
    static IEEEremainder(_f1: number | decimal.Decimal, _f2: number | decimal.Decimal): decimal.Decimal;
    /**
     * Return true if the given point is approximately unit length (this is mainly
     * useful for assertions).
     */
    static isUnitLength(p: S2Point): boolean;
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
    static exp(v: number): number;
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
    static robustCrossProd(a: S2Point, b: S2Point): S2Point;
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
    static area(a: S2Point, b: S2Point, c: S2Point): decimal.Decimal;
    /**
     * Return the area of the triangle computed using Girard's formula. This is
     * slightly faster than the Area() method above is not accurate for very small
     * triangles.
     */
    static girardArea(a: S2Point, b: S2Point, c: S2Point): decimal.Decimal;
    static toDecimal(value: number | decimal.Decimal | string): decimal.Decimal;
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
    static simpleCCW(a: S2Point, b: S2Point, c: S2Point): boolean;
    /**
     *
     * Return true if edge AB crosses CD at a point that is interior to both
     * edges. Properties:
     *
     *  (1) SimpleCrossing(b,a,c,d) == SimpleCrossing(a,b,c,d) (2)
     * SimpleCrossing(c,d,a,b) == SimpleCrossing(a,b,c,d)
     */
    static simpleCrossing(a: S2Point, b: S2Point, c: S2Point, d: S2Point): boolean;
    static Metric: typeof S2Metric;
}
export { S2Metric };
