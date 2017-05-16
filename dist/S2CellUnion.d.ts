/// <reference types="long" />
import * as Long from 'long';
import { S2Region } from "./S2Region";
import { S2CellId } from "./S2CellId";
import { S2Cell } from "./S2Cell";
import { S1Angle } from "./S1Angle";
import { S2LatLngRect } from "./S2LatLngRect";
import { S2Point } from "./S2Point";
import { S2Cap } from "./S2Cap";
/**
 * An S2CellUnion is a region consisting of cells of various sizes. Typically a
 * cell union is used to approximate some other shape. There is a tradeoff
 * between the accuracy of the approximation and how many cells are used. Unlike
 * polygons, cells have a fixed hierarchical structure. This makes them more
 * suitable for optimizations based on preprocessing.
 *
 */
export declare class S2CellUnion implements S2Region {
    /** The CellIds that form the Union */
    private cellIds;
    S2CellUnion(): void;
    /**
     * Populates a cell union with the given S2CellIds or 64-bit cells ids, and
     * then calls Normalize(). The InitSwap() version takes ownership of the
     * vector data without copying and clears the given vector. These methods may
     * be called multiple times.
     */
    initFromIds(cellIds: Long[] | string[]): void;
    initSwap(cellIds: S2CellId[]): void;
    initRawCellIds(cellIds: S2CellId[]): void;
    initRawIds(cellIds: Long[] | string[]): void;
    /**
     * Like Init(), but does not call Normalize(). The cell union *must* be
     * normalized before doing any calculations with it, so it is the caller's
     * responsibility to make sure that the input is normalized. This method is
     * useful when converting cell unions to another representation and back.
     * These methods may be called multiple times.
     */
    initRawSwap(cellIds: S2CellId[]): void;
    size(): number;
    /** Convenience methods for accessing the individual cell ids. */
    cellId(i: number): S2CellId;
    getCellIds(): S2CellId[];
    /**
     * Replaces "output" with an expanded version of the cell union where any
     * cells whose level is less than "min_level" or where (level - min_level) is
     * not a multiple of "level_mod" are replaced by their children, until either
     * both of these conditions are satisfied or the maximum level is reached.
     *
     *  This method allows a covering generated by S2RegionCoverer using
     * min_level() or level_mod() constraints to be stored as a normalized cell
     * union (which allows various geometric computations to be done) and then
     * converted back to the original list of cell ids that satisfies the desired
     * constraints.
     */
    denormalize(minLevel: number, levelMod: number): S2CellId[];
    /**
     * If there are more than "excess" elements of the cell_ids() vector that are
     * allocated but unused, reallocate the array to eliminate the excess space.
     * This reduces memory usage when many cell unions need to be held in memory
     * at once.
     */
    pack(): void;
    containsC(cell: S2Cell): boolean;
    mayIntersectC(cell: S2Cell): boolean;
    /**
     * Return true if the cell union contains the given cell id. Containment is
     * defined with respect to regions, e.g. a cell contains its 4 children. This
     * is a fast operation (logarithmic in the size of the cell union).
     */
    contains(id: S2CellId): boolean;
    /**
     * Return true if the cell union intersects the given cell id. This is a fast
     * operation (logarithmic in the size of the cell union).
     */
    intersects(id: S2CellId): boolean;
    containsUnion(that: S2CellUnion): boolean;
    /** This is a fast operation (logarithmic in the size of the cell union). */
    containsCell(cell: S2Cell): boolean;
    /**
     * Return true if this cell union contain/intersects the given other cell
     * union.
     */
    intersectsUnion(that: S2CellUnion): boolean;
    getUnion(x: S2CellUnion, y: S2CellUnion): void;
    /**
     * Specialized version of GetIntersection() that gets the intersection of a
     * cell union with the given cell id. This can be useful for "splitting" a
     * cell union into chunks.
     */
    getIntersection(x: S2CellUnion, id: S2CellId): void;
    /**
     * Initialize this cell union to the union or intersection of the two given
     * cell unions. Requires: x != this and y != this.
     */
    getIntersectionUU(x: S2CellUnion, y: S2CellUnion): void;
    /**
     * Expands the cell union such that it contains all cells of the given level
     * that are adjacent to any cell of the original union. Two cells are defined
     * as adjacent if their boundaries have any points in common, i.e. most cells
     * have 8 adjacent cells (not counting the cell itself).
     *
     *  Note that the size of the output is exponential in "level". For example,
     * if level == 20 and the input has a cell at level 10, there will be on the
     * order of 4000 adjacent cells in the output. For most applications the
     * Expand(min_fraction, min_distance) method below is easier to use.
     */
    expand(level: number): void;
    /**
     * Expand the cell union such that it contains all points whose distance to
     * the cell union is at most minRadius, but do not use cells that are more
     * than maxLevelDiff levels higher than the largest cell in the input. The
     * second parameter controls the tradeoff between accuracy and output size
     * when a large region is being expanded by a small amount (e.g. expanding
     * Canada by 1km).
     *
     *  For example, if maxLevelDiff == 4, the region will always be expanded by
     * approximately 1/16 the width of its largest cell. Note that in the worst
     * case, the number of cells in the output can be up to 4 * (1 + 2 **
     * maxLevelDiff) times larger than the number of cells in the input.
     */
    expandA(minRadius: S1Angle, maxLevelDiff: number): void;
    getCapBound(): S2Cap;
    getRectBound(): S2LatLngRect;
    /** This is a fast operation (logarithmic in the size of the cell union). */
    mayIntersectCell(cell: S2Cell): boolean;
    /**
     * The point 'p' does not need to be normalized. This is a fast operation
     * (logarithmic in the size of the cell union).
     */
    containsPoint(p: S2Point): boolean;
    /**
     * The number of leaf cells covered by the union.
     * This will be no more than 6*2^60 for the whole sphere.
     *
     * @return the number of leaf cells covered by the union
     */
    leafCellsCovered(): Long;
    /**
     * Approximate this cell union's area by summing the average area of
     * each contained cell's average area, using {@link S2Cell#averageArea()}.
     * This is equivalent to the number of leaves covered, multiplied by
     * the average area of a leaf.
     * Note that {@link S2Cell#averageArea()} does not take into account
     * distortion of cell, and thus may be off by up to a factor of 1.7.
     * NOTE: Since this is proportional to LeafCellsCovered(), it is
     * always better to use the other function if all you care about is
     * the relative average area between objects.
     *
     * @return the sum of the average area of each contained cell's average area
     */
    averageBasedArea(): number;
    /**
     * Calculates this cell union's area by summing the approximate area for each
     * contained cell, using {@link S2Cell#approxArea()}.
     *
     * @return approximate area of the cell union
     */
    approxArea(): number;
    /**
     * Calculates this cell union's area by summing the exact area for each
     * contained cell, using the {@link S2Cell#exactArea()}.
     *
     * @return the exact area of the cell union
     */
    exactArea(): number;
    /**
     * Normalizes the cell union by discarding cells that are contained by other
     * cells, replacing groups of 4 child cells by their parent cell whenever
     * possible, and sorting all the cell ids in increasing order. Returns true if
     * the number of cells was reduced.
     *
     *  This method *must* be called before doing any calculations on the cell
     * union, such as Intersects() or Contains().
     *
     * @return true if the normalize operation had any effect on the cell union,
     *         false if the union was already normalized
     */
    normalize(): boolean;
}
