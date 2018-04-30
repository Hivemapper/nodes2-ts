/*
 * Copyright 2006 Google Inc.
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
import { R2Vector } from "./R2Vector";
import * as decimal from 'decimal.js';
import { S2 } from "./S2";
///re
/**
 * An S2Point represents a point on the unit sphere as a 3D vector. Usually
 * points are normalized to be unit length, but some methods do not require
 * this.
 *
 */
export class S2Point {
    constructor(x, y, z) {
        this.x = new decimal.Decimal(x);
        this.y = new decimal.Decimal(y);
        this.z = new decimal.Decimal(z);
        // this.y = typeof(y) === 'number'?new decimal.Decimal(y):y as decimal.Decimal;
        // this.z = typeof(z) === 'number'?new decimal.Decimal(z):z as decimal.Decimal;
    }
    static minus(p1, p2) {
        return S2Point.sub(p1, p2);
    }
    static neg(p) {
        return new S2Point(p.x.negated(), p.y.negated(), p.z.negated());
    }
    norm2() {
        return this.x.pow(2).plus(this.y.pow(2)).plus(this.z.pow(2));
    }
    norm() {
        return this.norm2().sqrt();
    }
    static crossProd(p1, p2) {
        return new S2Point(p1.y.times(p2.z).minus(p1.z.times(p2.y)), p1.z.times(p2.x).minus(p1.x.times(p2.z)), 
        // p1.z * p2.x - p1.x * p2.z,
        p1.x.times(p2.y).minus(p1.y.times(p2.x))
        // p1.x * p2.y - p1.y * p2.x
        );
    }
    static add(p1, p2) {
        return new S2Point(p1.x.add(p2.x), p1.y.add(p2.y), p1.z.add(p2.z));
    }
    static sub(p1, p2) {
        return new S2Point(p1.x.sub(p2.x), p1.y.sub(p2.y), p1.z.sub(p2.z));
    }
    dotProd(that) {
        return this.x.times(that.x).plus(this.y.times(that.y)).plus(this.z.times(that.z));
    }
    static mul(p, m) {
        let mD = new decimal.Decimal(m);
        return new S2Point(mD.times(p.x), mD.times(p.y), mD.times(p.z));
    }
    static div(p, m) {
        return new S2Point(p.x.div(m), p.y.div(m), p.z.div(m));
    }
    /** return a vector orthogonal to this one */
    ortho() {
        let k = this.largestAbsComponent();
        let temp;
        if (k == 1) {
            temp = new S2Point(1, 0, 0);
        }
        else if (k == 2) {
            temp = new S2Point(0, 1, 0);
        }
        else {
            temp = new S2Point(0, 0, 1);
        }
        return S2Point.normalize(S2Point.crossProd(this, temp));
    }
    /** Return the index of the largest component fabs */
    largestAbsComponent() {
        let temp = S2Point.fabs(this);
        if (temp.x.greaterThan(temp.y)) {
            if (temp.x.greaterThan(temp.z)) {
                return 0;
            }
            else {
                return 2;
            }
        }
        else {
            if (temp.y.greaterThan(temp.z)) {
                return 1;
            }
            else {
                return 2;
            }
        }
    }
    static fabs(p) {
        return new S2Point(p.x.abs(), p.y.abs(), p.z.abs());
    }
    static normalize(p) {
        let norm = p.norm();
        if (!norm.eq(0)) {
            norm = S2.toDecimal(1).dividedBy(norm);
        }
        return S2Point.mul(p, norm);
    }
    axis(axis) {
        return (axis == 0) ? this.x : (axis == 1) ? this.y : this.z;
    }
    /** Return the angle between two vectors in radians */
    angle(va) {
        return decimal.Decimal.atan2(S2Point.crossProd(this, va).norm(), this.dotProd(va));
    }
    /**
     * Compare two vectors, return true if all their components are within a
     * difference of margin.
     */
    aequal(that, margin) {
        return this.x.minus(that.x).abs().lessThan(margin) &&
            this.y.minus(that.y).abs().lessThan(margin) &&
            this.z.minus(that.z).abs().lessThan(margin);
    }
    equals(that) {
        if (!(that instanceof S2Point)) {
            return false;
        }
        return this.x.eq(that.x) && this.y.eq(that.y) && this.z.eq(that.z);
    }
    lessThan(vb) {
        if (this.x.lt(vb.x)) {
            return true;
        }
        if (vb.x.lt(this.x)) {
            return false;
        }
        if (this.y.lt(vb.y)) {
            return true;
        }
        if (vb.y.lt(this.y)) {
            return false;
        }
        if (this.z.lt(vb.z)) {
            return true;
        }
        return false;
    }
    compareTo(other) {
        return (this.lessThan(other) ? -1 : (this.equals(other) ? 0 : 1));
    }
    toFace() {
        let face = this.largestAbsComponent();
        if (this.axis(face).lt(0)) {
            face += 3;
        }
        return face;
    }
    toR2Vector(face = this.toFace()) {
        let u;
        let v;
        switch (face) {
            case 0:
                u = this.y.div(this.x);
                v = this.z.div(this.x);
                break;
            case 1:
                u = this.x.neg().div(this.y);
                v = this.z.div(this.y);
                break;
            case 2:
                u = this.x.neg().div(this.z);
                v = this.y.neg().div(this.z);
                break;
            case 3:
                u = this.z.div(this.x);
                v = this.y.div(this.x);
                break;
            case 4:
                u = this.z.div(this.y);
                v = this.x.neg().div(this.y);
                break;
            case 5:
                u = this.y.neg().div(this.z);
                v = this.x.neg().div(this.z);
                break;
            default:
                throw new Error('Invalid face');
        }
        return new R2Vector(u, v);
    }
    toString() {
        return `Point(${this.x.toNumber()}, ${this.y.toNumber()}, ${this.z.toNumber()})`;
    }
}
//# sourceMappingURL=S2Point.js.map