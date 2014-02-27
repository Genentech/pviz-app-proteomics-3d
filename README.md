# pViz.js/VEP viewer: A browser side only application to view 2D and 3D proteomics features

This application displays proteomics data (Peptide/Spectrum matches and PTM quantification information) and ties them to 3D structures read from PDB files. It is aimed at being a demonstration of the capabilities of the <a href="http://github.com/genentech/pviz/">pViz JavaScript library</a> to display customizable protein features on the sequence.

The demo protein is [ERBB2_HUMAN](http://www.uniprot.org/uniprot/P04626), where both the PSM and PTM have be randomly assigned.  PDB and sequence is parsed from the Uniprot text file via the [Uniprot.js JavaScript library](http://github.com/genentech/uniprot-js).

Check the help menu to have more details on usage.

**Warning:** you must have a WebGL enabled browser to benefit fully from the application (beware of older Internet Explorer and Mac OS X versions).

## Data source
Uniprot text file is downloaded dynamically from [Uniprot web site](http://www.uniprot.org/uniprot/).
Once a 3D structure is selected, the PDB file is downloaded from the [Protein Data Bank](http://www.rcsb.org) web site.
Both theses files are parsed in JavaScript to extract the meaningful information.

For the example, PSM and PTM information reside in 2 TSV files stored in the data directory (information was populated randomly).

###How to adapt the application?
An effort was made to decorrelate data from the application.
It is straightforwards to replace the protein id and the proteomics information sources by other ones.

##A note to developers
###Run it locally
Clone the project, then

    npm install
    bower install

    #if grunt was not installed with -g
    alias grunt=./node_modules/grunt-cli/bin/grunt

    grunt server

Et Voilà

###Deploy

    grunt build
    rsync --recursive --delete dist/* your.host:/your/path/

###A note on GLmol.js
Although GLmol.js was a key component of this application, we had to [fork](https://github.com/alexmasselot/glmol") it and make it compatible with more recent versions of [Three.js](http://threejs.org/) (thanks to the authors for their help on that path).

##Authors
This application is based on the versatile [pViz.js: a dynamic JavaScript & SVG library for visualization of protein sequence features](http://github.com/genentech/pviz) JavaScript library, written by <a href="mailto://masselot.alexandre@gene.com">Alexandre Masselot</a> and <a href="mailto://mukhyala.kiran@gene.com">Kiran Mukhyala</a>, from the Bioinfromatics & Computational Biology Department, at [Genentech Inc.](http://www.gene.com) Research.

##Reference
Please provide a reference to this application by citing:
'''xxx.xx 2014'''

##Thanks to
This app is aimed at demonstrating pViz library.
But it would never have existed without a myriad of other useful an inspiring projects:
[d3.js](http://d3js.org), [color brewer](http://colorbrewer2.org/),
[GLmol.js](http://webglmol.sourceforge.jp/index-en.html) (and more precisely the [forked](https://github.com/alexmasselot/glmol) version to work with recent [Three.js](http://threejs.org/)),
[grunt](http://gruntjs.com/),
[bower](https://npmjs.org/package/bower),
[bootstrap](http://getbootstrap.com/css),
[jQuery](http://jquery.com), [backbone.js](http://backbonejs.org),
[require.js](http://requirejs.org), [underscore.js](http://underscorejs.org).


###Continuous integration
Minification, distribution etc. can be launched in a CI environment via ant tasks (./build.xml)

###Authors
This library was initiated by
Alexandre Masselot (masselot.alexandre@gene.com) & Kiran Mukhyala (mukhyala.kiran@gene.com) within Genentech Bioinformatics & Computational Biology Department.

###License
The library is distributed under a BSD license. Full description can be found in [LICENSE.txt](LICENSE.txt)
