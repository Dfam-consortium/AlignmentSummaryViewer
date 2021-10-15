(function(global) {
  'use strict';

  function AlignmentSummaryViewer(align_canvas, parent_element, json, _options) {
    this.json = json;
    this.align_canvas = align_canvas;
    this.parent_element = parent_element;

    this.cursorImage = null;
    this.cursorImageStartX = 0;
    this.cursorImageStartY = 0;
    this.cursorImageWidth = 0;
    this.cursorImageHeight = 0;

    // Layout Constants
    this.fontSize = 10;
    this.minLeftMargin = 55;
    this.minTopMargin = 10;
    this.minBottomMargin = 10;
    this.coverageGraphHeight = 125;
    this.legendHeight = 30;
    this.alignmentGlyphHeight = 2;
    this.alignmentSpacing = 0;
    this.rulerHeight = 20;
    this.yAxisFontSize = 10;
    this.rulerVerticalMargin = 10;
    // Controls smoothing of alignment colors - Must be between 0 - 1
    this.gradientWindowFrac = 0.1;

    // Convenience Layout Values
    this.coverageGraphStartY = this.minTopMargin;
    this.rulerStartY = this.coverageGraphStartY + this.coverageGraphHeight;
    this.alignmentGraphStartY = this.rulerStartY + this.rulerHeight;
    this.legendStartY = this.alignmentGraphStartY + (this.json.alignments.length * (this.alignmentGlyphHeight + this.alignmentSpacing));


    var obj = this;

    this.align_canvas.addEventListener('mousemove', function(evt) {
      var rect = align_canvas.getBoundingClientRect();
      var mousePos = {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
      obj.renderCrosshair(mousePos.x, mousePos.y);
    });

    this.align_canvas.addEventListener('mouseout', function(_evt) {
      // If the cursor leaves the widget make sure we attempt to remove
      // the crosshair
      if (obj.cursorImage !== null) {
        // Restore previous slice
        obj.align_context.putImageData(obj.cursorImage, obj.cursorImageStartX, obj.cursorImageStartY);
      }
    });

    // Get drawing contexts
    this.align_context = this.align_canvas.getContext('2d');

    // Heatmap Colors
    this.qualColor = ['#ff6600', '#ff9900', '#ccff00', '#66ff00', '#00ff00',
      '#99ff66', '#00ffcc', '#33ccff', '#3399ff', '#3333ff'
    ];

    this.currRulerY = 0;

    // Resize and render
    this.resize();
  }

  AlignmentSummaryViewer.prototype.setData = function(json) {
    this.json = json;
    this.align_context.clearRect(0, 0, this.align_canvas.width,
                                 this.align_canvas.height);
    this.legendStartY = this.alignmentGraphStartY + (this.json.alignments.length * (this.alignmentGlyphHeight + this.alignmentSpacing));
    this.cursorImage = null;
    // resize and render
    this.resize();
  };

  AlignmentSummaryViewer.prototype.renderCrosshair = function(x, y) {
    var ctx = this.align_context;
    // Convert x/y coordinates to bp
    var unitsPerPixel = this.json.length / (this.align_canvas.width - this.minLeftMargin);
    var bp = Math.floor((unitsPerPixel * (x - this.minLeftMargin))) + 1;
    var textWidth = this.align_context.measureText('' + this.json.length).width;
    var circleDiameter = textWidth + 6;

    if (this.cursorImage !== null) {
      // Restore previous slice
      ctx.putImageData(this.cursorImage, this.cursorImageStartX, this.cursorImageStartY);
      this.cursorImage = null;
    }

    // Are x/y within the whisker plot area?
    if (y >= this.alignmentGraphStartY && y < this.legendStartY &&
      x > this.minLeftMargin) {
      // Save slice for later restoration
      this.cursorImageStartX = x - (circleDiameter * 2);
      this.cursorImageStartY = this.rulerStartY;
      this.cursorImageWidth = circleDiameter + (circleDiameter * 2);
      this.cursorImageHeight = this.legendStartY - this.rulerStartY;
      this.cursorImage = ctx.getImageData(this.cursorImageStartX, this.cursorImageStartY, this.cursorImageWidth, this.cursorImageHeight);

      // draw crosshair line
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, this.rulerStartY);
      ctx.lineTo(x, this.legendStartY - 1);
      ctx.stroke();

      // Don't let circle render above ruler
      if (y - circleDiameter < this.rulerStartY) {
        y = this.rulerStartY + circleDiameter + 2;
      }
      // Don't let circle get clipped by right edge
      var circleX = x;
      if (x + (circleDiameter / 2) > this.align_canvas.width) {
        circleX = this.align_canvas.width - (circleDiameter / 2);
      }

      // draw position circle
      ctx.beginPath();
      ctx.arc(circleX, y - (circleDiameter / 2), circleDiameter / 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.stroke();
      this.align_context.fillStyle = '#000000';
      textWidth = this.align_context.measureText('' + bp).width;
      ctx.fillText('' + bp, circleX - (textWidth / 2), y - (circleDiameter / 2) + (this.fontSize / 2) - 1);
    }
  };

  AlignmentSummaryViewer.prototype.resize = function() {
    // We don't want the canvas to get scaled through CSS.  This
    // mechanism treats the canvas as an image and blurs the heck
    // out of it.  In order to automatically get it fill the
    // size of the viewable area *and* not blur *and* not
    // go under the potential scrollbar is to do what I did
    // below:
    //   old -- causes blur: this.align_canvas.style.width = '100%';
    //                       this.align_canvas.style.height = '100%';
    //                       this.align_canvas.width = this.align_canvas.offsetWidth;
    //   newer:
    this.align_canvas.width = this.parent_element.offsetWidth;
    this.align_canvas.height = this.minTopMargin +
    this.coverageGraphHeight +
    this.rulerHeight +
    (this.json.alignments.length * (this.alignmentGlyphHeight + this.alignmentSpacing)) +
    this.legendHeight +
    this.minBottomMargin;
    this.render('norm');
  };


  AlignmentSummaryViewer.prototype.ruler = function(x, y, width, height, minVal, maxVal, minorTickInterval, majorTickInterval) {
    this.align_context.beginPath();
    this.align_context.moveTo(x, y);
    this.align_context.lineTo(x + width, y);
    this.align_context.stroke();
    var fontPixelSize = 10;
    this.align_context.font = 'normal ' + fontPixelSize + 'px Arial';

    if (height < (fontPixelSize * 2)) {
      console.log('Error AlignmentSummaryViewer ruler height must be >= ' + (fontPixelSize * 2) + 'px');
      return;
    }

    // Translations
    var pixelsPerUnit = width / (maxVal - minVal + 1);
    var pixelsPerMajorTick = majorTickInterval * pixelsPerUnit;
    var pixelsPerMinorTick = minorTickInterval * pixelsPerUnit;
    var majorTickHeight = (height - fontPixelSize) - 2;
    var minorTickHeight = majorTickHeight / 2;

    this.align_context.fillStyle = '#000000';

    // TODO: Consider limiting rendering when width is too small.
    var i = 0;
    if (pixelsPerMajorTick > 0) {
      var tick = 0;
      for (i = pixelsPerMajorTick; i < width; i += pixelsPerMajorTick) {
        tick = tick + 1;
        this.align_context.beginPath();
        this.align_context.moveTo(x + i, y);
        this.align_context.lineTo(x + i, y + majorTickHeight);
        this.align_context.stroke();
        // Center values on tick
        var fontWidth = this.align_context.measureText('' + (tick * majorTickInterval)).width;
        this.align_context.fillText('' + (tick * majorTickInterval), x + i - (fontWidth / 2), y + majorTickHeight + fontPixelSize);
      }
    }

    if (pixelsPerMinorTick > 0) {
      for (i = pixelsPerMinorTick; i < width; i += pixelsPerMinorTick) {
        this.align_context.beginPath();
        this.align_context.moveTo(x + i, y);
        this.align_context.lineTo(x + i, y + minorTickHeight);
        this.align_context.stroke();
      }
    }
  };


  AlignmentSummaryViewer.prototype.coverageGraph = function(starty, height) {
    var noFill = 0;
    var alignments = this.json.alignments;
    var depth = [];
    var unitsPerPixel = this.json.length / (this.align_canvas.width - this.minLeftMargin);
    var pixelsPerUnit = (this.align_canvas.width - this.minLeftMargin) / this.json.length;
    var ctx = this.align_context;

    // The top-most tic must be 1/2 the font height from the
    // top to accomodate the y-axis label
    var topMargin = starty + (this.yAxisFontSize / 2);
    var dataHeight = (height - (topMargin - starty));

    // Draw y-axis of evil
    ctx.beginPath();
    ctx.moveTo(this.minLeftMargin - 1, topMargin);
    ctx.lineTo(this.minLeftMargin - 1, starty + height);
    ctx.stroke();

    // Draw coverage graph y-axis label
    ctx.save();
    ctx.translate(10, (height / 2));
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = 'normal 10px Arial';
    ctx.fillText('Number of Matches', 1, 0);
    ctx.restore();

    // Height must be at least bigger than the margin, if not give up.
    if (height <= topMargin)
      return;

    var maxDepth = 0;
    var i = 0;
    var j = 0;
    for (i = 0; i < alignments.length; i += 1) {
      // Provided coordinates are 1-based, graphics are 0-based
      var start = alignments[i][1] - 1;
      var len = alignments[i][2];
      for (j = start; j <= start + len; j += 1) {
        if (depth[j] !== undefined) {
          depth[j] = depth[j] + 1;
          if (depth[j] > maxDepth) {
            maxDepth = depth[j];
          }
        } else {
          depth[j] = 1;
          if (depth[j] > maxDepth) {
            maxDepth = depth[j];
          }
        }
      }
    }

    if (maxDepth < 10) {
      maxDepth = 10;
    }

    // draw coverage-graph y-axis maximum value
    var textWidth = this.align_context.measureText('' + maxDepth).width;
    ctx.fillText('' + maxDepth, this.minLeftMargin - textWidth - 8, starty + this.yAxisFontSize);
    ctx.beginPath();
    ctx.moveTo(this.minLeftMargin, topMargin);
    ctx.lineTo(this.minLeftMargin - 5, topMargin);
    ctx.stroke();

    // draw y-ticks ( also borrowed from graphic.js )
    var y_start = 0;
    var y_ticks = this.nice_bounds(0, maxDepth, 5);
    var y_max_bottom = 10;
    for (y_start = y_ticks.steps; y_start < y_ticks.max; y_start += y_ticks.steps) {
      var y = (starty + height) - (this.scale(y_start, maxDepth, dataHeight));
      if (y <= y_max_bottom) {
        break;
      }
      var x = this.minLeftMargin;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5, y);
      ctx.stroke();

      var y_text = '' + y_start;
      textWidth = ctx.measureText(y_text).width;
      ctx.fillText(y_text, x - textWidth - 8, y);
    }


    var depthScale = dataHeight / maxDepth;

    this.align_context.fillStyle = '#739025';
    this.align_context.strokeStyle = '#000000';
    var curX = this.minLeftMargin;
    if (unitsPerPixel >= 1) {
      var graphWidth = this.align_canvas.width - this.minLeftMargin;
      // var curDepth = height;
      this.align_context.beginPath();
      this.align_context.moveTo(curX, starty + height - 1);

      // weighted average depth
      var curBase = 0;
      for (i = 0; i < graphWidth; i += 1) {
        var sumCoverage = 0;
        // Whole depth components
        for (j = 0; j < Math.floor(unitsPerPixel); j += 1) {
          sumCoverage += depth[Math.floor(curBase) + j];
        }
        // Fractional depth component
        sumCoverage += (depth[Math.floor(curBase) + j + 1] * (unitsPerPixel % 1));
        var weightedAverageDepth = sumCoverage / unitsPerPixel;
        curBase += unitsPerPixel;

        this.align_context.lineTo(curX,
                         starty + height - (weightedAverageDepth * depthScale) - 1);
        curX = curX + 1;
      }
      if (noFill === 0) {
        this.align_context.lineTo(curX, starty + height - 1);
        this.align_context.lineTo(0, starty + height - 1);
        this.align_context.fill();
      } else {
        this.align_context.stroke();
      }
      this.align_context.closePath();
    } else {
      this.align_context.beginPath();
      this.align_context.moveTo(curX, starty + height - 1);

      for (i = 0; i < this.json.length; i += 1) {
        var coverage = depth[i];
        // This point is located at the top-left corner of the ith segment
        this.align_context.lineTo(curX, starty + height - (coverage * depthScale) - 1);

        curX = curX + pixelsPerUnit;
      }
      // This point is located at the top-left corner of just past
      // the last segment, closing the top part of the line.
      this.align_context.lineTo(curX, starty + height - (coverage * depthScale) - 1);

      if (noFill === 0) {
        this.align_context.lineTo(curX, starty + height - 1);
        this.align_context.lineTo(0, starty + height - 1);
        this.align_context.fill();
      } else {
        this.align_context.stroke();
      }
      this.align_context.closePath();
    }
  };


  // Nice utility for assisting in axis tic generation borrowed from
  // the Dfam website graphics.js - probably written by Jody Clements,
  // Rob Finn or Travis Wheeler ( or all of them ).
  AlignmentSummaryViewer.prototype.nice_bounds = function(axis_start, axis_end, num_ticks) {
    num_ticks = num_ticks || 10;
    var true_axis_end = axis_end;
    var axis_width = axis_end - axis_start;

    if (axis_width === 0) {
      axis_start -= 0.5;
      axis_end += 0.5;
      axis_width = axis_end - axis_start;
    }

    var nice_range = this.nice_number(axis_width);
    var nice_tick = this.nice_number(nice_range / (num_ticks - 1), true);
    axis_start = Math.floor(axis_start / nice_tick) * nice_tick;
    axis_end = Math.ceil(axis_end / nice_tick) * nice_tick;
    if ((true_axis_end - axis_end) < (nice_tick / 4)) {
      axis_end = Math.floor(true_axis_end / nice_tick) * nice_tick;
    }

    return {
      min: axis_start,
      max: axis_end,
      steps: nice_tick
    };
  };

  AlignmentSummaryViewer.prototype.nice_number = function(value, round_) {
    // default value for round_ is false
    round_ = round_ || false;
    // :latex: \log_y z = \frac{\log_x z}{\log_x y}
    var exponent = Math.floor(Math.log(value) / Math.log(10));
    var fraction = value / Math.pow(10, exponent);
    var nice_fraction;

    if (round_)
      if (fraction < 1.5)
        nice_fraction = 1.0;
      else if (fraction < 3.0)
        nice_fraction = 2.0;
      else if (fraction < 7.0)
        nice_fraction = 5.0;
      else
        nice_fraction = 10.0;
    else if (fraction <= 1)
      nice_fraction = 1.0;
    else if (fraction <= 2)
      nice_fraction = 2.0;
    else if (fraction <= 5)
      nice_fraction = 5.0;
    else
      nice_fraction = 10.0;

    return nice_fraction * Math.pow(10, exponent);
  };

  AlignmentSummaryViewer.prototype.scale = function(coord, orig, desired) {
    var scaled = (desired * coord) / orig;
    return scaled;
  };


  //
  //
  //
  AlignmentSummaryViewer.prototype.render = function(order) {
    // TODO: replace these below rather than redefining them
    var alignmentGlyphHeight = this.alignmentGlyphHeight;
    var alignmentSpacing = this.alignmentSpacing;
    var rulerHeight = this.rulerHeight;
    var rulerVerticalMargin = this.rulerVerticalMargin;
    var coverageGraphHeight = this.coverageGraphHeight;
    var gradientWindowFrac = this.gradientWindowFrac;

    // Derived visual properties
    var viewWidth = this.align_canvas.width - this.minLeftMargin;
    var xScale = viewWidth / this.json.length;
    var alignments = this.json.alignments;
    var qualWidthBP = this.json.qualityBlockLen;
    var qualBlockPixelWidth = (qualWidthBP * xScale);
    var alignmentDataHeight = alignments.length * (this.alignmentGlyphHeight + this.alignmentSpacing);

    // Clear cursor image
    this.cursorImage = null;

    // Clear overlayed canvases
    this.align_context.clearRect(0, 0, this.align_canvas.width,
      this.align_canvas.height);

    var ctx = this.align_context;
    // Draw y-axis of evil
    ctx.beginPath();
    ctx.moveTo(this.minLeftMargin - 1, this.rulerStartY);
    ctx.lineTo(this.minLeftMargin - 1, this.rulerStartY + this.rulerHeight + alignmentDataHeight);
    ctx.stroke();

    // Draw whisker plot y-axis label
    ctx.save();
    ctx.translate(10, this.alignmentGraphStartY + (alignmentDataHeight / 2));
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = 'normal 10px Arial';
    ctx.fillText('Sequence', 1, 0);
    ctx.restore();

    // draw whisker plot y-axis minimum value
    var textWidth = this.align_context.measureText('1').width;
    ctx.fillText('1', this.minLeftMargin - textWidth - 8, this.alignmentGraphStartY + (this.yAxisFontSize / 2));
    ctx.beginPath();
    ctx.moveTo(this.minLeftMargin, this.alignmentGraphStartY + 1);
    ctx.lineTo(this.minLeftMargin - 5, this.alignmentGraphStartY + 1);
    ctx.stroke();

    // draw whisker plot y-axis maximum value
    textWidth = this.align_context.measureText('' + alignments.length).width;
    ctx.fillText('' + alignments.length, this.minLeftMargin - textWidth - 8, this.alignmentGraphStartY + alignmentDataHeight);
    ctx.beginPath();
    ctx.moveTo(this.minLeftMargin, this.alignmentGraphStartY + alignmentDataHeight);
    ctx.lineTo(this.minLeftMargin - 5, this.alignmentGraphStartY + alignmentDataHeight);
    ctx.stroke();

    var legendStartY = this.legendStartY + 15;
    var legendStartX = this.minLeftMargin + 20;
    var legendWidth = 100;
    var legendHeight = 5;
    var legendGrd = this.align_context.createLinearGradient(legendStartX, 0, legendStartX + legendWidth, 0);
    var stopIncr = 1 / this.qualColor.length;
    var i = 0;
    for (i = 0; i < this.qualColor.length; i += 1) {
      legendGrd.addColorStop(stopIncr * i, this.qualColor[i]);
    }
    ctx.fillStyle = legendGrd;
    ctx.fillRect(legendStartX, legendStartY, legendWidth, legendHeight);
    ctx.fillStyle = '#000000';
    ctx.fillText('Alignment quality over ' + qualWidthBP + 'bp non-overlapping windows', legendStartX + legendWidth + 10, legendStartY + this.yAxisFontSize);
    ctx.fillText('low', legendStartX, legendStartY + legendHeight + this.yAxisFontSize);
    textWidth = this.align_context.measureText('high').width;
    ctx.fillText('high', legendStartX + legendWidth - textWidth, legendStartY + legendHeight + this.yAxisFontSize);

    // Select ordering
    if (order == 'orient') {
      alignments.sort(function(a, b) {
        if (a[4] === b[4]) {
          if (a[4] === 'R') {
            if (a[1] === b[1]) {
              return (b[2] - a[2]);
            } else {
              return (a[1] - b[1]);
            }
          } else {
            if (a[1] === b[1]) {
              return (a[2] - b[2]);
            } else {
              return (b[1] - a[1]);
            }
          }
        } else {
          return a[4] < b[4] ? -1 : a[4] > b[4] ? 1 : 0;
        }
      });
    } else if (order == 'end') {
      alignments.sort(function(a, b) {
        if ((a[1] + a[2]) == (b[1] + b[2])) {
          return (a[1] - b[1]);
        } else {
          return ((b[1] + b[2]) - (a[1] + a[2]));
        }
      });
    } else if (order == 'div') {
      alignments.sort(function(a, b) {
        return (a[5] - b[5]);
      });
    } else {
      alignments.sort(function(a, b) {
        if (a[1] === b[1]) {
          return (b[2] - a[2]);
        } else {
          return (a[1] - b[1]);
        }
      });
    }

    this.coverageGraph(this.coverageGraphStartY, this.coverageGraphHeight);
    var curY = 0;
    var referenceDrawn = 0;
    if (order != 'orient') {
      var x_ticks = this.nice_bounds(1, this.json.length, 10).steps;
      this.ruler(this.minLeftMargin, this.rulerStartY, viewWidth, rulerHeight, 1, this.json.length, x_ticks / 10, x_ticks);
      this.currRulerY = 0;
      curY = rulerVerticalMargin + rulerHeight + coverageGraphHeight;
      referenceDrawn = 1;
    }

    for (i = 0; i < alignments.length; i += 1) {
      if (referenceDrawn === 0 && alignments[i][4] == 'R') {
        curY = curY + rulerVerticalMargin;
        this.currRulerY = curY + (i * (alignmentSpacing + alignmentGlyphHeight));
        curY = curY + rulerHeight + rulerVerticalMargin + coverageGraphHeight;
        referenceDrawn = 1;
      }

      // Provided coordinates are 1-based.  Graphic positions are 0 based.
      var xOffset = alignments[i][1] - 1;
      var qualities = alignments[i][3];
      var qualIdx = 0;

      var currQualVal;
      var nextQualVal;

      var j;
      for (j = 0; j < alignments[i][2]; j += qualWidthBP) {
        // The quality blocks should be sufficient to cover the entire range of
        // aligned seuqence.  I.e if there are 189 bp of aligned sequence and
        // the quality block length is 10bp then there should 19 quality values.
        // Some providers rounded down and only supplied 18 values in this
        // example.  We handle this here by using the last quality value as
        // a stand-in.
        if (qualIdx == qualities.length)
          qualIdx = qualIdx - 1;
        currQualVal = qualities[qualIdx];
        if (qualIdx == qualities.length - 1)
          nextQualVal = currQualVal;
        else
          nextQualVal = qualities[qualIdx + 1];

        // X Pixel position of quality block start
        var blockXPos = this.minLeftMargin + ((xOffset + j) * xScale);
        // var blockXPos = ((xOffset + j) * xScale);


        var grd = this.align_context.createLinearGradient(
          blockXPos, 0,
          blockXPos + qualBlockPixelWidth, 0);

        grd.addColorStop(0, this.qualColor[currQualVal - 1]);
        grd.addColorStop(1 - gradientWindowFrac, this.qualColor[currQualVal - 1]);
        grd.addColorStop(1, this.qualColor[nextQualVal - 1]);

        this.align_context.fillStyle = grd;

        // HACK: Draw inner blocks one half base pair wider to avoid "seams" caused by rounding errors
        var blockSize = (qualWidthBP + 0.5) * xScale;
        if (j + qualWidthBP >= alignments[i][2]) {
          // Don't add filler on the last block
          blockSize = (alignments[i][2] - j) * xScale;
        }
        this.align_context.fillRect(blockXPos,
          curY + (i * (alignmentSpacing + alignmentGlyphHeight)), blockSize,
          alignmentGlyphHeight);

        if ((blockXPos + blockSize) > (viewWidth + this.minLeftMargin)) {
        }

        qualIdx++;
      }
    }
  };

  if (typeof module === 'object' && module && typeof module.exports === 'object') {
    // Expose functions/objects for loaders that implement the Node module pattern.
    module.exports = AlignmentSummaryViewer;
  } else {
    // Otherwise expose ourselves directly to the global object.
    global.AlignmentSummaryViewer = AlignmentSummaryViewer;
    // Register as a named AMD module.
    if (typeof define === 'function' && define.amd) {
      define('alignmentsummaryviewer', [], function() {
        return AlignmentSummaryViewer;
      });
    }
  }
}(this.window || (typeof global != 'undefined' && global) || this));
