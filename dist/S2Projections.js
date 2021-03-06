"use strict";
/*
 * Copyright 2005 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This class specifies the details of how the cube faces are projected onto the
 * unit sphere. This includes getting the face ordering and orientation correct
 * so that sequentially increasing cell ids follow a continuous space-filling
 * curve over the entire sphere, and defining the transformation from cell-space
 * to cube-space (see s2.h) in order to make the cells more uniform in size.
 *
 *
 *  We have implemented three different projections from cell-space (s,t) to
 * cube-space (u,v): linear, quadratic, and tangent. They have the following
 * tradeoffs:
 *
 *  Linear - This is the fastest transformation, but also produces the least
 * uniform cell sizes. Cell areas vary by a factor of about 5.2, with the
 * largest cells at the center of each face and the smallest cells in the
 * corners.
 *
 *  Tangent - Transforming the coordinates via atan() makes the cell sizes more
 * uniform. The areas vary by a maximum ratio of 1.4 as opposed to a maximum
 * ratio of 5.2. However, each call to atan() is about as expensive as all of
 * the other calculations combined when converting from points to cell ids, i.e.
 * it reduces performance by a factor of 3.
 *
 *  Quadratic - This is an approximation of the tangent projection that is much
 * faster and produces cells that are almost as uniform in size. It is about 3
 * times faster than the tangent projection for converting cell ids to points,
 * and 2 times faster for converting points to cell ids. Cell areas vary by a
 * maximum ratio of about 2.1.
 *
 *  Here is a table comparing the cell uniformity using each projection. "Area
 * ratio" is the maximum ratio over all subdivision levels of the largest cell
 * area to the smallest cell area at that level, "edge ratio" is the maximum
 * ratio of the longest edge of any cell to the shortest edge of any cell at the
 * same level, and "diag ratio" is the ratio of the longest diagonal of any cell
 * to the shortest diagonal of any cell at the same level. "ToPoint" and
 * "FromPoint" are the times in microseconds required to convert cell ids to and
 * from points (unit vectors) respectively.
 *
 *  Area Edge Diag ToPoint FromPoint Ratio Ratio Ratio (microseconds)
 * ------------------------------------------------------- Linear: 5.200 2.117
 * 2.959 0.103 0.123 Tangent: 1.414 1.414 1.704 0.290 0.306 Quadratic: 2.082
 * 1.802 1.932 0.116 0.161
 *
 *  The worst-case cell aspect ratios are about the same with all three
 * projections. The maximum ratio of the longest edge to the shortest edge
 * within the same cell is about 1.4 and the maximum ratio of the diagonals
 * within the same cell is about 1.7.
 *
 * This data was produced using s2cell_unittest and s2cellid_unittest.
 *
 */
var S2_1 = require("./S2");
var S2Point_1 = require("./S2Point");
var R2Vector_1 = require("./R2Vector");
var Projections;
(function (Projections) {
    Projections[Projections["S2_LINEAR_PROJECTION"] = 0] = "S2_LINEAR_PROJECTION";
    Projections[Projections["S2_TAN_PROJECTION"] = 1] = "S2_TAN_PROJECTION";
    Projections[Projections["S2_QUADRATIC_PROJECTION"] = 2] = "S2_QUADRATIC_PROJECTION";
})(Projections = exports.Projections || (exports.Projections = {}));
var S2Projections = (function () {
    function S2Projections() {
    }
    S2Projections.getUNorm = function (face, u) {
        switch (face) {
            case 0:
                return new S2Point_1.S2Point(u, -1, 0);
            case 1:
                return new S2Point_1.S2Point(1, u, 0);
            case 2:
                return new S2Point_1.S2Point(1, 0, u);
            case 3:
                return new S2Point_1.S2Point(-u, 0, 1);
            case 4:
                return new S2Point_1.S2Point(0, -u, 1);
            default:
                return new S2Point_1.S2Point(0, -1, -u);
        }
    };
    S2Projections.getVNorm = function (face, v) {
        switch (face) {
            case 0:
                return new S2Point_1.S2Point(-v, 0, 1);
            case 1:
                return new S2Point_1.S2Point(0, -v, 1);
            case 2:
                return new S2Point_1.S2Point(0, -1, -v);
            case 3:
                return new S2Point_1.S2Point(v, -1, 0);
            case 4:
                return new S2Point_1.S2Point(1, v, 0);
            default:
                return new S2Point_1.S2Point(1, 0, v);
        }
    };
    S2Projections.getUAxis = function (face) {
        switch (face) {
            case 0:
                return new S2Point_1.S2Point(0, 1, 0);
            case 1:
                return new S2Point_1.S2Point(-1, 0, 0);
            case 2:
                return new S2Point_1.S2Point(-1, 0, 0);
            case 3:
                return new S2Point_1.S2Point(0, 0, -1);
            case 4:
                return new S2Point_1.S2Point(0, 0, -1);
            default:
                return new S2Point_1.S2Point(0, 1, 0);
        }
    };
    S2Projections.getVAxis = function (face) {
        switch (face) {
            case 0:
                return new S2Point_1.S2Point(0, 0, 1);
            case 1:
                return new S2Point_1.S2Point(0, 0, 1);
            case 2:
                return new S2Point_1.S2Point(0, -1, 0);
            case 3:
                return new S2Point_1.S2Point(0, -1, 0);
            case 4:
                return new S2Point_1.S2Point(1, 0, 0);
            default:
                return new S2Point_1.S2Point(1, 0, 0);
        }
    };
    S2Projections.faceUvToXyz = function (face, u, v) {
        return new R2Vector_1.R2Vector(u, v).toPoint(face);
    };
    return S2Projections;
}());
S2Projections.MIN_WIDTH = new S2_1.S2Metric(1, S2_1.S2.M_SQRT2 / 3);
S2Projections.AVG_AREA = new S2_1.S2Metric(2, S2_1.S2.M_PI / 6); // 0.524)
exports.S2Projections = S2Projections;
//# sourceMappingURL=S2Projections.js.map