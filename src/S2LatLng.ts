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

import {S1Angle} from "./S1Angle";
import {S2Point} from "./S2Point";
import {S2} from "./S2";
import Decimal = require('decimal.js');
/**
 * This class represents a point on the unit sphere as a pair of
 * latitude-longitude coordinates. Like the rest of the "geometry" package, the
 * intent is to represent spherical geometry as a mathematical abstraction, so
 * functions that are specifically related to the Earth's geometry (e.g.
 * easting/northing conversions) should be put elsewhere.
 *
 */
export class S2LatLng {

  /**
   * Approximate "effective" radius of the Earth in meters.
   */
  public static EARTH_RADIUS_METERS = 6367000.0;

  /** The center point the lat/lng coordinate system. */
  public static CENTER = new S2LatLng(0.0, 0.0);

  public latRadians:decimal.Decimal;
  public lngRadians:decimal.Decimal;

  constructor(latRadians:number|decimal.Decimal, lngRadians:number|decimal.Decimal) {
    this.latRadians = new Decimal(latRadians) as decimal.Decimal;
    this.lngRadians = new Decimal(lngRadians) as decimal.Decimal;
  }

// Clamps the latitude to the range [-90, 90] degrees, and adds or subtracts
  // a multiple of 360 degrees to the longitude if necessary to reduce it to
  // the range [-180, 180].
  /** Convert an S2LatLng to the equivalent unit-length vector (S2Point). */
  public  toPoint():S2Point {
    const phi = this.latRadians;
    const theta = this.lngRadians;
    const cosphi = Decimal.cos(phi);

    return new S2Point(
        Decimal.cos(theta).times(cosphi),
        Decimal.sin(theta).times(cosphi),
        Decimal.sin(phi));
  }

  /**
   * Returns a new S2LatLng based on this instance for which {@link #isValid()}
   * will be {@code true}.
   * <ul>
   * <li>Latitude is clipped to the range {@code [-90, 90]}
   * <li>Longitude is normalized to be in the range {@code [-180, 180]}
   * </ul>
   * <p>If the current point is valid then the returned point will have the same
   * coordinates.
   */
  public normalized():S2LatLng {
    // drem(x, 2 * S2.M_PI) reduces its argument to the range
    // [-S2.M_PI, S2.M_PI] inclusive, which is what we want here.
    return new S2LatLng(
        Decimal.max(
            -S2.M_PI_2,
            Decimal.min(
                S2.M_PI_2,
                this.latRadians
            )
        ),
        S2.IEEEremainder(
            this.lngRadians,
            new Decimal(2).times(S2.M_PI)
        )
    );
    // return new S2LatLng(Math.max(-S2.M_PI_2, Math.min(S2.M_PI_2, this.latRadians)),
    //     S2.IEEEremainder(this.lngRadians, 2 * S2.M_PI));
  }

  public static fromDegrees(latDegrees:number|decimal.Decimal, lngDegrees:number|decimal.Decimal):S2LatLng {

    return new S2LatLng(S1Angle.degrees(latDegrees).radians, S1Angle.degrees(lngDegrees).radians);
  }

  static fromPoint(p:S2Point) {
    return new S2LatLng(
        S2LatLng.latitude(p).radians,
        S2LatLng.longitude(p).radians
    );
  }

  /**
   * Return true if the latitude is between -90 and 90 degrees inclusive and the
   * longitude is between -180 and 180 degrees inclusive.
   */
  public isValid():boolean {
    return this.latRadians.abs().lte(S2.M_PI_2) &&
        this.lngRadians.abs().lte(S2.M_PI);

  }

  public static latitude(p:S2Point) {
    // We use atan2 rather than asin because the input vector is not necessarily
    // unit length, and atan2 is much more accurate than asin near the poles.
    return new S1Angle(
        Decimal.atan2(
            p.z,
            Decimal.pow(p.x, 2)
                .plus(Decimal.pow(p.y, 2))
                .sqrt()
        )
        // Math.atan2(p.z, Math.sqrt(p.x * p.x + p.y * p.y))
    );
  }

  public static longitude(p:S2Point):S1Angle {
    // Note that atan2(0, 0) is defined to be zero.
    return new S1Angle(Decimal.atan2(p.y, p.x));
  }

  equals(other:S2LatLng):boolean {
    return other.latRadians === this.latRadians && other.lngRadians === this.lngRadians;
  }

  toString():string {
    return `(Lat: ${new S1Angle(this.latRadians).degrees()} - ${this.latRadians}- Lng: ${new S1Angle(this.lngRadians).degrees()} - ${this.lngRadians}`;
  }


  getDistance(other:S2LatLng):S1Angle {
    // This implements the Haversine formula, which is numerically stable for
    // small distances but only gets about 8 digits of precision for very large
    // distances (e.g. antipodal points). Note that 8 digits is still accurate
    // to within about 10cm for a sphere the size of the Earth.
    //
    // This could be fixed with another sin() and cos() below, but at that point
    // you might as well just convert both arguments to S2Points and compute the
    // distance that way (which gives about 15 digits of accuracy for all
    // distances).

    const dLat:decimal.Decimal = other.latRadians.minus(this.latRadians).times(0.5).sin();
    const dLng:decimal.Decimal = other.lngRadians.minus(this.lngRadians).times(0.5).sin();
    const x = dLat.pow(2)
        .plus(
            dLng.pow(2)
                .times(this.latRadians.cos())
                .times(other.latRadians.cos())
        );
    // double x = dlat * dlat + dlng * dlng * Math.cos(lat1) * Math.cos(lat2);

    return new S1Angle(
        (new Decimal(2) as decimal.Decimal)
            .times(
                Decimal.atan2(
                    x.sqrt(),
                    Decimal.max(
                        0,
                        x.neg().plus(1)
                    )
                        .sqrt()
                )
            )
  );
    // Return the distance (measured along the surface of the sphere) to the
    // given S2LatLng. This is mathematically equivalent to:
    //
    // S1Angle::FromRadians(ToPoint().Angle(o.ToPoint())
    //
    // but this implementation is slightly more efficient.
  }

}
