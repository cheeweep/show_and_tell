// pchip for JavaScript
// Sourced from https://github.com/fizxmike/show_and_tell/blob/master/pchip.js

export default {
  /*
 * Author: Michael Folkerts (http://bit.ly/folkerts)
 * Date: July 2012
 * Reference: http://www.mathworks.com/moler/interp.pdf
 *
 * Example Usage:
 *     var sampling_frequency; //per unit on x-axis
 *     var pchip_fit_points = pchip.fit(input_points,sampling_frequency); //default is monotone method
 *  or
 *     var pchip_fit_points = pchip.monotone(input_points,sampling_frequency); //same as above
 *     var pchip_fit_points = pchip.fit(input_points,"monotone"); //same as above
 *  or
 *     var pchip_fit_points = pchip.shape_preserving(input_points,sampling_frequency);
 *     var pchip_fit_points = pchip.fit(input_points,sampling_frequency,"shape_preserving");//same as last line
 * 
 */

  version: 0.1,

  monotone: function(source, frequency) {
    /** just wrapping a function **/
    return this.fit(source, frequency, 'monotone');
  },

  shape_preserving: function(source, frequency) {
    /** just wrapping a function **/
    return this.fit(source, frequency, 'shape_preserving');
  },

  fit: function(source, frequency, method) {
    /**	this function computes the pchip interpolation method with a monotone constraint or as a "shape preserving" fit
			[http://www.mathworks.com/moler/interp.pdf]
		source: is assumed to be an array of 2-touples (x,y)
		frequency: is the number of samples per unit distance along x-axis
		method (optional): defines how to choose slopes,
			'monotone' is default
			'shape_preserving' is visually appealing and avoids over-shooting data points
		return value: a reference to a new 2-touple Array() with length determined by
		frequency parameter and spacing of points in source
	**/
    //set default method:
    method = typeof method !== 'undefined' ? method : 'monotone';

    var m;
    switch (method) {
      case 'monotone':
        m = this.slopes_monotone(source);
        break;
      case 'shape_preserving':
        m = this.slopes_shape_preserving(source);
        break;
      default:
        alert("slope method '" + method + "' is not defined in PCHIP!!");
    }

    var dest = []; //may be slow because we are pushing new elements
    var offset = 0;
    for (var i = 0; i < source.length - 1; i++) {
      //fill dest array with sucessive pchip'd points
      var thisPoint = source[i];
      var nextPoint = source[i + 1];
      offset += this.chip_v(
        thisPoint,
        nextPoint,
        [m[i], m[i + 1]],
        frequency,
        dest,
        offset
      ); //faster?
    }
    return dest;
  },

  slopes_monotone: function(source) {
    var inLen = source.length;
    var slope = new Array(inLen); // an array for slopes
    var m = new Array(inLen); //an empty array for tangents (new slope parameter)
    var a = new Array(inLen); //an empty array for factors
    var b = new Array(inLen); //an empty array for factors
    var t = new Array(inLen); //an empty array for factors

    var to_fix = [];
    //compute slopes:
    var smallVal = 1e-30; //avoid divide by zero

    slope[0] =
      (source[1][1] - source[0][1]) / (source[1][0] - source[0][0] + smallVal);
    m[0] = slope[0];
    if (slope[0] === 0) {
      to_fix.push(0);
    }

    for (var i = 1; i < inLen - 1; i++) {
      //var y0 = source[i][1];
      //var y1 = source[i+1][1];
      //var dx = source[i+1][0]-source[i][0]+smallVal;
      //slope[i] = (y1-y0)/dx;
      slope[i] =
        (source[i + 1][1] - source[i][1]) /
        (source[i + 1][0] - source[i][0] + smallVal);
      m[i] = (slope[i - 1] + slope[i]) / 2.0;
      if (slope[i] === 0.0) {
        to_fix.push(i);
      }
    }
    m[inLen - 1] = slope[inLen - 2];

    for (i = 0; i < to_fix.length; i++) {
      m[to_fix[i]] = 0.0;
      m[to_fix[i] + 1] = 0.0;
    }
    to_fix = [];
    for (i = 0; i < inLen - 1; i++) {
      a[i] = m[i] / slope[i];
      b[i] = m[i + 1] / slope[i];
      var dist = a[i] * a[i] + b[i] * b[i];
      t[i] = 3.0 / Math.sqrt(dist);
      if (dist > 9.0) {
        to_fix.push(i);
      }
    }
    for (i = 0; i < to_fix.length; i++) {
      var j = to_fix[i];
      m[j] = t[j] * a[j] * slope[j];
      m[j + 1] = t[j] * b[j] * slope[j];
    }

    // delete a,b,t,slope; //clean up
    return m;
  },

  slopes_shape_preserving: function(pts) {
    var m = new Array(pts.length); // array for new slopes

    //locals
    var w1 = 0.0;
    var w2 = 0.0;
    var h0 = 0.0; //h[k-1]
    var h1 = 0.0; //h[k]
    var slope0 = 0.0; //d[i-1]
    var slope1 = 0.0; //d[i]

    slope0 = this.grad(pts[0], pts[1]); //slope at first point

    for (var i = 1; i < pts.length - 1; i++) {
      slope1 = this.grad(pts[i], pts[i + 1]); //forward looking slope at point [i]
      //if slopes[i-1] or slopes[i] are zero OR opposite signs
      if (slope0 === 0.0 || slope1 === 0.0) {
        //don't overshoot
        m[i] = 0.0;
      } else if (Math.sign(slope0) !== Math.sign(slope1)) {
        //local min/max
        m[i] = 0.0;
      } else {
        h0 = pts[i][0] - pts[i - 1][0];
        h1 = pts[i + 1][0] - pts[i][0];
        w1 = 2.0 * h1 + h0;
        w2 = h1 + 2.0 * h0;
        m[i] = (w1 + w2) / (w1 / slope0 + w2 / slope1);
      }
      slope0 = slope1; //shift slopes
    }
    //quick fix endpoints... need more research to get this totally right
    m[0] = m[1];
    m[pts.length - 1] = m[pts.length - 2];
    return m;
  },

  grad: function(pt1, pt2) {
    /** the gradient (derivative) between two consecutive points (x1,y1) and (x2,y2)
     *  with x1<x2 **/
    return (pt2[1] - pt1[1]) / (pt2[0] - pt1[0]);
  },

  chip_v: function(point1, point2, deriv, freq, resultArray, offset) {
    /** This is the Cubic Hermite Interpolating Polynomial (chip) function taking *Vectors* as arguments:
     *  Point1 and Point2 are consecutive 2-touples (x,y) defining the points between which to interpolate
     *  deriv is a 2-touple (1,2) defining the slope at each point
     *  freq is the number of sample points per unit along the x-axis
     *  resultArray is a pointer to an exisiting 2-touple (x,y) array to which the sample points are appended
     *  offset is the starting index at which points are appended
     * 		note: a new 2-touple is pushed for each new point, offset is treated as current length of array
     *  numPts is returned to report the number of points added **/

    //make code easier to read:
    var x1 = point1[0];
    var x2 = point2[0];
    var y1 = point1[1];
    var y2 = point2[1];
    var yp1 = deriv[0];
    var yp2 = deriv[1];

    ///TODO: maybe just wrap the chip_v function

    //	var a=y1;
    //	var b=yp1;
    var deltax = x2 - x1;
    var deltay = y2 - y1;
    var c = (deltay / deltax - yp1) / deltax;
    var d = (yp1 + yp2 - (2 * deltay) / deltax) / (deltax * deltax);

    var numPts = parseInt(deltax * freq, 10); //this could be zero if spacing is too small

    for (var i = 0; i < numPts; i++) {
      var x = x1 + i / freq;
      resultArray.push(Array(2));
      resultArray[offset + i][0] = x;
      //		resultArray[offset+i][1] = a+(x-x1)*(  b+(x-x1)*(  c+d*(x-x2)  ) );
      resultArray[offset + i][1] =
        y1 + (x - x1) * (yp1 + (x - x1) * (c + d * (x - x2)));
    }
    return numPts;
  }
};
