/**
 * Defines an area or a length cell metric.
 */
export declare class S2Metric {
    private _dim;
    private _deriv;
    /**
     * Defines a cell metric of the given dimension (1 == length, 2 == area).
     */
    constructor(_dim: number | decimal.Decimal, _deriv: number | decimal.Decimal);
    deriv(): decimal.Decimal;
    dim(): number;
    /** Return the value of a metric for cells at the given level. */
    getValue(level: number): number;
    /**
     * Return the level at which the metric has approximately the given value.
     * For example, S2::kAvgEdge.GetClosestLevel(0.1) returns the level at which
     * the average cell edge length is approximately 0.1. The return value is
     * always a valid level.
     */
    getClosestLevel(value: number): number;
    /**
     * Return the minimum level such that the metric is at most the given value,
     * or S2CellId::kMaxLevel if there is no such level. For example,
     * S2::kMaxDiag.GetMinLevel(0.1) returns the minimum level such that all
     * cell diagonal lengths are 0.1 or smaller. The return value is always a
     * valid level.
     */
    getMinLevel(value: number): number;
    /**
     * Return the maximum level such that the metric is at least the given
     * value, or zero if there is no such level. For example,
     * S2.kMinWidth.GetMaxLevel(0.1) returns the maximum level such that all
     * cells have a minimum width of 0.1 or larger. The return value is always a
     * valid level.
     */
    getMaxLevel(_value: number | decimal.Decimal): number;
}
