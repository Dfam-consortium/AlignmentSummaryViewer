# Alignment Summary Viewer

![picture alt](https://github.com/rmhubley/AlignmentSummaryViewer/blob/master/conf/AlignmentSummaryViewer.png "Screenshot of example multiple alignemnt")

## Introduction

The Alignment Summary Viewer is a visualization component for 
biological multiple sequence alignments ( DNA or protein ).  It 
provides a high level overview of the quality and and coverage
characteristics which are useful when dealing with an unweildy
number of sequences. 

The summary view is an extension of a whisker plot which depicts
the relative position and extents of each alignment as a single
horizontal bar.  The quality of individual alignments is further
characterized using colors to represent a supplied quality metric 
over non-overlapping windows.

An Angular directive wrapper for this component is provided for 
Angular 1.5.

## Data format

This specialized multiple alignment data format was developed for this 
component in order to minimize the payload and push some pre-processing 
of the data onto the server.  

The component expects a JSON object containing summary information and
and array of per sequence details.  

## Summary Fields

- __length__: The overall length of the multiple alignment not including insertion/deletion columns.
- __qualityBlockLen__: The length of the non-overlapping quality windows over each sequence.
- __numAlignments__: The number of sequences aligned ( length of alignments array ).
- __alignments__: The array of aligned sequence records.

## Aligned Sequence Record
Array containing the following ordered fields:
- __0__: The sequence identifier.
- __1__: Start position in the multiple alignment.
- __2__: Length of aligned sequence ( not including insertion/deletion positions ).
- __3__: An array contain the quality values ( 1-lowest to 10-highest) for each qualityBlockLen length window over the sequence. The last value may represent a window less than qualityBlockLen length.
- __4__: The orientation of the aligned sequence ( "F"-forward, "R"-reverse ).
- __5__: The start position within the aligned sequence.
- __6__: The end position within the aligned sequence. 

The following is an example JSON object containing two sequences:

```
    {
      "length": 804,
      "qualityBlockLen": 10,
      "num_alignments": 2,
      "alignments": [
        ["seq1", 8, 141, [9, 8, 10, 8, 6, 10, 9, 9, 9, 9, 10, 10, 10, 8]
, "F", "0.12", "201", "341"],
        ["seq2", 1, 172, [9, 9, 8, 9, 9, 7, 10, 10, 8, 10, 10, 10, 9, 
8, 9, 10, 8], "F", "0.10", "201", "371"],
      ]
    };
```

## Usage Example

HTML code to display a static dataset:

```html
  <html>
    <div id="canvasesdiv">
      <canvas id="alignment_canvas" width="800" height="1600">Canvas not supported</canvas>
    </div>
    <script src='dist/AlignmentSummaryViewer.min.js'></script>
    <script>
      var summaryData = { #INSERT_YOUR_JSON_DATASET_HERE# };
      var mySummary = new AlignmentSummaryViewer( 
                            document.getElementById('alignment_canvas'),
                            summaryData, {});
      // To avoid bluring caused by canvas auto-scaling the following code
      // automatically adjusts the component size an redraws the elements.
      window.onresize = function(event) {
        if ( mySummary != null ) {
          mySummary.resetHeight();
          mySummary.render('norm');
        }
      };
    </script>
  </html>
```

See the angular-example.html file for using the component as a Angular directive.


